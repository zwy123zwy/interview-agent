export interface LlmTaskConfig {
  model: string;
  temperature: number;
  promptVersion: string;
}

export interface LlmConfig {
  provider: string;
  baseUrl?: string;
  apiKey?: string;
  timeoutMs: number;
  maxRetries: number;
  tasks: {
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
  return {
    provider: process.env.LLM_PROVIDER ?? "openai",
    baseUrl: process.env.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY,
    timeoutMs: getNumberEnv("LLM_TIMEOUT_MS", 30000),
    maxRetries: getNumberEnv("LLM_MAX_RETRIES", 2),
    tasks: {
      resumeParse: getTaskConfig("LLM_RESUME_PARSE", "gpt-4.1-mini"),
      jdParse: getTaskConfig("LLM_JD_PARSE", "gpt-4.1-mini"),
      matchReport: getTaskConfig("LLM_MATCH_REPORT", "gpt-4.1"),
    },
  };
}
