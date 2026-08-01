/**
 * AI Adapter — レジストリ
 *
 * GeneratedPrompt を各生成AI向けに変換・接続する。
 * アプリの責務外（成果物生成）だが、Prompt を渡す導線を提供。
 */

import { chatgptAdapter } from "./chatgptAdapter.js";
import { openaiImagesAdapter } from "./openaiImagesAdapter.js";

/** @type {Map<string, import("./types.js").AIAdapter>} */
const ADAPTERS = new Map([
  ["chatgpt", chatgptAdapter],
  ["openai_images", openaiImagesAdapter],
]);

export function getAdapter(adapterId) {
  return ADAPTERS.get(adapterId) || null;
}

export function listAdapters() {
  return [...ADAPTERS.values()];
}

export function getRecommendedAdapters(generatedPrompt) {
  const ids = generatedPrompt?.payload?.recommendedAdapters ?? ["chatgpt"];
  return ids.map((id) => getAdapter(id)).filter(Boolean);
}

/**
 * GeneratedPrompt から推奨 Adapter の Handoff を生成
 * @param {Object} generatedPrompt
 * @param {string} [adapterId]
 */
export function buildHandoff(generatedPrompt, adapterId = "chatgpt") {
  const adapter = getAdapter(adapterId);
  if (!adapter) throw new Error(`未登録の AI Adapter: ${adapterId}`);
  const request = adapter.buildRequest(generatedPrompt);
  return adapter.getHandoff(request);
}

/** 画像生成 Handoff（OpenAI Images Adapter） */
export function buildImageGenerationHandoff(generatedPrompt) {
  return buildHandoff(generatedPrompt, "openai_images");
}
