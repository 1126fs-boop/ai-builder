/**
 * クリエイティブ設計エンジン
 *
 * 公式HPは Knowledge Base のみ。デザインは毎回 AI がゼロから設計する。
 * 「HP再現AI」ではなく「公式素材で新しい販促クリエイティブを作るAI」。
 */

/** 用途別クリエイティブプロファイル */
const FORMAT_PROFILES = {
  instagram_post: {
    label: "Instagram投稿",
    match: /Instagram投稿/i,
    aspect: "1:1",
    compositions: ["asymmetric editorial split", "bold typographic hero", "minimal luxury grid", "dynamic diagonal flow"],
    scenes: [
      "modern beauty salon interior with dramatic side lighting",
      "abstract gradient studio backdrop with soft bokeh",
      "premium spa atmosphere with marble and botanical accents",
      "contemporary wellness lounge with geometric shadows",
    ],
  },
  instagram_story: {
    label: "Instagramストーリー",
    match: /ストーリー/i,
    aspect: "9:16",
    compositions: ["vertical full-bleed hero", "top-heavy headline zone", "immersive portrait scene", "stacked content blocks"],
    scenes: [
      "vertical cinematic beauty studio with depth of field",
      "immersive salon ambiance with warm ambient glow",
      "dynamic vertical motion blur aesthetic background",
      "elegant portrait-oriented wellness space",
    ],
  },
  instagram_reel: {
    label: "Instagramリール",
    match: /リール/i,
    aspect: "9:16",
    compositions: ["high-energy vertical frame", "motion-ready dynamic layout", "split-screen vertical", "center-focused punch"],
    scenes: [
      "energetic beauty business promotional backdrop",
      "vibrant salon environment with movement-friendly composition",
      "bold vertical gradient with light streaks",
    ],
  },
  line_image: {
    label: "LINE配信画像",
    match: /LINE/i,
    aspect: "1:1",
    compositions: ["friendly approachable layout", "clear message hierarchy", "soft rounded visual frame", "warm invitation style"],
    scenes: [
      "approachable beauty business communication backdrop",
      "soft pastel professional studio setting",
      "clean friendly salon consultation atmosphere",
    ],
  },
  pop_instore: {
    label: "店内POP",
    match: /店内POP|POP/i,
    aspect: "1:1",
    compositions: ["high-impact retail poster", "eye-catching point-of-purchase layout", "bold headline-driven design", "in-store promotional frame"],
    scenes: [
      "retail promotional backdrop with strong visual hierarchy space",
      "in-store beauty equipment showcase environment without products",
      "professional trade show aesthetic background",
    ],
  },
  banner_ad: {
    label: "広告バナー",
    match: /バナー|広告/i,
    aspect: "16:9",
    compositions: ["wide banner hero layout", "horizontal split composition", "ad-ready negative space zones", "digital display optimized frame"],
    scenes: [
      "wide format digital advertising backdrop",
      "professional B2B beauty industry promotional scene",
      "sleek horizontal studio environment",
    ],
  },
  carousel: {
    label: "カルーセル",
    match: /カルーセル/i,
    aspect: "1:1",
    compositions: ["multi-slide cohesive series frame", "carousel card 1 hero layout", "swipe-friendly visual rhythm", "consistent series opener"],
    scenes: [
      "cohesive social carousel opener background",
      "series-style beauty promotional scene with unified palette",
    ],
  },
  default: {
    label: "販促クリエイティブ",
    match: /.*/,
    aspect: "1:1",
    compositions: ["original promotional layout", "fresh asymmetric design", "editorial beauty marketing frame"],
    scenes: [
      "original beauty B2B promotional scene",
      "professional salon marketing backdrop",
    ],
  },
};

