/**
 * 提案書 — 分析パイプライン（Phase 0〜5）
 *
 * AI会議の思考型（多視点→反証→統合）を内部再現。
 * AI会議機能は呼び出さない。
 */

import { runGapAnalysis } from "../../schemas/index.js";
import { buildProposalBlueprint } from "../../blueprints/proposalDoc.js";
import { assembleThinkingResult } from "../thinkingCore.js";
import { renderProposalDeliverablePrompt } from "../../renderers/proposalDeliverable.js";

/**
 * Phase 0〜3: ギャップ分析
 * @param {Object} answers
 */
export function runProposalGapAnalysis(answers) {
  return runGapAnalysis("proposal", answers);
}

/**
 * Phase 4〜5: Blueprint 確定 + ThinkingResult 組立
 * @param {Object} answers
 */
export function runProposalPipeline(answers) {
  const gap = runGapAnalysis("proposal", answers);
  const merged = { ...gap.inferredAnswers, ...answers, _inferred: gap.inferredAnswers };

  const blueprint = buildProposalBlueprint(merged);
  const deliverablePrompt = renderProposalDeliverablePrompt(blueprint);

  const thinking = assembleThinkingResult({
    purpose: `${merged.industry}向け${merged.proposal_scope || "提案書"}。${merged.client_challenge}を${blueprint.rootCause}の解消として提案`,
    missingInfo: gap.missingCritical,
    constraints: "- 商品カタログではなく経営改善提案書\n- 共感から入りスペック押し売り禁止\n- 具体数字は【】プレースホルダー可",
    outputFormat: blueprint.outputFormat,
    improvements: blueprint.measures.map((m) => `${m.priority}. ${m.title}: ${m.body}`),
    notes: merged.hearing_notes ? `ヒアリングメモ反映: ${merged.hearing_notes.slice(0, 150)}` : "",
    output: { blueprint, deliverablePrompt, qualityScore: blueprint.quality.score },
    meta: {
      client: "prompt",
      scenario: "proposal_deliverable",
      useCaseId: "proposal_doc",
      gapQuality: gap.qualityScore,
      lensCount: blueprint.lensReviews.length,
    },
  });

  thinking.deliverableBlueprint = blueprint;
  thinking.deliverablePrompt = deliverablePrompt;
  thinking.qualityScore = blueprint.quality.score;

  return thinking;
}
