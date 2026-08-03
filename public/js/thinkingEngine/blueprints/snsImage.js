/**
 * SNS投稿画像 — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
} from "./_shared.js";
import { buildCopyPatterns } from "../core/knowledge/wamKnowledgeBase.js";
import { resolveBlueprintInputs, attachStrategicFields } from "./_context.js";

/**
 * @param {Object} ctx AnalysisContext エンベロープ
 */
export function buildSnsImageBlueprint(ctx) {
  const { answers, purpose, challenge, knowledge, structure, creativeBrief, lensReviews, synthesis } = resolveBlueprintInputs(ctx);

  const product = answers.wam_product || knowledge.productKnowledge?.name || "【商品名】";
  const fmt = answers.sns_format || "Instagram投稿";
  const appeal = answers.appeal_axis || "導入メリット";
  const target = answers.target_audience || purpose.audience || "サロンオーナー";
  const aspect = answers.aspect || creativeBrief?.aspect || "1:1（1080×1080）";
  const impact = challenge.impact;
  const brief = creativeBrief ?? structure?.creativeBrief ?? null;

  const blueprint = {
    useCaseId: "sns_image",
    purpose,
    challenge,
    synthesis,
    layoutSpec: structure.layoutSpec,
    creativeBrief: brief,
    knowledgeRefs: knowledge.refs ?? [],
    productAsset: knowledge.productKnowledge,
    snsFormat: fmt,
    product,
    appealAxis: appeal,
    targetAudience: target,
    aspect,
    impact,
    catchDirection: answers.catch_direction || "",
    visualConcept: brief
      ? `【オリジナル販促クリエイティブ】${brief.sceneConcept}。${appeal}を${target}向けに訴求。公式HPのデザインは再現せず、${brief.compositionStyle}で毎回新しい${brief.formatLabel}を設計。`
      : `${product}を主役に、${appeal}を${target}が「自分ごと化」できるオリジナル構図。${challenge.surfaceChallenge}（${impact}）と結びつけた新規ビジュアル。`,
    copyPatterns: buildCopyPatterns(appeal, {
      product,
      target,
      impact,
      challenge: challenge.surfaceChallenge,
    }),
    captionStructure: "1行目フック → 課題共感 → 商品価値 → CTA",
    hashtags: "#美容サロン #サロン経営 #BtoB美容 #ワム #経営改善",
    constraintsSummary: [
      ...(knowledge.antiPatterns?.slice(0, 2) ?? []),
      "公式HPのデザイン・レイアウトは再現しない",
      "背景・配色・タイポは毎回オリジナル設計",
      "商品画像のみ公式画像を配置",
      "経営課題と結びつけた訴求",
    ].map((c) => `- ${c}`).join("\n"),
    outputFormat: answers.output_format || "画像生成プロンプト（英語）+キャプション",
    improvementPoints: purpose.successCriteria ?? [],
    notes: answers.catch_direction ? `キャッチ方向: ${answers.catch_direction}` : "",
    sections: structure.sections?.length ? structure.sections : [
      "ビジュアルコンセプト",
      "キャッチコピー3案",
      "画像生成プロンプト（英語）",
      "投稿キャプション",
      "ハッシュタグ",
      "CTA",
    ],
  };

  blueprint.lensReviews = lensReviews.length ? lensReviews : runLensReviews({
    context: blueprint,
    lenses: [
      {
        id: "designer",
        focus: "販促デザイナー",
        insight: (c) =>
          brief
            ? `公式HPを再現せず、${brief.compositionStyle}で${c.aspect}のオリジナル${brief.formatLabel}を設計。配色: ${brief.colorPalette.join("/")}。`
            : `${c.product}を活かしたオリジナル構図。${c.aspect}で視認性優先。`,
      },
      {
        id: "sns",
        focus: "SNS運用",
        insight: (c) => `${c.snsFormat}は1行目3秒で${challenge.surfaceChallenge}に触れる。`,
      },
      {
        id: "owner",
        focus: "サロンオーナー視点",
        insight: (c) => `「${c.appealAxis}」が経営（${impact}）にどう効くかを明示。`,
      },
    ],
  });

  blueprint.quality = evaluateDeliverableQuality([
    { id: "product", label: "商品指定", pass: Boolean(answers.wam_product) },
    { id: "appeal", label: "訴求軸", pass: Boolean(answers.appeal_axis) },
    { id: "target", label: "ターゲット", pass: Boolean(answers.target_audience) },
    { id: "challenge", label: "経営課題分析", pass: challenge.confidence >= 0.5 },
    { id: "copy", label: "コピー案", pass: blueprint.copyPatterns.length >= 3 },
    { id: "cta", label: "CTA", pass: blueprint.copyPatterns.some((c) => c.includes("CTA") || c.includes("DM")) },
  ]);

  return attachStrategicFields(blueprint, { answers, purpose, challenge, knowledge, structure, lensReviews, synthesis });
}