/** クリエイティブスタイルプリセット（毎回異なる方向性） */
const CREATIVE_STYLE_PRESETS = [
  {
    id: "instagram_modern",
    label: "Instagram風",
    composition: "social-native bold visual, thumb-stopping feed aesthetic",
    scene: "trendy social media ready beauty promotional scene",
    typography: "bold sans-serif social media headline style",
  },
  {
    id: "magazine_editorial",
    label: "雑誌風",
    composition: "editorial magazine spread layout with elegant whitespace",
    scene: "high-end beauty magazine editorial backdrop",
    typography: "serif headline with refined editorial hierarchy",
  },
  {
    id: "luxury_premium",
    label: "高級感",
    composition: "luxury premium asymmetric layout with gold accents space",
    scene: "luxury spa salon atmosphere with premium materials",
    typography: "elegant luxury serif with generous letter spacing",
  },
  {
    id: "korean_beauty",
    label: "韓国風",
    composition: "K-beauty clean minimal layout with soft gradients",
    scene: "Korean beauty aesthetic clean studio with soft pastel tones",
    typography: "clean modern Korean beauty brand typography style",
  },
  {
    id: "apple_minimal",
    label: "Apple風",
    composition: "Apple-style minimal hero layout with generous negative space",
    scene: "ultra-clean minimalist product showcase environment without products",
    typography: "San Francisco inspired clean minimal type hierarchy",
  },
  {
    id: "dynamic_bold",
    label: "ダイナミック",
    composition: "dynamic diagonal composition with energy and movement",
    scene: "bold energetic beauty business promotional environment",
    typography: "impactful bold display typography zones",
  },
];

/** 配色パレット候補（HP配色ではなく毎回選ぶ） */
const COLOR_PALETTES = [
  ["deep navy", "gold accent", "cream white"],
  ["soft rose", "charcoal gray", "warm ivory"],
  ["emerald green", "matte black", "champagne"],
  ["coral orange", "slate blue", "off-white"],
  ["lavender purple", "silver gray", "pearl white"],
  ["terracotta", "forest green", "sand beige"],
  ["midnight blue", "copper bronze", "soft gray"],
];

/** タイポグラフィ方向 */
const TYPOGRAPHY_STYLES = [
  "bold geometric sans-serif headlines with elegant thin subtext",
  "modern Japanese-friendly mixed typography with strong hierarchy",
  "luxury serif headlines with clean sans body space",
  "minimalist all-caps impact typography zone",
  "editorial magazine-style layered text areas",
  "contemporary rounded friendly type zones",
];

/** 商品配置バリエーション（固定右配置を避ける） */
const PRODUCT_PLACEMENTS = [
  { position: "bottom-center", widthRatio: 0.42, anchor: "bottom" },
  { position: "center-right", widthRatio: 0.4, anchor: "center" },
  { position: "top-left", widthRatio: 0.38, anchor: "top" },
  { position: "floating-center", widthRatio: 0.45, anchor: "center" },
  { position: "bottom-right", widthRatio: 0.4, anchor: "bottom" },
  { position: "center-left", widthRatio: 0.38, anchor: "center" },
];

/** ムード（訴求・課題から導出 + バリエーション） */
const MOOD_BY_APPEAL = {
  売上アップ: ["ambitious", "results-driven", "confident"],
  導入メリット: ["trustworthy", "professional", "solution-oriented"],
  新商品告知: ["fresh", "exciting", "premium launch"],
  成功事例: ["inspiring", "credible", "aspirational"],
  リピート率向上: ["warm", "relationship-focused", "loyalty-driven"],
};

/**
 * シード値（毎回異なるクリエイティブ用）
 */
