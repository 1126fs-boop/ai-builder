/**
 * カテゴリ別 — 多視点レンズ定義
 *
 * thinkingCore が Prompt Builder を強化するための多視点分析に使用。
 */

export const CATEGORY_LENSES = {
  proposal: ["beauty_consultant", "top_sales", "executive"],
  sns: ["marketer", "sns_manager", "beauty_consultant"],
  newsletter: ["marketer", "beauty_consultant", "top_sales"],
  sales: ["top_sales", "beauty_consultant", "executive"],
  image: ["marketer", "sns_manager", "beauty_consultant"],
};

/** 用途別 — 推奨 AI Adapter ID */
export const CATEGORY_RECOMMENDED_ADAPTERS = {
  proposal: ["chatgpt", "claude"],
  sns: ["chatgpt", "openai_images"],
  newsletter: ["chatgpt", "claude"],
  sales: ["chatgpt", "claude"],
  image: ["openai_images", "chatgpt"],
};

/** 用途別 — 期待する外部AI成果物（アプリの責務外・参考情報） */
export const CATEGORY_EXPECTED_ARTIFACT = {
  proposal: { type: "text", label: "提案書全文" },
  sns: { type: "image_with_caption", label: "SNS投稿画像+キャプション" },
  newsletter: { type: "text", label: "メール/LINE配信文" },
  sales: { type: "text", label: "営業台本" },
  image: { type: "image", label: "POP・販促ビジュアル" },
};
