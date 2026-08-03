/**
 * WAM 公式 Knowledge Base
 *
 * 公式HPから取得するのは「商品情報・商品画像・ブランドルール」のみ。
 * レイアウト・配色・タイポグラフィ等のデザインは HP から取らず、毎回 AI が新規設計する。
 */

import { WAM_OFFICIAL_SITE, WAM_PRODUCT_INDEX, resolveProductFromAnswers } from "../../../../wamProducts.js";

/** 公式HP — 正規の商品画像取得元（デザインテンプレートではない） */
export const WAM_OFFICIAL_IMAGE_SOURCE = {
  role: "正規の商品画像取得元",
  notUsedFor: ["レイアウト", "配色", "タイポグラフィ", "HPデザインの再現"],
  usedFor: ["商品名", "公式説明", "USP", "ブランドトーン", "公式商品画像URL"],
};

/** 公式HPから取得してよい情報（Knowledge Base のみ） */
export const WAM_KB_FROM_HP = [
  "商品名・カテゴリ・公式説明文・USP",
  "公式商品画像URL",
  "ブランドルール・ブランドトーン・世界観・コピー表現ガイド",
];

/** 公式HPから取得してはいけない情報（デザインテンプレート禁止） */
export const WAM_KB_NEVER_FROM_HP = [
  "公式HPのページレイアウト",
  "公式サイトの配色・タイポグラフィ",
  "商品ページの構図・余白設計",
  "HPスクリーンショット風デザイン",
];

/** AI が毎回ゼロから設計する要素 */
export const WAM_AI_DESIGNS_FRESH = [
  "背景",
  "人物",
  "レイアウト",
  "配色",
  "装飾",
  "タイポグラフィ",
  "全体構図",
  "コピー配置",
];

/** クリエイティブ設計の禁止事項 */
export const WAM_CREATIVE_ANTI_PATTERNS = [
  "公式HPのレイアウト・配色・タイポグラフィを再現しない",
  "公式サイトや商品ページのデザインをテンプレートとして使わない",
  "HPスクリーンショット風・Webページ風の見た目にしない",
  "毎回同じ構図・同じ配色のテンプレートを使い回さない",
  "商品画像以外を公式HPの見た目に合わせない",
];

/** 株式会社ワム — ブランドトーン・世界観（Knowledge Base — デザインテンプレートではない） */
export const WAM_BRAND_TONE = {
  primary: "高級感・信頼感・プロフェッショナル",
  voice: "経営課題解決を最優先。商品スペックから入らない",
  avoid: "安売り感・煽り・AIっぽい表現・誇大広告",
};

/** 株式会社ワム — USP（Unique Selling Proposition） */
export const WAM_USP = [
  "美容業界BtoBのソリューション営業 — 経営課題から提案",
  "業務用エステ機器・化粧品・インナーケアまで一貫サポート",
  "サロン経営の売上アップ・リピート率向上・業務効率化に貢献",
  "導入から運用まで伴走するパートナー",
];

/** 株式会社ワム — ブランド世界観（コピー・クリエイティブの方向性） */
export const WAM_WORLDVIEW = [
  "サロンオーナーの経営成功を真剣に支援するパートナー",
  "施術のプロフェッショナルと経営者の両方に寄り添う",
  "美容業界の未来を、テクノロジーと人の力で創る",
  "信頼・実績・継続支援 — 一過性の売り切りではない",
];
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
 * Knowledge Base スコープブロック（プロンプト用）
 */
export function buildKbScopeBlock() {
  return [
    "【Knowledge Base スコープ — 公式HP】",
    "取得してよい情報:",
    ...WAM_KB_FROM_HP.map((r) => `- ${r}`),
    "",
    "取得禁止（デザインテンプレートとして使わない）:",
    ...WAM_KB_NEVER_FROM_HP.map((r) => `- ${r}`),
    "",
    "AIが毎回ゼロから設計:",
    ...WAM_AI_DESIGNS_FRESH.map((r) => `- ${r}`),
  ].join("\n");
}

/**
 * クリエイティブ禁止パターンブロック
 */
