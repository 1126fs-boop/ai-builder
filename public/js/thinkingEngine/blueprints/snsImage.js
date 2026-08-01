/**
 * SNS投稿画像 — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
  resolveImpact,
} from "./_shared.js";

export function buildSnsImageBlueprint(answers) {
  const product = answers.wam_product || "【商品名】";
  const fmt = answers.sns_format || "Instagram投稿";
  const appeal = answers.appeal_axis || "導入メリット";
  const target = answers.target_audience || "サロンオーナー";
  const aspect = answers.aspect || "1:1（1080×1080）";
  const impact = resolveImpact(appeal === "売上アップ" ? "売上アップ" : appeal === "リピート率向上" ? "リピート率向上" : "売上アップ");

  const blueprint = {
    useCaseId: "sns_image",
    purpose: `${target}向け${fmt}。${product}の${appeal}を訴求`,
    snsFormat: fmt,
    product,
    appealAxis: appeal,
    targetAudience: target,
    aspect,
    impact,
    catchDirection: answers.catch_direction || "",
    visualConcept: `${product}を主役に、${appeal}を${target}が「自分ごと化」できる構図。経営課題（${impact}）と結びつけたビジュアル。`,
    copyPatterns: [
      `【数字訴求】${impact}を実現する${product}`,
      `【課題共感】${target}の${appeal}、${product}で変わる`,
      `【CTA】詳しくはプロフィールリンク / DMで「資料希望」`,
    ],
    captionStructure: "1行目フック → 課題共感 → 商品価値 → CTA",
    hashtags: "#美容サロン #サロン経営 #BtoB美容 #ワム #経営改善",
    constraintsSummary: "- 公式HP未掲載の商品表現禁止\n- 経営課題と結びつけた訴求\n- 商品写真のみの構成禁止（コピー必須）",
    outputFormat: answers.output_format || "画像生成プロンプト（英語）+キャプション",
    improvementPoints: [
      "視線誘導: 商品→キャッチ→CTA",
      "1枚で保存される構図",
      `${target}が共感する課題ワードを含める`,
    ],
    notes: answers.catch_direction ? `キャッチ方向: ${answers.catch_direction}` : "",
    sections: [
      "ビジュアルコンセプト",
      "キャッチコピー3案",
      "画像生成プロンプト（英語）",
      "投稿キャプション",
      "ハッシュタグ",
      "CTA",
    ],
  };

  blueprint.lensReviews = runLensReviews({
    context: blueprint,
    lenses: [
      {
        id: "designer",
        focus: "販促デザイナー",
        insight: (ctx) => `${ctx.product}を左1/3、キャッチを右。${ctx.aspect}で視認性優先。`,
      },
      {
        id: "sns",
        focus: "SNS運用",
        insight: (ctx) => `${ctx.snsFormat}は1行目3秒で課題に触れる。保存→プロフィール遷移設計。`,
      },
      {
        id: "owner",
        focus: "サロンオーナー視点",
        insight: (ctx) => `「${ctx.appealAxis}」が経営にどう効くかが見えないとスルーされる。`,
      },
    ],
  });

  blueprint.quality = evaluateDeliverableQuality([
    { id: "product", label: "商品指定", pass: Boolean(answers.wam_product) },
    { id: "appeal", label: "訴求軸", pass: Boolean(answers.appeal_axis) },
    { id: "target", label: "ターゲット", pass: Boolean(answers.target_audience) },
    { id: "copy", label: "コピー案", pass: blueprint.copyPatterns.length >= 3 },
    { id: "cta", label: "CTA", pass: blueprint.copyPatterns.some((c) => c.includes("CTA") || c.includes("DM")) },
  ]);

  return blueprint;
}
