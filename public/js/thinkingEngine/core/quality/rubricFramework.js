/**
 * Prompt Builder 品質ルーブリック — 共通フレームワーク
 *
 * Blueprint / GeneratedPrompt の品質を検査し、閾値未満なら改善ヒントを返す。
 */

import { evaluateProposalBlueprint } from "../../rubrics/proposalQuality.js";
import { evaluateSnsBlueprint } from "../../rubrics/snsQuality.js";
import { evaluatePopBlueprint } from "../../rubrics/popQuality.js";
import { evaluateNewsletterBlueprint } from "../../rubrics/newsletterQuality.js";
import { evaluateSalesBlueprint } from "../../rubrics/salesQuality.js";
import { evaluateGeneratedPrompt } from "./promptQuality.js";

/** 品質合格ライン（0〜1） */
export const QUALITY_PASS_THRESHOLD = 0.75;

/** 改善ループ最大回数 */
export const MAX_QUALITY_RETRIES = 1;

const BLUEPRINT_EVALUATORS = {
  proposal: evaluateProposalBlueprint,
  sns: evaluateSnsBlueprint,
  newsletter: evaluateNewsletterBlueprint,
  sales: evaluateSalesBlueprint,
  image: evaluatePopBlueprint,
};

/**
 * Blueprint 品質評価
 * @param {string} categoryId
 * @param {Object} blueprintPayload
 */
export function evaluateBlueprintQuality(categoryId, blueprintPayload) {
  const fn = BLUEPRINT_EVALUATORS[categoryId];
  if (!fn) {
    return { score: 1, checks: [], passed: 0, total: 0 };
  }
  return fn(blueprintPayload);
}

/**
 * 品質ゲート — Blueprint + GeneratedPrompt を総合判定
 * @param {string} categoryId
 * @param {Object} blueprintPayload
 * @param {Object} promptBundle
 */
export function runQualityGate(categoryId, blueprintPayload, promptBundle) {
  const bpResult = evaluateBlueprintQuality(categoryId, blueprintPayload);
  const gpResult = evaluateGeneratedPrompt(categoryId, promptBundle);

  const bpWeight = 0.6;
  const gpWeight = 0.4;
  const score = Math.round((bpResult.score * bpWeight + gpResult.score * gpWeight) * 100) / 100;

  const failedChecks = [
    ...bpResult.checks.filter((c) => !c.pass),
    ...gpResult.checks.filter((c) => !c.pass),
  ];

  const improvements = failedChecks.map((c) => c.hint || c.label);

  return {
    passed: score >= QUALITY_PASS_THRESHOLD,
    score,
    blueprintScore: bpResult.score,
    promptScore: gpResult.score,
    checks: [...bpResult.checks, ...gpResult.checks],
    improvements,
    failedChecks,
  };
}

/**
 * 品質改善ヒントを Blueprint に反映（再生成用）
 * @param {Object} blueprintPayload
 * @param {string[]} improvements
 */
export function enrichBlueprintForRetry(blueprintPayload, improvements) {
  const enriched = { ...blueprintPayload };
  enriched.qualityRetryHints = improvements;
  enriched.notes = [enriched.notes, "【品質改善】", ...improvements.map((h) => `- ${h}`)]
    .filter(Boolean)
    .join("\n");

  if (improvements.some((h) => h.includes("コピー") || h.includes("キャッチ"))) {
    enriched.copyPatterns = [
      ...(enriched.copyPatterns || []),
      "【改善】経営課題と直結するキャッチコピー（数字・共感・CTA を含む）",
    ];
  }

  return enriched;
}
