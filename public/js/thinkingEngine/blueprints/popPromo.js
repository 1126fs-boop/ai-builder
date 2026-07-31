/**
 * POP・販促物 — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
  resolveImpact,
} from "./_shared.js";

export function buildPopPromoBlueprint(answers) {
  const product = answers.wam_product || "【商品名】";
  const usage = answers.usage || "店内POP";
  const appeal = answers.appeal_point || "導入メリット";
  const location = answers.display_location || "サロン店内";
  const size = answers.size_format || "A4縦";
  const style = answers.style || "高級感・信頼感";

  const blueprint = {
    useCaseId: "pop_promo",
    purpose: `${location}向け${usage}。${product}の${appeal}を訴求`,
    product,
    usage,
    appealPoint: appeal,
    displayLocation: location,
    sizeFormat: size,
    style,
    headline: `${appeal}を実現する${product}`,
    subCopy: "サロン経営の課題解決を支援（詳細はスタッフまで）",
    layoutInstructions: [
      "上部: キャッチコピー（大）",
      "中央: 商品画像（公式HP参照）",
      "下部: サブコピー + CTA（QR/問合せ）",
      `サイズ: ${size} / 掲示: ${location}`,
    ],
    imagePromptHint: `Professional beauty salon promotional ${usage}, product "${product}", ${style} aesthetic, Japanese text overlay space, clean layout, ${size}`,
    constraintsSummary: "- 公式HP未掲載商品の創作禁止\n- 経営課題訴求を含める\n- 読みやすい文字サイズ・コントラスト",
    outputFormat: answers.output_format || "POP文案+レイアウト+画像プロンプト",
    improvementPoints: [
      "3秒で訴求が伝わる",
      "遠目でも読めるコピー",
      "商品＋課題の両方を視覚化",
    ],
    sections: [
      "ヘッドライン",
      "サブコピー",
      "レイアウト指示",
      "画像生成プロンプト（英語）",
      "印刷・掲示注意点",
    ],
  };

  blueprint.lensReviews = runLensReviews({
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
    { id: "layout", label: "レイアウト", pass: blueprint.layoutInstructions.length >= 3 },
    { id: "headline", label: "ヘッドライン", pass: Boolean(blueprint.headline) },
    { id: "size", label: "サイズ", pass: Boolean(size) },
  ]);

  return blueprint;
}
