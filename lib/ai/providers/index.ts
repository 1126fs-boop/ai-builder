/**
 * AI プロバイダーファクトリ（将来 Claude / Gemini 切替用）
 */

import { getAIProvider as getProviderName } from "@/lib/ai/env";
import { OpenAIProvider } from "@/lib/ai/providers/openai";
import type { AIProvider } from "@/lib/ai/providers/types";

export function createAIProvider(): AIProvider {
  const name = getProviderName();

  switch (name) {
    case "openai":
      return new OpenAIProvider();
    default:
      throw new Error(`未対応の AI プロバイダー: ${name}`);
  }
}
