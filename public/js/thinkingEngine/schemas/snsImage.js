/**
 * SNS投稿画像 — Question Schema
 */

import { getProductChoiceOptions } from "../../../wamProducts.js";

const APPEAL_OPTIONS = ["売上アップ", "導入メリット", "新商品告知", "成功事例", "リピート率向上"];

export const SNS_IMAGE_DYNAMIC_QUESTIONS = {
  wam_product: {
    id: "wam_product",
    text: "訴求する商品は？（公式HP掲載）",
    type: "choice",
    options: getProductChoiceOptions(),
    hint: "株式会社ワム公式HP掲載商品から選択",
    qualityImpact: "critical",
  },
  target_audience: {
    id: "target_audience",
    text: "誰に向けた画像？",
    type: "choice",
    options: ["サロンオーナー", "施術者・スタッフ", "来店客（BtoC風）", "代理店パートナー"],
    hint: "ターゲットでトーンと訴求が変わります",
    qualityImpact: "high",
  },
  catch_direction: {
    id: "catch_direction",
    text: "キャッチの方向性（任意）",
    type: "text",
    placeholder: "例: 数字で効果を見せたい / 高級感 / 親しみやすく",
    optional: true,
    hint: "入力するとコピーの精度が上がります",
    qualityImpact: "medium",
  },
};

/** @type {import("./types.js").UseCaseSchema} */
export const SNS_IMAGE_SCHEMA = {
  useCaseId: "sns_image",
  categoryId: "sns",
  label: "SNS投稿画像",
  seedQuestions: [
    {
      id: "sns_format",
      text: "SNSの形式は？",
      type: "choice",
      options: ["Instagram投稿", "Instagramストーリー", "Instagramリール", "LINE配信画像"],
      hint: "サイズ・構成が自動で最適化されます",
      qualityImpact: "critical",
    },
    {
      id: "appeal_axis",
      text: "一番訴求したいことは？",
      type: "choice",
      options: APPEAL_OPTIONS,
      hint: "経営課題と結びつけた訴求軸を設計します",
      qualityImpact: "critical",
    },
  ],
  dynamicQuestions: SNS_IMAGE_DYNAMIC_QUESTIONS,
  dynamicRules: [
    {
      questionId: "wam_product",
      priority: 100,
      when: (a) => !a.wam_product?.trim(),
      reason: "商品が未定だとビジュアルとコピーが具体化できない",
    },
    {
      questionId: "target_audience",
      priority: 90,
      when: (a) => !a.target_audience?.trim(),
      reason: "ターゲット不明だとトーンとCTAがブレる",
    },
    {
      questionId: "catch_direction",
      priority: 50,
      when: (a) => !a.catch_direction?.trim(),
      reason: "キャッチ方向があるとコピー精度が上がる",
    },
  ],
  maxDynamicQuestions: 3,
  inferDefaults(answers) {
    const fmt = answers.sns_format || "Instagram投稿";
    const aspectMap = {
      "Instagram投稿": "1:1（1080×1080）",
      "Instagramストーリー": "9:16（1080×1920）",
      "Instagramリール": "9:16（1080×1920）",
      "LINE配信画像": "1:1（1024×1024）",
    };
    return {
      aspect: aspectMap[fmt] || "1:1",
      tone: "高級感・信頼感（ワムブランド準拠）",
      output_format: fmt.includes("リール") ? "リール構成+画像プロンプト" : "画像生成プロンプト（英語）+キャプション",
    };
  },
  estimateQuality(answers, pending) {
    let s = 0.35;
    if (answers.sns_format) s += 0.15;
    if (answers.appeal_axis) s += 0.15;
    if (answers.wam_product) s += 0.2;
    if (answers.target_audience) s += 0.15;
    if (answers.catch_direction?.trim()) s += 0.1;
    s -= pending * 0.05;
    return Math.min(1, Math.max(0, Math.round(s * 100) / 100));
  },
};
