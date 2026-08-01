/**
 * POP・販促物 — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
} from "./_shared.js";
import { resolveBlueprintInputs } from "./_context.js";

/**
 * @param {Object} ctx AnalysisContext エンベロープ
 */
export function buildPopPromoBlueprint(ctx) {
  const { answers, purpose, challenge, knowledge, structure, lensReviews, synthesis } = resolveBlueprintInputs(ctx);

  const product = answers.wam_product || knowledge.productKnowledge?.name || "【商品名】";
  const usage = answers.usage || "店内POP";
  const appeal = answers.appeal_point || "導入メリット";
  const location = answers.display_location || "サロン店内";
  const size = answers.size_format || "A4縦";
  const style = purpose.tone || "高級感・信頼感";

  const blueprint = {
    useCaseId: "pop_promo",
    purpose,
    challenge,
    synthesis,
    layoutSpec: structure.layoutSpec,
    knowledgeRefs: knowledge.refs ?? [],
    productAsset: knowledge.productKnowledge,
    product,
    usage,
    appealPoint: appeal,
    displayLocation: location,
    sizeFormat: size,
    style,
    impact: challenge.impact,
    headline: `${appeal}を実現する${product}`,
    subCopy: `${challenge.surfaceChallenge}（${challenge.impact}）の課題解決を支援`,
    layoutInstructions: [
      "上部: キャッチコピー（大）",
      "中央: 公式商品画像（加工・再生成禁止）",
      "下部: サブコピー + CTA（QR/問合せ）",
      `サイズ: ${size} / 掲示: ${location}`,
    ],
    imagePromptHint: `Professional beauty salon promotional ${usage}, empty product placement zone, ${style} aesthetic, Japanese text overlay space, clean layout, ${size}, NO product generation`,
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
    { id: "layout", label: "レイアウト", pass: blueprint.layoutInstructions.length >= 3 },
    { id: "headline", label: "ヘッドライン", pass: Boolean(blueprint.headline) },
    { id: "size", label: "サイズ", pass: Boolean(size) },
  ]);

  return blueprint;
}
