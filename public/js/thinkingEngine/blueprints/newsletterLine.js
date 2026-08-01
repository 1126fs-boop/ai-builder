/**
 * メルマガ・LINE — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
} from "./_shared.js";

export function buildNewsletterLineBlueprint(answers) {
  const channel = answers.channel || "メルマガ（メール）";
  const purpose = answers.purpose || "フォロー・関係強化";
  const audience = answers.audience || "既存取引先";
  const value = answers.value || "売上アップ施策";
  const topic = answers.product_topic || purpose;
  const tone = answers.tone || "プロフェッショナル";
  const isLine = channel.includes("LINE") && !channel.includes("メルマガ");
  const isBoth = channel.includes("両方");

  const blueprint = {
    useCaseId: "newsletter_line",
    purpose: `${audience}向け${channel}。${purpose}として${value}を提供`,
    channel,
    purposeLabel: purpose,
    audience,
    value,
    topic,
    tone,
    openingHook: `${audience}の${value}に直結する情報を、押し売りなく届ける`,
    subjectLines: [
      `【${value}】${topic}のご案内`,
      `${audience}様へ｜${purpose.replace(/・.*/, "")}のお知らせ`,
      `【限定】${topic} — 経営改善のヒント`,
    ],
    bodyStructure: [
      "挨拶・配信目的（1段落）",
      "読者の課題への共感",
      "提供価値・具体施策",
      "事例または数字イメージ",
      "CTA（1つ）",
    ],
    lineVersion: "300字以内。短文・改行多め。絵文字控えめ。CTA1つ。",
    cta: purpose.includes("セミナー") ? "セミナーお申し込み" : "資料請求・お問い合わせ",
    constraintsSummary: "- 押し売り禁止\n- 経営課題起点\n- 1通1CTA",
    outputFormat: answers.output_format || "件名3+本文",
    improvementPoints: [
      "件名は30字以内で課題に触れる",
      "本文は scannable（見出し・箇条書き）",
      isLine ? "LINEは読了30秒以内" : "メールは500〜800字目安",
    ],
    sections: isBoth
      ? ["件名3案", "メール本文", "LINE短文", "CTA"]
      : isLine
        ? ["LINE本文", "CTA"]
        : ["件名3案", "メール本文", "CTA"],
  };

  blueprint.lensReviews = runLensReviews({
    context: blueprint,
    lenses: [
      { id: "marketer", focus: "BtoBマーケ", insight: () => `開封率は件名の課題ワードが8割。${value}を明示。` },
      { id: "reader", focus: "オーナー視点", insight: () => "時間がない。最初の3行で価値が分かること。" },
      { id: "brand", focus: "ブランド", insight: () => "コンサル調すぎず、現場感のある日本語。" },
    ],
  });

  blueprint.quality = evaluateDeliverableQuality([
    { id: "audience", label: "配信先", pass: Boolean(answers.audience) },
    { id: "value", label: "提供価値", pass: Boolean(answers.value) },
    { id: "subject", label: "件名案", pass: blueprint.subjectLines.length >= 3 },
    { id: "cta", label: "CTA", pass: Boolean(blueprint.cta) },
    { id: "structure", label: "構成", pass: blueprint.bodyStructure.length >= 4 },
  ]);

  return blueprint;
}