export function buildCreativeAntiPatternsBlock() {
  return ["【クリエイティブ禁止事項】", ...WAM_CREATIVE_ANTI_PATTERNS.map((r) => `- ${r}`)].join("\n");
}

/**
 * ブランドトーン・USP・世界観ブロック（Knowledge Base）
 */
export function buildBrandWorldviewBlock() {
  return [
    "【WAM ブランド Knowledge — HPから取得（デザイン参考禁止）】",
    `- ブランドトーン: ${WAM_BRAND_TONE.primary}`,
    `- 文体: ${WAM_BRAND_TONE.voice}`,
    `- 避ける表現: ${WAM_BRAND_TONE.avoid}`,
    "",
    "【USP（独自の強み）】",
    ...WAM_USP.map((u) => `- ${u}`),
    "",
    "【ブランド世界観】",
    ...WAM_WORLDVIEW.map((w) => `- ${w}`),
  ].join("\n");
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
    "【WAM Knowledge Base — 公式HP参照範囲】",
    `- 参照元: ${WAM_PRODUCT_INDEX}（商品情報・画像・ブランドルールのみ）`,
    "- 公式HPのデザイン・レイアウトは参照しない",
  ];

  if (!product) {
    lines.push(
      "",
      "【商品指定なし】",
      "- 背景・人物・装飾・レイアウト・配色・タイポはAIが毎回新規設計",
      "- 公式HPの見た目を再現しない"
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
      "- 商品画像はAI生成禁止。公式画像を後から配置のみ。",
      "- 背景・人物・装飾・レイアウト・配色・タイポはAIが毎回ゼロから設計",
      "- 公式HPのページデザイン・配色・タイポグラフィは再現禁止"
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
  const intent = bp.strategicIntent ?? bp.purpose?.strategicIntent;
  if (intent?.primaryLabel) {
    parts.push(
      `【戦略的意図 — ${intent.primaryLabel}】`,
      `- なぜ（Why）: ${intent.why}`,
      `- 何を（What）: ${intent.what}`,
      `- どう（How）: ${intent.how}`,
      `- 読者が得たいこと: ${intent.audienceJob}`
    );
  }
  if (bp.strategicBlueprint?.winStrategy) {
    parts.push(`【勝ち筋】${bp.strategicBlueprint.winStrategy}`);
    if (bp.strategicBlueprint.appealPriority?.length) {
      parts.push(`【訴求優先順位】${bp.strategicBlueprint.appealPriority.join(" → ")}`);
    }
    if (bp.strategicBlueprint.psychologicalTriggers?.length) {
      parts.push(
        "【動かす心理】\n" + bp.strategicBlueprint.psychologicalTriggers.map((t) => `- ${t}`).join("\n")
      );
    }
    if (bp.strategicBlueprint.priorityOrder?.length) {
      parts.push(`【伝える順番】${bp.strategicBlueprint.priorityOrder.join(" → ")}`);
    }
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
  if (bp.synthesis?.councilSummary) {
    parts.push(bp.synthesis.councilSummary);
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
  if (bp.creativeBrief) {
    const cb = bp.creativeBrief;
    parts.push(
      `【クリエイティブ方向 — 今回オリジナル設計】`,
      `- 用途: ${cb.formatLabel}`,
      `- 構図: ${cb.compositionStyle}`,
      `- シーン: ${cb.sceneConcept}`,
      `- 配色: ${cb.colorPalette?.join(" / ") || "—"}`,
      `- タイポ: ${cb.typographyStyle}`,
      `- 商品配置: ${cb.productPlacement?.position || "—"}（公式画像のみ）`
    );
  } else if (bp.layoutSpec?.compositionStyle) {
    const ls = bp.layoutSpec;
    parts.push(
      `【クリエイティブ方向】${ls.compositionStyle}`,
      `- 配色: ${ls.colorPalette?.join(" / ") || "—"}`,
      `- 商品配置: ${ls.productZone?.position || "—"}`
    );
  }

  return parts.length ? parts.join("\n\n") : "";
}
