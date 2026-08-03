/**
 * POP・販促物 — カテゴリ専用 Knowledge Base
 */

export const IMAGE_CATEGORY_KB = {
  categoryId: "image",
  label: "POP・販促物",
  version: "2026-08",
  principles: [
    "3秒ルール — 遠目でも意味が伝わる",
    "コピー階層: ヘッド→サブ→ボディ→CTA",
    "掲示場所別: 受付/店内/入口/施術室で文字量・サイズを変える",
    "美容サロン向け: 高級感と信頼感のバランス",
    "行動喚起: QR・問い合わせ・予約（1つ）",
    "公式商品画像は正規取得元から — AI生成・改変禁止",
  ],
  appealOrder: ["フック（課題/ベネフィット）", "共感", "商品価値", "証拠・数字", "CTA"],
  locationRules: {
    受付: "大文字・1メッセージ・3秒視認",
    店内: "待ち時間に読める詳細可",
    入口: "遠目視認・コントラスト強",
  },
  metrics: ["視認率", "来店問い合わせ", "QRスキャン", "予約転換"],
};

export function buildImageCategoryBlock(context = {}) {
  const lines = [`【POP・販促専用 KB — ${IMAGE_CATEGORY_KB.label}】`];
  IMAGE_CATEGORY_KB.principles.forEach((p) => lines.push(`- ${p}`));
  lines.push("", "■ 訴求順");
  IMAGE_CATEGORY_KB.appealOrder.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  if (context.displayLocation) {
    lines.push("", `■ 掲示: ${context.displayLocation}`);
  }
  return lines.join("\n");
}
