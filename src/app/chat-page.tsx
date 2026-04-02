"use client";

import { ChangeEvent, useRef, useState } from "react";

type ViewMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DecisionItem = {
  name: string;
  reason: string;
  enabled: boolean;
};

type ContextHint = {
  type: string;
  label: string;
  content: string;
};

type LlmInfo = {
  provider: string;
  model: string;
};

type ConversationListItem = {
  conversationId: string;
  updatedAt: string;
  preview: string;
  messageCount: number;
};

type StreamMetaEvent = {
  type: "meta";
  conversationId: string;
  replyId: string;
  toolDecisions: DecisionItem[];
  skillDecisions: DecisionItem[];
  contextHints: ContextHint[];
  llm: LlmInfo;
};

type StreamChunkEvent = {
  type: "chunk";
  content: string;
};

type StreamDoneEvent = {
  type: "done";
  streamed?: boolean;
};

type StreamEvent = StreamMetaEvent | StreamChunkEvent | StreamDoneEvent;

const starterPrompts = [
  "帮我规划这个产品的前端聊天入口",
  "我想做简历解析和 JD 匹配，先给我方案",
  "判断这个需求需要哪些插件和 skills",
];

function bubbleClass(role: ViewMessage["role"]) {
  if (role === "user") {
    return "self-end bg-slate-950 text-white text-right";
  }

  return "self-start border border-slate-200 bg-white text-slate-800 text-left";
}

function toViewMessages(
  messages: Array<{ id: string; role: string; content: string }>,
): ViewMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      id: message.id,
      role: message.role as ViewMessage["role"],
      content: message.content,
    }));
}

type ChatPageProps = {
  onLogout: () => void;
};

type PendingAttachment = {
  name: string;
  size: number;
  type: string;
  textContent: string;
};

const MAX_ATTACHMENT_BYTES = 200 * 1024;

