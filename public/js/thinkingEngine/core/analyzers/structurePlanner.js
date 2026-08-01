/**
 * フェーズ6 — 最適構成決定
 *
 * Blueprint / Prompt Builder が参照する構成・ narrative・CTA 型を決定する。
 */

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
    "ビジュアルコンセプト",
    "キャッチコピー3案",
    "背景生成プロンプト",
    "投稿キャプション",
    "ハッシュタグ",
    "CTA",
  ],
  newsletter: ["件名3案", "メール本文", "CTA"],
  sales: [
    "冒頭（共感）",
    "ヒアリング3問",
    "課題整理",
    "提案ストーリー",
    "反論処理",
    "クロージング",
  ],
  image: [
    "ヘッドライン",
    "サブコピー",
    "レイアウト指示",
    "背景生成プロンプト",
    "印刷・掲示注意点",
  ],
};

const NARRATIVE_BY_CATEGORY = {
  proposal: "共感→現状分析→課題深掘り→Before/After→提案→施策→ROI→CTA",
  sns: "1行目フック→課題共感→商品価値→CTA",
  newsletter: "挨拶→共感→価値→具体→CTA",
  sales: "共感→ヒアリング→課題整理→提案→反論処理→クロージング",
  image: "ヘッドライン→訴求→レイアウト→背景（商品は公式画像）",
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
  const layoutSpec = buildLayoutSpec(categoryId, answers, knowledge);

  return {
    sections,
    narrativeArc: NARRATIVE_BY_CATEGORY[categoryId] || NARRATIVE_BY_CATEGORY.proposal,
    copyStrategy,
    layoutSpec,
    ctaType: inferCtaType(categoryId, answers, purpose),
    tone: purpose.tone,
    outputFormat: answers.output_format || inferOutputFormat(categoryId, answers),
    promptBuilderDirectives: synthesis?.promptBuilderHints ?? [],
  };
}

function buildCopyStrategy(categoryId, purpose, challenge) {
  return {
    hook: categoryId === "sns" ? "課題共感（3秒）" : "経営課題への共感",
    body: `${challenge.surfaceChallenge}→${challenge.impact}`,
    cta: "1つに絞る",
    avoid: ["商品スペックから入る", "AIっぽい表現"],
    successCriteria: purpose.successCriteria ?? [],
  };
}

function buildLayoutSpec(categoryId, answers, knowledge) {
  if (categoryId !== "sns" && categoryId !== "image") return null;

  const aspect = answers.aspect || answers.size_format || "1:1（1080×1080）";
  const product = knowledge?.productKnowledge;

  return {
    aspect,
    productZone: { position: "right", widthRatio: 0.45 },
    textZone: { position: "left", widthRatio: 0.5 },
    backgroundOnly: true,
    productImageMode: product?.imageMode ?? "none",
    officialImageUrl: product?.officialImageUrl ?? null,
  };
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
    sns: "画像プロンプト+キャプション",
    newsletter: "件名3+本文",
    sales: "営業台本",
    image: "POP文案+レイアウト+背景プロンプト",
  };
  return map[categoryId] || "テキスト";
}
