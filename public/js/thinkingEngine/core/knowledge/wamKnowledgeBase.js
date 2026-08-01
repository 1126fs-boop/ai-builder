/**
 * WAM 公式 Knowledge Base
 *
 * 商品情報・ブランドルール・コピー表現を Prompt Builder へ一貫反映する。
 * 商品画像は AI 創作せず公式画像を利用する設計。
 */

import { WAM_OFFICIAL_SITE, WAM_PRODUCT_INDEX, resolveProductFromAnswers } from "../../../../wamProducts.js";

/** 株式会社ワム — ブランドルール（全 Prompt Builder 共通） */
export const WAM_BRAND_RULES = [
  "株式会社ワムは美容業界BtoBのソリューション営業企業",
  "商品スペック・カタログ説明から始めない",
  "経営課題解決を最優先とする",
  "誇大広告・根拠のない数値は禁止。不明は【】プレースホルダー",
  "自然な日本語。AIっぽい表現（「ぜひ」「〜してみませんか」連発）禁止",
  "CTA は1つに絞り、明日から実行できる粒度にする",
];

/** 訴求軸別 — 推奨コピー表現 */
export const WAM_COPY_EXPRESSIONS = {
  売上アップ: [
    "【数字訴求】{impact}を実現する{product}",
    "【課題共感】{target}の売上、{product}で変わる",
    "【成功イメージ】導入サロンは{impact}を実感",
  ],
  リピート率向上: [
    "【課題共感】リピートが伸びない{target}へ",
    "【価値訴求】{product}で再来店の理由が変わる",
    "【CTA】詳しくはプロフィールリンク",
  ],
  導入メリット: [
    "【経営視点】{target}の{challenge}、{product}で解決",
    "【ROI】{impact}を狙える導入メリット",
    "【CTA】無料相談はDMで「資料希望」",
  ],
  新商品告知: [
    "【新着】{product}が{target}の{challenge}に応える",
    "【限定感】今だけの導入サポート",
    "【CTA】詳細は公式ページへ",
  ],
  成功事例: [
    "【事例型】{impact}を達成した{target}の秘訣",
    "【共感】{challenge}から脱却した理由",
    "【CTA】事例資料を請求",
  ],
  新メニュー: [
    "【新メニュー】{product}で客単価アップ",
    "【訴求】{target}向け{impact}",
    "【CTA】メニュー資料を請求",
  ],
  キャンペーン: [
    "【期間限定】{product}導入キャンペーン",
    "【特典】{impact}を狙える今だけの条件",
    "【CTA】キャンペーン詳細はDMへ",
  ],
};

/** 商品カテゴリ別 — 訴求キーワード */
export const WAM_PRODUCT_KEYWORDS = {
  業務用エステ機器: ["サロン経営", "施術効果", "リピート", "客単価", "差別化"],
  家庭用美容機器: ["ホームケア", "サロン品質", "継続利用", "顧客満足"],
  業務用エステ化粧品: ["施術相性", "アップセル", "在庫回転"],
  インナーケア商品: ["インナービューティ", "健康経営", "スタッフケア"],
};

/**
 * 訴求軸に応じたコピー案を生成
 * @param {string} appealAxis
 * @param {Object} vars { product, target, impact, challenge }
 */
export function buildCopyPatterns(appealAxis, vars = {}) {
  const templates = WAM_COPY_EXPRESSIONS[appealAxis] || WAM_COPY_EXPRESSIONS["導入メリット"];
  const replace = (s) =>
    s
      .replace(/\{product\}/g, vars.product || "【商品名】")
      .replace(/\{target\}/g, vars.target || "サロンオーナー")
      .replace(/\{impact\}/g, vars.impact || "売上アップ")
      .replace(/\{challenge\}/g, vars.challenge || "経営課題");

  return templates.map(replace);
}

/**
 * ブランドルールブロック（プロンプト用）
 */
export function buildBrandRulesBlock() {
  return ["【WAM ブランドルール】", ...WAM_BRAND_RULES.map((r) => `- ${r}`)].join("\n");
}

/**
 * 商品ナレッジブロック（公式情報 + キーワード）
 * @param {Object|null} productKnowledge
 * @param {Object} answers
 */
export function buildWamProductKnowledgeBlock(productKnowledge, answers = {}) {
  const product = productKnowledge || resolveProductFromAnswers(answers);

  const lines = [
    "【WAM 公式 Knowledge Base】",
    `- 公式サイト: ${WAM_OFFICIAL_SITE}`,
    `- 製品一覧: ${WAM_PRODUCT_INDEX}`,
  ];

  if (!product) {
    lines.push(
      "",
      "【商品指定なし】",
      "- 背景・文字・レイアウトのみ生成",
      "- 商品ビジュアル創作禁止"
    );
    return lines.join("\n");
  }

  const keywords = WAM_PRODUCT_KEYWORDS[product.category] || WAM_PRODUCT_KEYWORDS["業務用エステ機器"];

  lines.push(
    "",
    "【公式商品情報】",
    `- 商品名: ${product.name}`,
    `- カテゴリ: ${product.category}`,
    `- 公式説明: ${product.description}`,
    `- 公式ページ: ${product.officialUrl}`,
    `- 訴求キーワード: ${keywords.join("、")}`
  );

  if (product.officialImageUrl) {
    lines.push(
      "",
      "【商品画像 — 公式画像をそのまま使用】",
      `- 公式商品画像URL: ${product.officialImageUrl}`,
      "- 商品画像はAI生成禁止。配置のみ。",
      "- AI生成対象: 背景・人物・装飾・文字・レイアウトのみ"
    );
  } else {
    lines.push(
      "",
      "【商品画像 — 公式画像なし】",
      `- ${product.name}: 公式HPに参照可能な商品画像URLなし`,
      "- 商品をAIで描いてはならない",
      answers.product_image_upload
        ? `- ユーザー提供画像: ${answers.product_image_upload}`
        : "- ユーザーへ公式商品画像のアップロードを案内"
    );
  }

  return lines.join("\n");
}

/**
 * thinkingCore 分析結果をプロンプトへ反映するブロック
 * @param {Object} bp Blueprint payload
 */
export function buildAnalysisReflectionBlock(bp) {
  const parts = [];

  if (bp.purpose?.primaryGoal) {
    parts.push(`【目的分析】${bp.purpose.primaryGoal}`);
  }
  if (bp.challenge?.surfaceChallenge) {
    parts.push(
      `【経営課題】${bp.challenge.surfaceChallenge} → 期待インパクト: ${bp.challenge.impact || bp.impact || "—"}`
    );
  }
  if (bp.challenge?.rootCause) {
    parts.push(`【根本原因】${bp.challenge.rootCause}`);
  }
  if (bp.synthesis?.finalDirection) {
    parts.push(`【多視点統合 — 設計方向】${bp.synthesis.finalDirection}`);
  }
  if (bp.synthesis?.agreedPoints?.length) {
    parts.push(
      "【多視点で合意した点】\n" + bp.synthesis.agreedPoints.map((p) => `- ${p}`).join("\n")
    );
  }
  if (bp.lensReviews?.length) {
    parts.push(
      "【多視点レビュー】\n" +
        bp.lensReviews.map((l) => `- ${l.focus}: ${l.insight}`).join("\n")
    );
  }
  if (bp.layoutSpec) {
    const ls = bp.layoutSpec;
    parts.push(
      `【レイアウト】商品=${ls.productZone?.position || "right"} / テキスト=${ls.textZone?.position || "left"} / 比率=${ls.productZone?.widthRatio || 0.45}`
    );
  }

  return parts.length ? parts.join("\n\n") : "";
}
