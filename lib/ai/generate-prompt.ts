/**
 * GPT-4o プロンプト生成（サーバー側エントリ）
 */

import { getAITimeoutMs, isAIConfigured } from "@/lib/ai/env";
import { buildPromptEngineerSystemPrompt } from "@/lib/ai/prompt-system";
import { buildUserMessage, type GeneratePromptRequest } from "@/lib/ai/prompt-input";
import { createAIProvider } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/ai/providers/types";
import { validateGeneratedPrompt } from "@/lib/ai/quality-guard";

export type ServerGenerateResult = {
  prompt: string;
  model: string;
  provider: string;
  source: "openai";
  durationMs: number;
  qualityGuard: { ok: boolean; score: number; warnings: string[] };
};

export async function generatePromptWithAI(
  req: GeneratePromptRequest,
  onDelta: (text: string) => void
): Promise<ServerGenerateResult> {
  if (!isAIConfigured()) {
    throw new Error("OpenAI API が未設定です");
  }

  const messages: ChatMessage[] = [
    { role: "system", content: buildPromptEngineerSystemPrompt() },
    { role: "user", content: buildUserMessage(req) },
  ];

  const provider = createAIProvider();
  const timeoutMs = getAITimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const result = await provider.generateStream(messages, { onDelta }, controller.signal);
    const durationMs = Date.now() - startedAt;
    const qualityGuard = validateGeneratedPrompt(result.prompt);

    if (!qualityGuard.ok) {
      console.warn("[generate-prompt] 品質ガード警告:", qualityGuard.warnings);
    }

    return {
      prompt: result.prompt,
      model: result.model,
      provider: result.provider,
      source: "openai",
      durationMs,
      qualityGuard,
    };
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`OpenAI API がタイムアウトしました（${timeoutMs}ms）`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
