/**
 * 画像生成サービス — API 呼び出し
 */

import { buildImageGenerationHandoff } from "./thinkingEngine/adapters/registry.js";
import { openaiImagesAdapter } from "./thinkingEngine/adapters/openaiImagesAdapter.js";

/**
 * GeneratedPrompt から画像を生成
 * @param {Object} generatedPrompt
 * @returns {Promise<{ blobUrl: string, contentType: string }>}
 */
export async function generateImageFromPrompt(generatedPrompt) {
  if (!openaiImagesAdapter.canGenerate(generatedPrompt)) {
    throw new Error("このプロンプトでは画像生成できません（背景プロンプトまたは公式商品画像が必要です）");
  }

  const handoff = buildImageGenerationHandoff(generatedPrompt);

  const res = await fetch(handoff.endpoint, {
    method: handoff.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(handoff.body),
  });

  if (!res.ok) {
    let message = "画像生成に失敗しました";
    try {
      const err = await res.json();
      if (err.error) message = err.error;
    } catch {
      /* JSON でないレスポンス */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  return {
    blobUrl,
    contentType: res.headers.get("Content-Type") || "image/png",
  };
}
