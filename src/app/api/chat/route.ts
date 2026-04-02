import {
  buildChatFallbackReply,
  handleChat,
} from "@/server/application/chat-orchestrator";
import type { ChatRequest } from "@/server/domain/chat";
import { getLlmConfig } from "@/server/infrastructure/config/env";
import { createId } from "@/server/infrastructure/ids";
import { streamChatCompletion } from "@/server/infrastructure/llm/provider";

function toLine(payload: Record<string, unknown>) {
  return `${JSON.stringify(payload)}\n`;
}

function splitForStreaming(content: string) {
  return content
    .split(/(?<=[\n。！？])/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatRequest>;

  if (!body.message || !body.message.trim()) {
    return new Response(
      JSON.stringify({
        error_code: "INVALID_CHAT_MESSAGE",
        message: "message is required",
        retryable: false,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }

  const requestData = {
    conversationId: body.conversationId,
    message: body.message.trim(),
  };

  const response = handleChat(requestData);
  const config = getLlmConfig();

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const fallback = buildChatFallbackReply(requestData);

      controller.enqueue(
        encoder.encode(
          toLine({
            type: "meta",
            conversationId: response.conversationId,
            replyId: response.reply.id,
            toolDecisions: response.toolDecisions,
            skillDecisions: response.skillDecisions,
            contextHints: response.contextHints,
            llm: {
              provider: config.provider,
              model: config.tasks.chat.model,
            },
          }),
        ),
      );

      let streamed = false;

      try {
        for await (const chunk of streamChatCompletion(
          requestData.message,
          fallback.contextHints.map((hint) => `${hint.label}: ${hint.content}`),
        )) {
          streamed = true;
          controller.enqueue(
            encoder.encode(
              toLine({
                type: "chunk",
                content: chunk.content,
              }),
            ),
          );
        }
      } catch {
        for (const chunk of splitForStreaming(fallback.content)) {
          controller.enqueue(
            encoder.encode(
              toLine({
                type: "chunk",
                content: `${chunk}${chunk.endsWith("\n") ? "" : "\n"}`,
              }),
            ),
          );
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
      }

      controller.enqueue(
        encoder.encode(
          toLine({
            type: "done",
            streamed,
          }),
        ),
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
