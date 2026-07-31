/**
 * プロンプト生成パイプライン — 1パスで品質診断+プロンプト構築
 * LLM API は使用せず、テンプレートエンジンで高品質プロンプトを生成する
 */

import { getCategory } from "../../categories.js";
import {
  buildPrompt,
  buildPromptFromMeeting,
  generateTitle,
  generateMeetingTitle,
} from "../../promptBuilder.js";
import { diagnoseQuality } from "../../qualityEngine.js";
import { buildMeetingPromptPayload } from "./promptEnhancer.js";
import { wrapPrompt } from "../../context.js";
import { structuredPro } from "./promptEnhancer.js";
import { createProfiler } from "./performanceProfiler.js";

/** @typedef {"wizard"|"meeting"} GenerationMode */

/** @typedef {Object} PromptGenerationResult
 * @property {string} prompt
 * @property {import("../../qualityEngine.js").QualityReport} quality
 * @property {string} title
 * @property {string} category
 * @property {string} categoryLabel
 * @property {Object<string,string>} answers
 * @property {{ aiApiCalls: number, networkCalls: number, phases: object[] }} metrics
 */

/**
 * ウィザードからプロンプト生成（品質診断と構築を1パス）
 * @param {string} categoryId
 * @param {Object<string,string>} answers
 */
export function generateWizardPrompt(categoryId, answers) {
  const profiler = createProfiler("ウィザード→プロンプト生成");
  profiler.mark("開始");

  const category = getCategory(categoryId);
  if (!category) {
    throw new Error("カテゴリが見つかりません。最初からやり直してください。");
  }

  profiler.mark("品質診断");
  const quality = diagnoseQuality(categoryId, answers);

  profiler.mark("プロンプト構築");
  const prompt = buildPrompt(categoryId, answers);

  if (!prompt?.trim()) {
    throw new Error("プロンプトの生成に失敗しました。");
  }

  const title = generateTitle(category.label, answers);
  profiler.mark("完了");
  const report = profiler.report();

  return {
    prompt,
    quality,
    title,
    category: categoryId,
    categoryLabel: category.label,
    answers: { ...answers },
    metrics: buildMetrics(report, { aiApiCalls: 0, networkCalls: 0 }),
  };
}

/**
 * AI会議連携からプロンプト生成（会議サマリーを再分析せず1パスで活用）
 * @param {Object} edits — sessionStorage から引き継いだ編集内容
 */
export function generateMeetingPrompt(edits) {
  const profiler = createProfiler("会議→プロンプト生成");
  profiler.mark("開始");

  if (!edits.topic?.trim()) {
    throw new Error("議題を入力してください。");
  }

  // 会議で既に構築済みのサマリー・結論をそのまま利用（再要約しない）
  profiler.mark("プロンプトペイロード構築");
  const payload = buildMeetingPromptPayload(edits);

  profiler.mark("プロンプト組み立て");
  const prompt = wrapPrompt(structuredPro(payload));

  // 会議引き継ぎ情報を品質診断に反映（discussion全文の再解析はしない）
  profiler.mark("品質診断");
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

  return {
    prompt,
    quality,
    title,
    category: "agent",
    categoryLabel: "AI会議連携",
    answers: { ...edits },
    metrics: buildMetrics(report, { aiApiCalls: 0, networkCalls: 0 }),
  };
}

function buildMetrics(profilerReport, network) {
  return {
    aiApiCalls: 0,
    networkCalls: network.networkCalls,
    totalMs: profilerReport.totalMs,
    phases: profilerReport.marks.map((m) => ({
      name: m.name,
      elapsedMs: Math.round(m.elapsed * 10) / 10,
    })),
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

/**
 * 生成メトリクスをコンソールに出力
 * @param {PromptGenerationResult} result
 * @param {{ saveMs?: number, networkCalls?: number }} saveMetrics
 */
export function logGenerationSummary(result, saveMetrics = {}) {
  console.group("[perf] プロンプト生成サマリー");
  console.info("AI API呼び出し回数:", result.metrics.aiApiCalls, "（LLM未使用・テンプレート生成）");
  console.info("ネットワーク呼び出し回数:", saveMetrics.networkCalls ?? result.metrics.networkCalls);
  console.info("生成CPU時間:", `${result.metrics.totalMs} ms`);
  if (saveMetrics.saveMs != null) {
    console.info("Supabase保存時間:", `${saveMetrics.saveMs} ms`);
  }
  console.info("推奨AI（ユーザーが貼り付け先に使う外部モデル）:", result.quality.recommendedAi);
  console.table(result.metrics.phases);
  console.groupEnd();
}
