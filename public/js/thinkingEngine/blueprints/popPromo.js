/**
 * POP・販促物 — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
} from "./_shared.js";
import { resolveBlueprintInputs } from "./_context.js";
import { buildPopEnhancements } from "./categoryEnhancers.js";

/**
 * @param {Object} ctx AnalysisContext エンベロープ
 */
export function buildPopPromoBlueprint(ctx) {
  const { answers, purpose, challenge, knowledge, structure, creativeBrief, lensReviews, synthesis } = resolveBlueprintInputs(ctx);

  const product = answers.wam_product || knowledge.productKnowledge?.name || "【商品名】";
  const usage = answers.usage || "店内POP";
  const appeal = answers.appeal_point || "導入メリット";
  const location = answers.display_location || "サロン店内";
  const size = answers.size_format || "A4縦";
  const style = purpose.tone || "高級感・信頼感";
  const brief = creativeBrief ?? structure?.creativeBrief ?? null;
  const enhanced = buildPopEnhancements(answers, challenge, purpose);

  const blueprint = {
    useCaseId: "pop_promo",
    purpose,
    challenge,
    synthesis,
    layoutSpec: structure.layoutSpec,
    creativeBrief: brief,
    knowledgeRefs: knowledge.refs ?? [],
    productAsset: knowledge.productKnowledge,
    product,
    usage,
    appealPoint: appeal,
    displayLocation: location,
    sizeFormat: size,
    style,
    impact: challenge.impact,
    seasonalHook: enhanced.seasonalHook,
    headline: enhanced.headlineVariants[0],
    headlineVariants: enhanced.headlineVariants,
    subCopy: enhanced.subCopyVariants[0],
    subCopyVariants: enhanced.subCopyVariants,
    copyHierarchy: enhanced.copyHierarchy,
    layoutHint: enhanced.layoutHint,
    creativeDirections: brief
      ? [
          `用途: ${brief.formatLabel} — 公式HPデザインは再現しない`,
          `構図: ${brief.compositionStyle}`,
          `シーン: ${brief.sceneConcept}`,
          `配色: ${brief.colorPalette.join(" / ")}（HP配色ではなく今回オリジナル）`,
          `タイポ: ${brief.typographyStyle}`,
          `商品: 公式画像を${brief.productPlacement.position}に配置（AI生成・改変禁止）`,
          `掲示: ${location} / サイズ: ${size}`,
        ]
      : [
          "公式HPのレイアウトは再現しない — オリジナル販促デザイン",
          "背景・配色・タイポ・装飾は毎回新規設計",
          "中央付近: 公式商品画像（加工・再生成禁止）",
          `掲示: ${location} / サイズ: ${size}`,
        ],
    imagePromptHint: brief
      ? `Original ${usage} promotional creative, ${brief.sceneConcept}, ${brief.compositionStyle}, colors: ${brief.colorPalette.join(", ")}, NOT website layout, NO product generation`
      : `Original promotional ${usage}, fresh creative design, NOT official website reproduction, ${style} aesthetic, NO product generation`,
    constraintsSummary: [
      ...(knowledge.antiPatterns?.slice(0, 3) ?? []),
      "3秒で訴求が伝わる構成",
    ].map((c) => `- ${c}`).join("\n"),
    outputFormat: answers.output_format || "POP文案+レイアウト+画像プロンプト",
    improvementPoints: purpose.successCriteria ?? [],
    sections: structure.sections?.length ? structure.sections : [
      "ヘッドライン",
      "サブコピー",
      "レイアウト指示",
      "画像生成プロンプト（英語）",
      "印刷・掲示注意点",
    ],
  };

  blueprint.lensReviews = lensReviews.length ? lensReviews : runLensReviews({
    context: blueprint,
    lenses: [
      { id: "designer", focus: "販促デザイナー", insight: () => `${location}では視認距離に合わせた文字サイズが必須。` },
      { id: "store", focus: "店内動線", insight: () => "受付・入口付近は3秒で意味が伝わる構成。" },
      { id: "brand", focus: "ブランド", insight: () => `${style}を維持。安売り感のあるデザインは避ける。` },
    ],
  });

  blueprint.quality = evaluateDeliverableQuality([
    { id: "product", label: "商品", pass: Boolean(answers.wam_product) },
    { id: "appeal", label: "訴求", pass: Boolean(answers.appeal_point) },
    { id: "challenge", label: "経営課題分析", pass: challenge.confidence >= 0.5 },
    { id: "layout", label: "クリエイブ方向", pass: blueprint.creativeDirections.length >= 3 },
    { id: "headline", label: "ヘッドライン", pass: Boolean(blueprint.headline) },
    { id: "size", label: "サイズ", pass: Boolean(size) },
  ]);

  return blueprint;
}
