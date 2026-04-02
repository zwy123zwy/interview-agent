export type LlmProvider = "ollama" | "openai" | "mock";

export interface LlmTaskConfig {
  model: string;
  temperature: number;
  promptVersion: string;
}

export interface LlmConfig {
  provider: LlmProvider;
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
  maxRetries: number;
  tasks: {
    chat: LlmTaskConfig;
    resumeParse: LlmTaskConfig;
    jdParse: LlmTaskConfig;
    matchReport: LlmTaskConfig;
  };
}

function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number(raw);
  return Number.isNaN(value) ? fallback : value;
}

function getTaskConfig(prefix: string, fallbackModel: string): LlmTaskConfig {
  return {
    model: process.env[`${prefix}_MODEL`] ?? fallbackModel,
    temperature: getNumberEnv(`${prefix}_TEMPERATURE`, 0),
    promptVersion: process.env[`${prefix}_PROMPT_VERSION`] ?? "v1",
  };
}

export function getLlmConfig(): LlmConfig {
  const provider = (process.env.LLM_PROVIDER ?? "ollama") as LlmProvider;
  const defaultBaseUrl =
    provider === "ollama"
      ? "http://127.0.0.1:11434"
      : provider === "openai"
        ? "https://api.openai.com/v1"
        : "http://127.0.0.1:11434";

  return {
    provider,
    baseUrl: process.env.LLM_BASE_URL ?? defaultBaseUrl,
    apiKey: process.env.LLM_API_KEY,
    timeoutMs: getNumberEnv("LLM_TIMEOUT_MS", 30000),
    maxRetries: getNumberEnv("LLM_MAX_RETRIES", 2),
    tasks: {
      chat: getTaskConfig("LLM_CHAT", provider === "ollama" ? "qwen3-coder:480b-cloud" : "gpt-4.1-mini"),
      resumeParse: getTaskConfig(
        "LLM_RESUME_PARSE",
        provider === "ollama" ? "qwen3-coder:480b-cloud" : "gpt-4.1-mini",
      ),
        jdParse: getTaskConfig(
          "LLM_JD_PARSE",
        provider === "ollama" ? "qwen3-coder:480b-cloud" : "gpt-4.1-mini",
      ),
      matchReport: getTaskConfig(
        "LLM_MATCH_REPORT",
        provider === "ollama" ? "qwen3-coder:480b-cloud" : "gpt-4.1",
      ),
    },
  };
}
