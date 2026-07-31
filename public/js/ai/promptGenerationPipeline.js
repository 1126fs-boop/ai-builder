/**
 * プロンプト生成パイプライン
 * - 通常: GPT-4o API（1回）
 * - 失敗時: テンプレート自動フォールバック
 */

import { getCategory } from "../../categories.js";
import {
  buildPrompt,
  generateTitle,
  generateMeetingTitle,
} from "../../promptBuilder.js";
import { diagnoseQuality } from "../../qualityEngine.js";
import { buildMeetingPromptPayload } from "./promptEnhancer.js";
import { wrapPrompt } from "../../context.js";
import { structuredPro } from "./promptEnhancer.js";
import { createProfiler } from "./performanceProfiler.js";
import { fetchGeneratedPrompt } from "./promptApiClient.js";

/** @typedef {Object} PromptGenerationResult */

/**
 * テンプレート — ウィザード（フォールバック用）
 */
export function generateWizardPromptTemplate(categoryId, answers) {
  const profiler = createProfiler("ウィザード→テンプレート");
  profiler.mark("開始");

  const category = getCategory(categoryId);
  if (!category) {
    throw new Error("カテゴリが見つかりません。最初からやり直してください。");
  }

  const quality = diagnoseQuality(categoryId, answers);
  const prompt = buildPrompt(categoryId, answers);

  if (!prompt?.trim()) {
    throw new Error("プロンプトの生成に失敗しました。");
  }

  const title = generateTitle(category.label, answers);
  profiler.mark("完了");
  const report = profiler.report();

  return buildResult({
    prompt,
    quality,
    title,
    category: categoryId,
    categoryLabel: category.label,
    answers: { ...answers },
    source: "template",
    aiApiCalls: 0,
    totalMs: report.totalMs,
    phases: report.marks,
  });
}

/**
 * テンプレート — 会議連携（フォールバック用）
 */
export function generateMeetingPromptTemplate(edits) {
  const profiler = createProfiler("会議→テンプレート");
  profiler.mark("開始");

  if (!edits.topic?.trim()) {
    throw new Error("議題を入力してください。");
  }

  const payload = buildMeetingPromptPayload(edits);
  const prompt = wrapPrompt(structuredPro(payload));
  const quality = diagnoseQuality("agent", {
    purpose: edits.topic,
    feature: "AI会議連携プロンプト",
    role: "ソリューション営業",
    extra_info: [edits.summary, edits.conclusion].filter(Boolean).join("\n").slice(0, 500),
  });

  if (!prompt?.trim()) {
    throw new Error("プロンプトの生成に失敗しました。");
  }

  const title = generateMeetingTitle(edits.topic);
  profiler.mark("完了");
  const report = profiler.report();

  return buildResult({
    prompt,
    quality,
    title,
    category: "agent",
    categoryLabel: "AI会議連携",
    answers: { ...edits },
    source: "template",
    aiApiCalls: 0,
    totalMs: report.totalMs,
    phases: report.marks,
  });
}

/**
 * ウィザード — GPT-4o 優先 + フォールバック
 * @param {string} categoryId
 * @param {Object<string,string>} answers
 * @param {{ onDelta?: Function, onStep?: Function }} [callbacks]
 */
export async function generateWizardPrompt(categoryId, answers, callbacks = {}) {
  const category = getCategory(categoryId);
  if (!category) {
    throw new Error("カテゴリが見つかりません。最初からやり直してください。");
  }

  try {
    callbacks.onStep?.("GPT-4o にプロンプト設計を依頼中…");

    const apiResult = await fetchGeneratedPrompt(
      {
        mode: "wizard",
        categoryId,
        categoryLabel: category.label,
        answers,
      },
      callbacks
    );

    callbacks.onStep?.("品質診断を反映中…");
    const quality = diagnoseQuality(categoryId, answers);
    const title = generateTitle(category.label, answers);

    return buildResult({
      prompt: apiResult.prompt,
      quality,
      title,
      category: categoryId,
      categoryLabel: category.label,
      answers: { ...answers },
      source: "openai",
      model: apiResult.model,
      aiApiCalls: 1,
      durationMs: apiResult.durationMs,
      qualityGuard: apiResult.qualityGuard,
      totalMs: apiResult.clientDurationMs,
      phases: [],
    });
  } catch (err) {
    console.warn("[promptPipeline] GPT-4o 失敗 → テンプレートフォールバック", err);
    callbacks.onStep?.("GPT-4o を利用できないため、テンプレートで生成中…");
    const fallback = generateWizardPromptTemplate(categoryId, answers);
    fallback.metrics.fallback = true;
    fallback.metrics.fallbackReason = err instanceof Error ? err.message : String(err);
    return fallback;
  }
}

