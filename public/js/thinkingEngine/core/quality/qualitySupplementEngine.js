/**
 * 品質補完エンジン — Quality Gate を「診断」ではなく「補完ループ」として実行
 *
 * ウィザード内フロー:
 *   回答 → 品質判定 → OK なら生成 / 不足なら不足項目だけ1問追加 → 反映 → 再採点 → 繰り返し
 */

import { runWizardAnalysis } from "../pipeline/analysisPipeline.js";
import { getSchemaForCategory } from "../../schemas/index.js";

/**
 * ウィザード用 — 品質補完の次アクションを決定
 * @param {string} categoryId
 * @param {Object} answers
 * @param {{ askedQuestionIds?: string[] }} [options]
 */
export function runQualitySupplement(categoryId, answers, options = {}) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) {
    return {
      readyToGenerate: true,
      supplementQuestions: [],
      gap: null,
      mergedAnswers: { ...answers },
    };
  }

  const { gap, enrichment } = runWizardAnalysis(categoryId, answers, {
    askedQuestionIds: options.askedQuestionIds ?? [],
  });

  const mergedAnswers = {
    ...answers,
    ...(gap.inferredAnswers ?? {}),
  };

  if (gap.qualitySufficient && gap.canProceedToBlueprint) {
    return {
      readyToGenerate: true,
      supplementQuestions: [],
      gap,
      mergedAnswers,
      enrichment,
    };
  }

  const supplementQuestions = (gap.followUpQuestions ?? []).slice(0, 1);

  return {
    readyToGenerate: supplementQuestions.length === 0 && gap.qualitySufficient,
    supplementQuestions,
    gap,
    mergedAnswers,
    enrichment,
    qualityLabel: formatQualityLabel(gap),
  };
}

function formatQualityLabel(gap) {
  if (!gap) return "";
  const score = Math.round((gap.qualityScore ?? 0) * 100);
  const min = Math.round((gap.minimumQualityScore ?? 0.65) * 100);
  if (gap.qualitySufficient) return `品質 ${score}% — 生成可能`;
  return `品質 ${score}%（目標 ${min}%）— 不足項目を補完中`;
}
