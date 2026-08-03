/**
 * 営業トーク — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
} from "./_shared.js";
import { resolveBlueprintInputs, attachStrategicFields } from "./_context.js";
import { buildSalesEnhancements } from "./categoryEnhancers.js";

/**
 * @param {Object} ctx AnalysisContext エンベロープ
 */
export function buildSalesTalkBlueprint(ctx) {
  const { answers, purpose, challenge, knowledge, structure, lensReviews, synthesis } = resolveBlueprintInputs(ctx);

  const industry = challenge.industry;
  const surfaceChallenge = challenge.surfaceChallenge;
  const salesType = answers.sales_type || "商談";
  const goal = answers.goal || "商談成功";
  const enhanced = buildSalesEnhancements(answers, challenge, purpose);

  const blueprint = {
    useCaseId: "sales_talk",
    purpose,
    challengeAnalysis: challenge,
    challenge,
    synthesis,
    knowledgeRefs: knowledge.refs ?? [],
    industry,
    surfaceChallenge,
    salesType,
    goal,
    rootCause: challenge.rootCause,
    impact: challenge.impact,
    industryContext: challenge.industryContext,
    clientContext: answers.client_context || "",
    icebreakers: enhanced.icebreakers,
    rapportNote: enhanced.rapportNote,
    opening: enhanced.opening,
    spinHearing: enhanced.spinHearing,
    deepDiveQuestions: enhanced.deepDiveQuestions,
    hearingQuestions: enhanced.hearingQuestions,
    salesPhases: enhanced.salesPhases,
    proposalStory: `Before: ${surfaceChallenge}（${challenge.rootCause}）→ After: ${challenge.impact}`,
    objectionResponses: enhanced.objectionResponses,
    closing: enhanced.closing,
    closingVariants: enhanced.closingVariants,
    constraintsSummary: purpose.constraints?.map((c) => `- ${c}`).join("\n") ?? "",
    outputFormat: answers.output_format || "営業台本",
    improvementPoints: purpose.successCriteria ?? [],
    sections: structure.sections?.length ? structure.sections : enhanced.salesPhases,
  };

  blueprint.lensReviews = lensReviews.length ? lensReviews : runLensReviews({
    context: blueprint,
    lenses: [
      { id: "top_sales", focus: "トップ営業", insight: () => `${salesType}では共感の質が成否を分ける。` },
      { id: "owner", focus: "オーナー", insight: () => "押し売り感が出た瞬間に心が閉じる。" },
      { id: "coach", focus: "営業コーチ", insight: () => `ゴール「${goal}」に向けたCTAは1つに絞る。` },
    ],
  });

  blueprint.quality = evaluateDeliverableQuality([
    { id: "industry", label: "業種", pass: Boolean(answers.industry) },
    { id: "challenge", label: "課題", pass: Boolean(answers.client_challenge) },
    { id: "analysis", label: "課題分析", pass: challenge.confidence >= 0.5 },
    { id: "icebreak", label: "アイスブレイク", pass: blueprint.icebreakers?.length >= 1 },
    { id: "hearing", label: "SPINヒアリング", pass: blueprint.hearingQuestions.length >= 4 },
    { id: "deep", label: "深掘り質問", pass: blueprint.deepDiveQuestions?.length >= 3 },
    { id: "objection", label: "反論処理", pass: blueprint.objectionResponses.length >= 4 },
    { id: "closing", label: "クロージング", pass: Boolean(blueprint.closing) },
  ]);

  return attachStrategicFields(blueprint, inputs);
}
