"use client";

import { useState } from "react";

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

export function ChatPage() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
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
  const [loading, setLoading] = useState(false);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const userMessage: ViewMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: trimmed,
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
          </div>

          <div className="mt-5 flex flex-1 flex-col gap-4 overflow-y-auto rounded-[26px] bg-[#fbfaf7] p-4">
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
                <p className="whitespace-pre-wrap break-keep">{message.content || "..."}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入需求，例如：先做一个前端对话入口，后端判断使用哪些插件和 skills。"
              className="min-h-28 w-full resize-none border-0 bg-transparent text-sm leading-7 text-slate-800 outline-none md:text-base [hyphens:none] [overflow-wrap:normal] [word-break:keep-all]"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                当前模式：{streamMode === "streaming" ? "真实流式回复" : "回退流式回复"} + 意图判断
              </p>
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
                <p className="text-sm leading-7 text-slate-600">当前还没有技能选择结果。</p>
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
                <p className="text-sm leading-7 text-slate-300">当前还没有补充上下文。</p>
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
