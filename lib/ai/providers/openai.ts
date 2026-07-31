/**
 * OpenAI Chat Completions（GPT-4o）— ストリーミング対応
 */

import { getAIModel, getOpenAIApiKey } from "@/lib/ai/env";
import type { AIProvider, ChatMessage, GenerateResult, StreamCallbacks } from "@/lib/ai/providers/types";

type OpenAIStreamChunk = {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
};

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async generateStream(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<GenerateResult> {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY が設定されていません");
    }

    const model = getAIModel();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`OpenAI API エラー (${response.status}): ${errText.slice(0, 200)}`);
    }

    if (!response.body) {
      throw new Error("OpenAI API からストリームを取得できませんでした");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as OpenAIStreamChunk;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            callbacks.onDelta(delta);
          }
        } catch {
          /* 不完全なチャンクは無視 */
        }
      }
    }

    const prompt = fullText.trim();
    if (!prompt) {
      throw new Error("OpenAI から空のプロンプトが返されました");
    }

    return { prompt, model, provider: this.name };
  }
}