/**
 * 会議連携 — GPT-4o 優先 + フォールバック
 */
export async function generateMeetingPrompt(edits, callbacks = {}) {
  if (!edits.topic?.trim()) {
    throw new Error("議題を入力してください。");
  }

  try {
    callbacks.onStep?.("GPT-4o が AI会議の内容を統合中…");

    const apiResult = await fetchGeneratedPrompt(
      {
        mode: "meeting",
        topic: edits.topic,
        summary: edits.summary,
        conclusion: edits.conclusion,
        preconditions: edits.preconditions,
        discussion: edits.discussion,
      },
      callbacks
    );

    callbacks.onStep?.("品質診断を反映中…");
    const quality = diagnoseQuality("agent", {
      purpose: edits.topic,
      feature: "AI会議連携プロンプト",
      role: "ソリューション営業",
      extra_info: [edits.summary, edits.conclusion].filter(Boolean).join("\n").slice(0, 500),
    });
    const title = generateMeetingTitle(edits.topic);

    return buildResult({
      prompt: apiResult.prompt,
      quality,
      title,
      category: "agent",
      categoryLabel: "AI会議連携",
      answers: { ...edits },
      source: "openai",
      model: apiResult.model,
      aiApiCalls: 1,
      durationMs: apiResult.durationMs,
      qualityGuard: apiResult.qualityGuard,
      totalMs: apiResult.clientDurationMs,
      phases: [],
    });
  } catch (err) {
    console.warn("[promptPipeline] GPT-4o 失敗 → テンプレートフォールバック", err);
    callbacks.onStep?.("テンプレートで生成中…");
    const fallback = generateMeetingPromptTemplate(edits);
    fallback.metrics.fallback = true;
    fallback.metrics.fallbackReason = err instanceof Error ? err.message : String(err);
    return fallback;
  }
}

function buildResult({
  prompt,
  quality,
  title,
  category,
  categoryLabel,
  answers,
  source,
  model,
  aiApiCalls,
  durationMs,
  qualityGuard,
  totalMs,
  phases,
}) {
  return {
    prompt,
    quality,
    title,
    category,
    categoryLabel,
    answers,
    metrics: {
      aiApiCalls,
      networkCalls: aiApiCalls > 0 ? 1 : 0,
      source,
      model: model || null,
      durationMs: durationMs ?? null,
      totalMs,
      qualityGuard,
      phases: (phases || []).map((m) => ({
        name: m.name,
        elapsedMs: Math.round(m.elapsed * 10) / 10,
      })),
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
  console.info("生成方式:", result.metrics.source, result.metrics.model || "");
  console.info("AI API呼び出し回数:", result.metrics.aiApiCalls);
  if (result.metrics.durationMs != null) {
    console.info("GPT-4o 生成時間:", `${result.metrics.durationMs} ms`);
  }
  if (result.metrics.totalMs != null) {
    console.info("クライアント体感時間:", `${result.metrics.totalMs} ms`);
  }
  if (result.metrics.qualityGuard) {
    console.info("品質ガードスコア:", result.metrics.qualityGuard.score, result.metrics.qualityGuard);
  }
  if (result.metrics.fallback) {
    console.warn("フォールバック:", result.metrics.fallbackReason);
  }
  console.info("ネットワーク呼び出し回数:", saveMetrics.networkCalls ?? result.metrics.networkCalls);
  if (result.metrics.totalMs != null) {
    console.info("生成時間:", `${result.metrics.totalMs} ms`);
  }
  if (saveMetrics.saveMs != null) {
    console.info("Supabase保存時間:", `${saveMetrics.saveMs} ms`);
  }
  console.info("推奨AI:", result.quality.recommendedAi);
  if (result.metrics.phases?.length) {
    console.table(result.metrics.phases);
  }
  console.groupEnd();
}
