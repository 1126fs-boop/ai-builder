/**
 * カテゴリ別 — 多視点レンズ定義
 *
 * thinkingCore が Prompt Builder を強化するための多視点分析に使用。
 */

export const CATEGORY_LENSES = {
  proposal: ["management", "roi", "sales", "marketing"],
  sns: ["sns", "instagram", "beauty", "marketing", "copy", "design"],
  newsletter: ["marketing", "beauty", "copy", "management"],
  sales: ["sales", "psychology", "beauty", "management"],
  image: ["design", "marketing", "beauty", "copy"],
};

/** @deprecated CATEGORY_LENS_PANELS（lensRegistry.js）を参照。後方互換のため残す */
export const CATEGORY_LENS_PANELS_LEGACY = {
  proposal: ["beauty_consultant", "top_sales", "executive"],
  sns: ["marketer", "sns_manager", "beauty_consultant"],
  newsletter: ["marketer", "beauty_consultant", "top_sales"],
  sales: ["top_sales", "beauty_consultant", "executive"],
  image: ["marketer", "sns_manager", "beauty_consultant"],
};

/** 用途別 — 推奨 AI Adapter ID（画像生成は ChatGPT アプリ経由） */
export const CATEGORY_RECOMMENDED_ADAPTERS = {
  proposal: ["chatgpt", "claude"],
  sns: ["chatgpt"],
  newsletter: ["chatgpt", "claude"],
  sales: ["chatgpt", "claude"],
  image: ["chatgpt"],
};

/** 用途別 — 期待する外部AI成果物（アプリの責務外・参考情報） */
export const CATEGORY_EXPECTED_ARTIFACT = {
  proposal: { type: "text", label: "提案書全文" },
  sns: { type: "image_with_caption", label: "SNS投稿画像+キャプション" },
  newsletter: { type: "text", label: "メール/LINE配信文" },
  sales: { type: "text", label: "営業台本" },
  image: { type: "image", label: "POP・販促ビジュアル" },
};
