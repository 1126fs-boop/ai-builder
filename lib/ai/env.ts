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

export function isAIConfigured(): boolean {
  return getAIProvider() === "openai" && Boolean(getOpenAIApiKey());
}
