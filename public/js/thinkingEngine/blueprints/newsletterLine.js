/**
 * メルマガ・LINE — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
} from "./_shared.js";
import { resolveBlueprintInputs, attachStrategicFields } from "./_context.js";
import { buildNewsletterEnhancements } from "./categoryEnhancers.js";

/**
 * @param {Object} ctx AnalysisContext エンベロープ
 */
export function buildNewsletterLineBlueprint(ctx) {
  const { answers, purpose, challenge, knowledge, structure, lensReviews, synthesis } = resolveBlueprintInputs(ctx);

  const channel = answers.channel || "メルマガ（メール）";
  const purposeLabel = answers.purpose || "フォロー・関係強化";
  const audience = answers.audience || purpose.audience || "既存取引先";
  const value = answers.value || "売上アップ施策";
  const topic = answers.product_topic || purposeLabel;
  const tone = purpose.tone || "プロフェッショナル";
  const isLine = channel.includes("LINE") && !channel.includes("メルマガ");
  const isBoth = channel.includes("両方");
  const enhanced = buildNewsletterEnhancements(answers, challenge, purpose);

  const blueprint = {
    useCaseId: "newsletter_line",
    purpose,
    challenge,
    synthesis,
    knowledgeRefs: knowledge.refs ?? [],
    channel,
    purposeLabel,
    audience,
    value,
    topic,
    tone,
    impact: challenge.impact,
    seasonalContext: enhanced.seasonalContext,
    openingHook: `${audience}の${value}（${challenge.surfaceChallenge}）— ${enhanced.seasonalContext.label}の${enhanced.ownerConcerns[0]}に触れる3行フック`,
    subjectLines: enhanced.subjectLines,
    preheader: enhanced.preheader,
    bodyStructure: enhanced.bodyStructure,
    educationalAngle: enhanced.educationalAngle,
    softSellBridge: enhanced.softSellBridge,
    psHint: enhanced.psHint,
    readingFlow: enhanced.readingFlow,
    ownerInfoTopics: enhanced.ownerInfoTopics,
    lineVersion: "300字以内。短文・改行多め。絵文字控えめ。CTA1つ。",
    lineRules: enhanced.seasonalContext ? ["季節性を1文入れる", "300字以内", "CTA1つ"] : [],
    cta: purposeLabel.includes("セミナー") ? "セミナーお申し込み" : "資料請求・お問い合わせ",
    constraintsSummary: purpose.constraints?.map((c) => `- ${c}`).join("\n") ?? "",
    outputFormat: answers.output_format || "件名3+本文",
    improvementPoints: purpose.successCriteria ?? [],
    sections: structure.sections?.length ? structure.sections : (
      isBoth
        ? ["件名5案", "プレヘッダー", "メール本文（教育型）", "ソフトセル", "LINE短文", "CTA", "PS"]
        : isLine
          ? ["LINE本文", "CTA"]
          : ["件名5案", "プレヘッダー", "メール本文（教育型）", "ソフトセル", "CTA", "PS"]
    ),
  };

  blueprint.lensReviews = lensReviews.length ? lensReviews : runLensReviews({
    context: blueprint,
    lenses: [
      { id: "marketer", focus: "BtoBマーケ", insight: () => `開封率は件名の課題ワード（${challenge.surfaceChallenge}）が8割。` },
      { id: "reader", focus: "オーナー視点", insight: () => "時間がない。最初の3行で価値が分かること。" },
      { id: "brand", focus: "ブランド", insight: () => "コンサル調すぎず、現場感のある日本語。" },
    ],
  });

  blueprint.quality = evaluateDeliverableQuality([
    { id: "audience", label: "配信先", pass: Boolean(answers.audience) },
    { id: "value", label: "提供価値", pass: Boolean(answers.value) },
    { id: "challenge", label: "経営課題分析", pass: challenge.confidence >= 0.5 },
    { id: "subject", label: "件名案", pass: blueprint.subjectLines.length >= 5 },
    { id: "education", label: "教育型構成", pass: Boolean(blueprint.educationalAngle) },
    { id: "season", label: "季節性", pass: Boolean(blueprint.seasonalContext) },
    { id: "cta", label: "CTA", pass: Boolean(blueprint.cta) },
    { id: "structure", label: "構成", pass: blueprint.bodyStructure.length >= 4 },
  ]);

  return attachStrategicFields(blueprint, inputs);
}