function deriveSeed(answers) {
  const base = [
    answers.wam_product,
    answers.sns_format || answers.usage,
    answers.appeal_axis || answers.appeal_point,
    Date.now(),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFrom(arr, seed, offset = 0) {
  return arr[(seed + offset) % arr.length];
}

/**
 * フォーマット文字列からプロファイルを解決
 */
export function resolveFormatProfile(answers, categoryId) {
  const fmt = answers.sns_format || answers.usage || answers.size_format || "";
  for (const [key, profile] of Object.entries(FORMAT_PROFILES)) {
    if (key !== "default" && profile.match.test(fmt)) return { key, ...profile };
  }
  if (categoryId === "image") return { key: "pop_instore", ...FORMAT_PROFILES.pop_instore };
  return { key: "default", ...FORMAT_PROFILES.default };
}

/**
 * クリエイティブブリーフを生成（毎回異なるオリジナルデザイン）
 * @param {string} categoryId
 * @param {Object} answers
 * @param {Object} challenge
 * @param {Object} [purpose]
 */
export function generateCreativeBrief(categoryId, answers, challenge, purpose = {}) {
  const seed = deriveSeed(answers);
  const profile = resolveFormatProfile(answers, categoryId);
  const appeal = answers.appeal_axis || answers.appeal_point || "導入メリット";
  const moods = MOOD_BY_APPEAL[appeal] || MOOD_BY_APPEAL["導入メリット"];

  const aspect =
    answers.aspect ||
    (profile.aspect === "9:16"
      ? "9:16（1080×1920）"
      : profile.aspect === "16:9"
        ? "16:9（1920×1080）"
        : "1:1（1080×1080）");

  const productPlacement = pickFrom(PRODUCT_PLACEMENTS, seed, 2);
  const stylePreset = pickFrom(CREATIVE_STYLE_PRESETS, seed, 7);

  return {
    formatType: profile.key,
    formatLabel: profile.label,
    aspect,
    mood: pickFrom(moods, seed),
    colorPalette: pickFrom(COLOR_PALETTES, seed, 1),
    typographyStyle: stylePreset.typography || pickFrom(TYPOGRAPHY_STYLES, seed, 3),
    compositionStyle: stylePreset.composition || pickFrom(profile.compositions, seed),
    sceneConcept: stylePreset.scene || pickFrom(profile.scenes, seed, 5),
    creativeStyle: stylePreset.label,
    creativeStyleId: stylePreset.id,
    productPlacement,
    variationSeed: seed,
    designPrinciples: [
      "公式HPはKnowledge Baseのみ（商品情報・USP・ブランドトーン・世界観・商品画像）",
      "公式HPのレイアウト・配色・タイポグラフィは再現しない",
      "背景・人物・光・レイアウト・装飾・コピーは毎回ゼロから新規設計",
      "商品画像のみ公式画像を後から合成（AI生成・改変禁止）",
    ],
    challengeHook: challenge?.surfaceChallenge || "",
    appealAxis: appeal,
    targetAudience: answers.target_audience || purpose.audience || "サロンオーナー",
  };
}

/**
 * クリエイティブブリーフ → 英語シーンプロンプト（背景・人物・装飾のみ）
 */
export function buildCreativeScenePrompt(creativeBrief) {
  const cb = creativeBrief;
  const colors = cb.colorPalette.join(", ");

  return [
    `Original ${cb.formatLabel} promotional creative design, NOT a website reproduction, NOT mimicking any official homepage layout.`,
    `Scene concept: ${cb.sceneConcept}.`,
    `Mood: ${cb.mood}, professional beauty B2B marketing.`,
    `Color palette (fresh design, not from any website): ${colors}.`,
    `Composition style: ${cb.compositionStyle}.`,
    `Typography direction (for overlay zones): ${cb.typographyStyle}.`,
    `Aspect ratio ${cb.aspect}.`,
    `Design for ${cb.targetAudience}, appeal: ${cb.appealAxis}.`,
    `Leave natural compositional space for official product photo at ${cb.productPlacement.position}.`,
    "NO products, NO devices, NO machines, NO cosmetic bottles, NO packaging, NO logos, NO text in generated pixels.",
    "Every generation must feel like a unique new promotional creative, not a template reuse.",
  ].join(" ");
}

/**
 * プロンプト用 — クリエイティブ設計原則ブロック（日本語）
 */
export function buildCreativeDesignPrinciplesBlock(creativeBrief) {
  const cb = creativeBrief;
  return [
    "【クリエイティブ設計原則 — 最重要】",
    "- 公式HPは Knowledge Base のみ（商品情報・商品画像・ブランドルール）",
    "- 公式HPのレイアウト・配色・タイポグラフィ・ページ構図は再現禁止",
    "- 背景・人物・レイアウト・装飾・配色・タイポは毎回ゼロから新規設計",
    "- 商品画像のみ公式画像を配置（AI生成・改変禁止）",
    `- 今回の用途: ${cb.formatLabel}`,
    `- クリエイティブスタイル: ${cb.creativeStyle || "オリジナル"}`,
    `- 構図: ${cb.compositionStyle}`,
    `- シーン: ${cb.sceneConcept}`,
    `- 配色: ${cb.colorPalette.join(" / ")}`,
    `- タイポ方向: ${cb.typographyStyle}`,
    `- 商品配置ゾーン: ${cb.productPlacement.position}（公式画像を後から配置）`,
  ].join("\n");
}

/**
 * layoutSpec 互換オブジェクト（API合成用）
 */
export function creativeBriefToLayoutSpec(creativeBrief, productKnowledge) {
  return {
    aspect: creativeBrief.aspect,
    formatType: creativeBrief.formatType,
    formatLabel: creativeBrief.formatLabel,
    productZone: creativeBrief.productPlacement,
    colorPalette: creativeBrief.colorPalette,
    compositionStyle: creativeBrief.compositionStyle,
    sceneConcept: creativeBrief.sceneConcept,
    backgroundOnly: true,
    productImageMode: productKnowledge?.imageMode ?? "none",
    officialImageUrl: productKnowledge?.officialImageUrl ?? null,
    doNotMimicOfficialWebsite: true,
  };
}
