/**
 * AI プロバイダー環境変数
 */

const PLACEHOLDER_KEY = /your-openai|xxxx|example|placeholder|sk-your/i;

export function getOpenAIApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEY.test(key)) return null;
  return key;
}

export function getAIProvider(): string {
  return process.env.AI_PROVIDER?.trim() || "openai";
}

export function getAIModel(): string {
  return process.env.AI_MODEL?.trim() || "gpt-4o";
}

export function getAITimeoutMs(): number {
  const raw = process.env.AI_TIMEOUT_MS?.trim();
  const n = raw ? Number(raw) : 30000;
  return Number.isFinite(n) && n > 0 ? n : 30000;
}

/** 出力トークン上限（品質優先・速度バランス） */
export function getAIMaxOutputTokens(): number {
  const raw = process.env.AI_MAX_OUTPUT_TOKENS?.trim();
  const n = raw ? Number(raw) : 4096;
  return Number.isFinite(n) && n >= 1024 ? Math.min(n, 8192) : 4096;
}

/** 生成温度（低め = 品質安定） */
export function getAITemperature(): number {
  const raw = process.env.AI_TEMPERATURE?.trim();
  const n = raw ? Number(raw) : 0.35;
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0.35;
}

export function isAIConfigured(): boolean {
  return getAIProvider() === "openai" && Boolean(getOpenAIApiKey());
}
