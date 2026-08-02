/**
 * 営業トーク — カテゴリ専用 Knowledge Base
 */

export const SALES_CATEGORY_KB = {
  categoryId: "sales",
  label: "営業トーク",
  version: "2026-08",
  principles: [
    "商品説明から入らない — 共感→ヒアリング→提案",
    "SPIN: Situation→Problem→Implication→Need-payoff",
    "アイスブレイク→ラポール→深掘り→提案→反論→クロージング",
    "商談ゴールは1つ（デモ・PoC・見積）",
    "タイプ別: 商談/テレアポ/DM/LINE/新規/既存フォロー",
    "反論6パターン以上を先回り",
  ],
  salesTypes: {
    商談: "15分ヒアリング優先。押し売り禁止",
    テレアポ: "30秒フック→アポ獲得",
    DM: "事例1点→低プレッシャーCTA",
    LINE: "短文・価値先行・返信しやすい",
    新規開拓: "信頼構築→課題仮説→事例",
    既存フォロー: "前回振り返り→進捗確認→次ステップ",
  },
};

export function buildSalesCategoryBlock(context = {}) {
  const lines = [`【営業トーク専用 KB — ${SALES_CATEGORY_KB.label}】`];
  SALES_CATEGORY_KB.principles.forEach((p) => lines.push(`- ${p}`));
  if (context.salesType && SALES_CATEGORY_KB.salesTypes[context.salesType]) {
    lines.push("", `■ ${context.salesType}: ${SALES_CATEGORY_KB.salesTypes[context.salesType]}`);
  }
  return lines.join("\n");
}
