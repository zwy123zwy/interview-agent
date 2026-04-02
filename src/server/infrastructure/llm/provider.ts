import { getLlmConfig } from "@/server/infrastructure/config/env";

export interface LlmStreamChunk {
  content: string;
}

export async function* streamChatCompletion(
  message: string,
  contextHints: string[],
): AsyncGenerator<LlmStreamChunk> {
  const config = getLlmConfig();

  if (config.provider === "mock") {
    throw new Error("mock_provider_should_use_fallback");
  }

  if (config.provider === "ollama") {
    yield* streamFromOllama(message, contextHints);
    return;
  }

  if (config.provider === "openai") {
    yield* streamFromOpenAICompatible(message, contextHints);
    return;
  }
}

async function* streamFromOllama(
  message: string,
  contextHints: string[],
): AsyncGenerator<LlmStreamChunk> {
  const config = getLlmConfig();
  const response = await fetch(`${config.baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.tasks.chat.model,
      prompt: buildPrompt(message, contextHints),
      stream: true,
      options: {
        temperature: config.tasks.chat.temperature,
      },
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
        response?: string;
        done?: boolean;
      };

      if (payload.response) {
        yield { content: payload.response };
      }

      if (payload.done) {
        return;
      }
    }
  }
}

async function* streamFromOpenAICompatible(
  message: string,
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
      messages: [
        {
          role: "system",
          content:
            "You are the chat orchestrator for an interview product. Use the provided context and answer concisely.",
        },
        {
          role: "user",
          content: buildPrompt(message, contextHints),
        },
      ],
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

function buildPrompt(message: string, contextHints: string[]) {
  const contextBlock =
    contextHints.length > 0 ? contextHints.map((item) => `- ${item}`).join("\n") : "- 无";

  return `用户请求：${message}\n\n补充上下文：\n${contextBlock}\n\n请结合上下文给出下一步建议，并说明是否需要调用工具或技能。`;
}
