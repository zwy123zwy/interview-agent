import type { ChatMessage } from "@/server/domain/chat";
import { getLlmConfig } from "@/server/infrastructure/config/env";

export interface LlmStreamChunk {
  content: string;
}

export async function* streamChatCompletion(
  history: Array<Pick<ChatMessage, "role" | "content">>,
  contextHints: string[],
): AsyncGenerator<LlmStreamChunk> {
  const config = getLlmConfig();

  if (config.provider === "mock") {
    throw new Error("mock_provider_should_use_fallback");
  }

  if (config.provider === "ollama") {
    yield* streamFromOllama(history, contextHints);
    return;
  }

  if (config.provider === "openai") {
    yield* streamFromOpenAICompatible(history, contextHints);
    return;
  }
}

async function* streamFromOllama(
  history: Array<Pick<ChatMessage, "role" | "content">>,
  contextHints: string[],
): AsyncGenerator<LlmStreamChunk> {
  const config = getLlmConfig();
  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.tasks.chat.model,
      stream: true,
      options: {
        temperature: config.tasks.chat.temperature,
      },
      messages: toProviderMessages(history, contextHints),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("ollama_request_failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      const payload = JSON.parse(line) as {
        message?: {
          content?: string;
        };
        done?: boolean;
      };

      const content = payload.message?.content;
      if (content) {
        yield { content };
      }

      if (payload.done) {
        return;
      }
    }
  }
}

async function* streamFromOpenAICompatible(
  history: Array<Pick<ChatMessage, "role" | "content">>,
  contextHints: string[],
): AsyncGenerator<LlmStreamChunk> {
  const config = getLlmConfig();
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.tasks.chat.model,
      temperature: config.tasks.chat.temperature,
      stream: true,
      messages: toProviderMessages(history, contextHints),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("openai_request_failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;

      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      const payload = JSON.parse(data) as {
        choices?: Array<{
          delta?: {
            content?: string;
          };
        }>;
      };

      const content = payload.choices?.[0]?.delta?.content;
      if (content) {
        yield { content };
      }
    }
  }
}

function toProviderMessages(
  history: Array<Pick<ChatMessage, "role" | "content">>,
  contextHints: string[],
) {
  return [
    {
      role: "system",
      content: buildSystemPrompt(contextHints),
    },
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}

function buildSystemPrompt(contextHints: string[]) {
  const contextBlock =
    contextHints.length > 0 ? contextHints.map((item) => `- ${item}`).join("\n") : "- 无";

  return [
    "你是程序员面试产品的聊天编排助手。",
    "优先根据用户当前请求判断下一步是否需要：上下文补充、工具调用、技能选择。",
    "回答要简洁明确，不要编造未提供的信息。",
    "当前补充上下文：",
    contextBlock,
  ].join("\n");
}
