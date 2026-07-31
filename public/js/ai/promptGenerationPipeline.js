/**
 * プロンプト生成パイプライン（公開 API）
 * - 現状: テンプレート（ルールベース）のみ
 * - 実装の差し替え: promptProvider.js
 */

import {
  ACTIVE_PROVIDER,
  generateWizardViaProvider,
  generateMeetingViaProvider,
} from "./promptProvider.js";

/** @typedef {import("./promptProvider.js").PromptProviderId} PromptProviderId */

/**
 * ウィザード — プロンプト生成
 * @param {string} categoryId
 * @param {Object<string,string>} answers
 * @param {{ onStep?: Function, onDelta?: Function }} [callbacks]
 */
export async function generateWizardPrompt(categoryId, answers, callbacks = {}) {
  const result = await generateWizardViaProvider(categoryId, answers, callbacks);
  return normalizeResult(result);
}

/**
 * 会議連携 — プロンプト生成
 */
export async function generateMeetingPrompt(edits, callbacks = {}) {
  const result = await generateMeetingViaProvider(edits, callbacks);
  return normalizeResult(result);
}

/** 後方互換: テンプレート直接生成 */
export { generateWizardViaProvider as generateWizardPromptTemplate } from "./promptProvider.js";
export { generateMeetingViaProvider as generateMeetingPromptTemplate } from "./promptProvider.js";

function normalizeResult(result) {
  return {
    prompt: result.prompt,
    quality: result.quality,
    title: result.title,
    category: result.category,
    categoryLabel: result.categoryLabel,
    answers: result.answers,
    metrics: {
      aiApiCalls: 0,
      networkCalls: 0,
      source: result.metrics.provider || ACTIVE_PROVIDER,
      model: null,
      durationMs: result.metrics.totalMs,
      totalMs: result.metrics.totalMs,
      qualityGuard: null,
      phases: result.metrics.phases || [],
      fallback: false,
      fallbackReason: null,
    },
  };
}

/** 生成結果を保存用オブジェクトに変換 */
export function toSavePayload(result) {
  return {
    title: result.title,
    category: result.category,
    categoryLabel: result.categoryLabel,
    prompt: result.prompt,
    answers: result.answers,
    quality: result.quality,
  };
}

/** 生成メトリクスをコンソールに出力 */
export function logGenerationSummary(result, saveMetrics = {}) {
  console.group("[perf] プロンプト生成サマリー");
  console.info("生成方式:", result.metrics.source, "(テンプレート)");
  console.info("AI API呼び出し回数:", result.metrics.aiApiCalls);
  if (result.metrics.totalMs != null) {
    console.info("生成時間:", `${result.metrics.totalMs} ms`);
  }
  console.info("ネットワーク呼び出し回数:", saveMetrics.networkCalls ?? result.metrics.networkCalls);
  if (saveMetrics.saveMs != null) {
    console.info("Supabase保存時間:", `${saveMetrics.saveMs} ms`);
  }
  console.info("推奨AI:", result.quality.recommendedAi);
  if (result.metrics.phases?.length) {
    console.table(result.metrics.phases);
  }
  console.groupEnd();
}