function formatBytes(size: number) {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

async function readAttachment(file: File): Promise<PendingAttachment> {
  const text = await file.text();
  const content =
    text.length > 8000
      ? `${text.slice(0, 8000)}\n...[file content truncated]`
      : text;

  return {
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    textContent: content,
  };
}

export function ChatPage({ onLogout }: ChatPageProps) {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [messages, setMessages] = useState<ViewMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "请输入你的需求。当前入口会先判断意图，再决定是否需要补充上下文、工具或技能。",
    },
  ]);
  const [toolDecisions, setToolDecisions] = useState<DecisionItem[]>([]);
  const [skillDecisions, setSkillDecisions] = useState<DecisionItem[]>([]);
  const [contextHints, setContextHints] = useState<ContextHint[]>([]);
  const [llmInfo, setLlmInfo] = useState<LlmInfo>({
    provider: "ollama",
    model: "qwen2.5:7b",
  });
  const [streamMode, setStreamMode] = useState<"streaming" | "fallback">("streaming");
  const [historyItems, setHistoryItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refreshHistory() {
    try {
      const response = await fetch(`/api/chat/conversations`);
      if (!response.ok) return;

      const data = (await response.json()) as {
        items: ConversationListItem[];
      };
      setHistoryItems(data.items);
    } catch {}
  }

  async function loadConversation(targetConversationId: string) {
    try {
      const response = await fetch(
        `/api/chat/${targetConversationId}`,
      );
      if (!response.ok) return;

      const data = (await response.json()) as {
        conversationId: string;
        messages: Array<{ id: string; role: string; content: string }>;
      };

      setConversationId(data.conversationId);
      setMessages(toViewMessages(data.messages));
    } catch {}
  }

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if ((!trimmed && pendingAttachments.length === 0) || loading) return;

    const withAttachmentSummary =
      pendingAttachments.length === 0
        ? trimmed
        : `${trimmed || "请结合附件内容进行分析。"}\n\n[Attached files]\n${pendingAttachments
            .map((file, index) => `${index + 1}. ${file.name} (${formatBytes(file.size)})`)
            .join("\n")}`;

    const attachmentContext =
      pendingAttachments.length === 0
        ? ""
        : `\n\n[Attachment content]\n${pendingAttachments
            .map(
              (file) =>
                `### ${file.name} (${file.type}, ${formatBytes(file.size)})\n${file.textContent}`,
            )
            .join("\n\n")}`;

    const outgoingMessage = `${withAttachmentSummary}${attachmentContext}`;

    const userMessage: ViewMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: withAttachmentSummary,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPendingAttachments([]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: outgoingMessage,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("chat_request_failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let activeReplyId = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          const event = JSON.parse(line) as StreamEvent;

          if (event.type === "meta") {
            activeReplyId = event.replyId;
            setConversationId(event.conversationId);
            setToolDecisions(event.toolDecisions);
            setSkillDecisions(event.skillDecisions);
            setContextHints(event.contextHints);
            setLlmInfo(event.llm);
            setMessages((current) => [
              ...current,
              {
                id: event.replyId,
                role: "assistant",
                content: "",
              },
            ]);
          }

          if (event.type === "chunk") {
            setMessages((current) =>
              current.map((item) =>
                item.id === activeReplyId
                  ? {
                      ...item,
                      content: `${item.content}${event.content}`,
                    }
                  : item,
              ),
            );
          }

          if (event.type === "done") {
            setStreamMode(event.streamed ? "streaming" : "fallback");
          }
        }
      }

      await refreshHistory();
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "请求失败，当前聊天编排器未成功返回结果。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const readableFiles = files.filter((file) => file.size <= MAX_ATTACHMENT_BYTES);
    const parsed = await Promise.all(readableFiles.map((file) => readAttachment(file)));
    setPendingAttachments((current) => [...current, ...parsed]);
    event.target.value = "";
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe4d2_0%,#f8f4ed_48%,#fffdf8_100%)] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col gap-4">
        <section className="flex min-h-[72vh] flex-col rounded-[30px] border border-black/5 bg-white/88 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Chat Driven Entry
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Interview Agent Console
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700">
                {llmInfo.provider} / {llmInfo.model}
              </div>
              <div className="rounded-full bg-slate-950 px-4 py-2 text-white">
                {conversationId ?? "新对话"}
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-100"
              >
                退出登录
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  void sendMessage(prompt);
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                {prompt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                void refreshHistory();
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              刷新历史
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[auto_1fr]">
            <aside
              className={`rounded-[26px] border border-slate-200 bg-white p-4 transition-all ${
                sidebarCollapsed ? "w-16" : "w-[18rem]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {!sidebarCollapsed ? (
                  <p className="text-sm font-medium text-slate-900">历史会话</p>
                ) : (
                  <p className="text-sm font-medium text-slate-900">会话</p>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((current) => !current)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  {sidebarCollapsed ? ">" : "<"}
                </button>
              </div>
              {!sidebarCollapsed ? (
                <div className="mt-4 space-y-3">
                  {historyItems.length === 0 ? (
                    <p className="text-sm leading-7 text-slate-500">
                      当前还没有可读取的历史会话。
                    </p>
                  ) : (
                    historyItems.map((item) => (
                      <button
                        key={item.conversationId}
                        type="button"
                        onClick={() => {
                          void loadConversation(item.conversationId);
                        }}
                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                      >
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.conversationId}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-600">
                          {item.preview || "无预览"}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.messageCount} 条消息
                        </p>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {historyItems.slice(0, 8).map((item) => (
                    <button
                      key={item.conversationId}
                      type="button"
                      title={item.conversationId}
                      onClick={() => {
                        void loadConversation(item.conversationId);
                      }}
                      className="block h-9 w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-2 text-left text-xs text-slate-700 hover:bg-slate-100"
                    >
                      {item.conversationId}
                    </button>
                  ))}
                </div>
              )}
            </aside>
            <div className="flex min-h-[28rem] flex-col gap-4 overflow-y-auto rounded-[26px] bg-[#fbfaf7] p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`w-fit max-w-[min(46rem,92%)] rounded-[24px] px-4 py-3 text-sm leading-7 md:text-base [hyphens:none] [overflow-wrap:normal] [word-break:keep-all] ${bubbleClass(
                    message.role,
                  )}`}
                >
                  <p className="mb-1 text-xs uppercase tracking-[0.22em] opacity-60">
                    {message.role}
                  </p>
                  <p className="whitespace-pre-wrap break-keep">
                    {message.content || "..."}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入需求，例如：先做一个前端对话入口，后端判断使用哪些插件和 skills。"
              className="min-h-28 w-full resize-none border-0 bg-transparent text-sm leading-7 text-slate-800 outline-none md:text-base [hyphens:none] [overflow-wrap:normal] [word-break:keep-all]"
            />
            {pendingAttachments.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {pendingAttachments.map((file) => (
                  <span
                    key={`${file.name}-${file.size}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    {file.name} ({formatBytes(file.size)})
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                当前模式：{streamMode === "streaming" ? "真实流式回复" : "回退流式回复"} +
                意图判断
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleSelectFiles}
                  className="hidden"
                  accept=".txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py,.java,.go,.rs,.sql,.yaml,.yml"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                  title="添加文件"
                >
                  📎
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void sendMessage(input);
                  }}
                  disabled={loading}
                  className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {loading ? "流式生成中..." : "发送"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-black/5 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Tool Decisions</p>
            <div className="mt-4 space-y-3">
              {toolDecisions.length === 0 ? (
                <p className="text-sm leading-7 text-slate-600">
                  发送消息后，这里会显示后端判断要启用哪些工具。
                </p>
              ) : (
                toolDecisions.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.name}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          item.enabled
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {item.enabled ? "enabled" : "idle"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-black/5 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Skill Decisions</p>
            <div className="mt-4 space-y-3">
              {skillDecisions.length === 0 ? (
                <p className="text-sm leading-7 text-slate-600">
                  当前还没有技能选择结果。
                </p>
              ) : (
                skillDecisions.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.name}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          item.enabled
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {item.enabled ? "enabled" : "idle"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-black/5 bg-slate-950 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
            <p className="text-sm text-slate-400">Context Hints</p>
            <div className="mt-4 space-y-3">
              {contextHints.length === 0 ? (
                <p className="text-sm leading-7 text-slate-300">
                  当前还没有补充上下文。
                </p>
              ) : (
                contextHints.map((hint) => (
                  <div
                    key={`${hint.type}-${hint.label}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      {hint.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-100">{hint.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
