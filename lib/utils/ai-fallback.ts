import OpenAI from "openai";

interface ChatParams {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
}

interface FallbackOptions {
  modelPriority?: string[];
  maxAttempts?: number; // total attempts across all models
  initialDelayMs?: number;
}

function parseModelPriorityFromEnv(): string[] | undefined {
  const raw = process.env.OPENAI_MODEL_PRIORITY;
  if (!raw) return undefined;
  // Accept comma-separated string
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : undefined;
}

export function getDefaultModelPriority(): string[] {
  return (
    parseModelPriorityFromEnv() || [
      "gpt-4o-mini",
      "gpt-4o",
      "gpt-4.1-mini",
      "gpt-4-turbo",
    ]
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withJitter(baseMs: number): number {
  const jitter = Math.floor(Math.random() * Math.min(1000, baseMs));
  return baseMs + jitter;
}

function isRateLimitedOrQuota(err: unknown): boolean {
  const e = err as { status?: number; code?: string; message?: string };
  const msg = e?.message?.toLowerCase() || "";
  return (
    e?.status === 429 ||
    e?.code === "rate_limit_exceeded" ||
    msg.includes("rate limit") ||
    msg.includes("tpm") ||
    msg.includes("please try again in") ||
    e?.code === "insufficient_quota"
  );
}

function isTemporaryServerError(err: unknown): boolean {
  const e = err as { status?: number; code?: string };
  return e?.status === 500 || e?.status === 502 || e?.status === 503;
}

export async function chatWithModelFallback(
  openai: OpenAI,
  params: ChatParams,
  options: FallbackOptions = {}
): Promise<{
  response: OpenAI.Chat.Completions.ChatCompletion;
  modelUsed: string;
}> {
  const modelPriority = options.modelPriority || getDefaultModelPriority();
  const maxAttempts = Math.max(1, options.maxAttempts || modelPriority.length);
  let attempt = 0;
  let delay = options.initialDelayMs ?? 1000;

  let lastError: unknown = null;

  for (const model of modelPriority) {
    // Try each model at least once
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        response_format: params.response_format,
      });
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      attempt += 1;

      const retriable =
        isRateLimitedOrQuota(err) || isTemporaryServerError(err);
      if (!retriable) {
        // Non-retriable (e.g., validation), move on to next model immediately
        continue;
      }

      if (attempt >= maxAttempts) {
        // Exhausted attempts; stop trying
        break;
      }

      // Backoff before trying next model
      await sleep(withJitter(delay));
      delay = Math.min(delay * 2, 15000);
      continue;
    }
  }

  throw lastError || new Error("All models failed with no error information.");
}
