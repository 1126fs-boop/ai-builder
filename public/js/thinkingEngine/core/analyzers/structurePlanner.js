/**
 * フェーズ6 — 最適構成決定
 *
 * Blueprint / Prompt Builder が参照する構成・ narrative・CTA 型を決定する。
 * 画像系: 固定レイアウトではなく creativeBrief（毎回異なるオリジナルデザイン）を生成。
 */

import {
  generateCreativeBrief,
  creativeBriefToLayoutSpec,
} from "../creative/creativeDesignEngine.js";
import { composeCreativeLayout } from "../creative/creativeLayoutComposer.js";

/** カテゴリ別デフォルト構成 */
const DEFAULT_SECTIONS = {
  proposal: [
    "エグゼクティブサマリー",
    "取引先の現状分析",
    "課題の深掘り",
    "提案ストーリー",
    "ソリューション提案",
    "売上アップ施策",
    "導入効果（ROI）",
    "90日導入ステップ",
    "想定懸念と回答",
    "次のアクション",
  ],
  sns: [
    "オリジナルビジュアルコンセプト",
    "キャッチコピー3案",
    "クリエイティブシーン生成プロンプト",
    "投稿キャプション",
    "ハッシュタグ",
    "CTA",
  ],
  newsletter: [
    "件名5案（開封率重視）",
    "プレヘッダー",
    "冒頭フック（3行）",
    "教育型本文",
    "ソフトセル（商品提案への橋渡し）",
    "CTA",
    "PS（追伸）",
  ],
  sales: [
    "アイスブレイク",
    "ラポール構築",
    "状況確認（SPIN-S）",
    "課題ヒアリング（SPIN-P/I）",
    "深掘り質問",
    "課題整理・要約",
    "提案ストーリー",
    "反論処理",
    "クロージング",
  ],
  image: [
    "ヘッドライン",
    "サブコピー",
    "オリジナルクリエイティブ指示",
    "シーン生成プロンプト",
    "印刷・掲示注意点",
  ],
};

const NARRATIVE_BY_CATEGORY = {
  proposal: "共感→現状分析→課題深掘り→Before/After→ROI→導入ステップ→差別化→CTA",
  sns: "1行目フック→課題共感→商品価値→CTA",
  newsletter: "件名フック→共感3行→教育型価値→ソフトセル→CTA→PS",
  sales: "アイスブレイク→SPINヒアリング→深掘り→課題整理→提案→反論→クロージング",
  image: "ヘッドライン→訴求→季節性→オリジナルクリエイティブ→CTA",
};

/**
 * @param {string} categoryId
 * @param {Object} input
 * @param {Object} input.purpose
 * @param {Object} input.challenge
 * @param {Object} input.knowledge
 * @param {Object} input.synthesis
 * @param {Object} input.answers
 */
export function planStructure(categoryId, input) {
  const { purpose, challenge, synthesis, answers, knowledge } = input;
  const sections = [...(DEFAULT_SECTIONS[categoryId] || DEFAULT_SECTIONS.proposal)];

  // 用途に応じた構成調整
  if (categoryId === "newsletter") {
    const ch = answers.channel || "";
    if (ch.includes("両方")) sections.push("LINE短文");
    else if (ch.includes("LINE") && !ch.includes("メルマガ")) {
      sections.length = 0;
      sections.push("LINE本文", "CTA");
    }
  }

  if (categoryId === "proposal" && (answers.proposal_scope || "").includes("プレゼン")) {
    sections[0] = "スライド1: エグゼクティブサマリー";
  }

  const copyStrategy = buildCopyStrategy(categoryId, purpose, challenge);
  const creativeBriefRaw =
    categoryId === "sns" || categoryId === "image"
      ? generateCreativeBrief(categoryId, answers, challenge, purpose)
      : null;
  const creativeBrief = creativeBriefRaw
    ? {
        ...creativeBriefRaw,
        layoutPlan: composeCreativeLayout(creativeBriefRaw, {
          productName: knowledge?.productKnowledge?.name ?? answers.wam_product,
        }),
      }
    : null;
  const layoutSpec = creativeBrief
    ? creativeBriefToLayoutSpec(creativeBrief, knowledge?.productKnowledge)
    : null;

  return {
    sections,
    narrativeArc: NARRATIVE_BY_CATEGORY[categoryId] || NARRATIVE_BY_CATEGORY.proposal,
    copyStrategy,
    layoutSpec,
    creativeBrief,
    ctaType: inferCtaType(categoryId, answers, purpose),
    tone: purpose.tone,
    outputFormat: answers.output_format || inferOutputFormat(categoryId, answers),
    promptBuilderDirectives: synthesis?.promptBuilderHints ?? [],
  };
}

function buildCopyStrategy(categoryId, purpose, challenge) {
  const base = {
    hook: "経営課題への共感",
    body: `${challenge.surfaceChallenge}→${challenge.impact}`,
    cta: "1つに絞る",
    avoid: ["商品スペックから入る", "AIっぽい表現", "公式HPデザインの再現"],
    successCriteria: purpose.successCriteria ?? [],
  };

  if (categoryId === "sns") {
    return { ...base, hook: "課題共感（3秒）", framework: "PAS" };
  }
  if (categoryId === "newsletter") {
    return {
      ...base,
      hook: "件名+冒頭3行で開封・続読",
      framework: "AIDA",
      educationFirst: true,
      softSell: "教育パート後に自然な橋渡し",
    };
  }
  if (categoryId === "proposal") {
    return {
      ...base,
      hook: "取引先課題への共感",
      framework: "BAB",
      roiRequired: true,
      differentiation: "経営課題解決の切り口",
    };
  }
  if (categoryId === "sales") {
    return {
      ...base,
      hook: "アイスブレイク→ラポール",
      framework: "SPIN",
      phases: "状況→課題→影響→解決イメージ→提案",
    };
  }
  if (categoryId === "image") {
    return { ...base, hook: "3秒ヘッドライン", framework: "AIDA", hierarchy: "ヘッド→サブ→ボディ→CTA" };
  }
  return base;
}

function inferCtaType(categoryId, answers, purpose) {
  if (categoryId === "sales") return answers.goal || "商談成功";
  if (categoryId === "newsletter") {
    return (answers.purpose || "").includes("セミナー") ? "セミナー申込" : "資料請求";
  }
  if (categoryId === "sns") return "プロフィールリンク / DM";
  if (categoryId === "proposal") {
    return (answers.proposal_scope || "").includes("プレゼン")
      ? "次回デモ・体験日確定"
      : "PoC開始日確定";
  }
  return "問い合わせ";
}

function inferOutputFormat(categoryId, answers) {
  const map = {
    proposal: "提案書全文",
    sns: "オリジナルクリエイティブ+キャプション",
    newsletter: "件名3+本文",
    sales: "営業台本",
    image: "POP文案+オリジナルクリエイティブ+シーンプロンプト",
  };
  return map[categoryId] || "テキスト";
}
