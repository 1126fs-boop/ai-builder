/**
 * AI Builder — カテゴリ定義
 *
 * 美容業界 BtoB メーカー営業専用。
 * 質問 → questions.js / プロンプト → promptBuilder.js
 */

/** @typedef {{ id: string, label: string, icon: string, description: string, popular?: boolean }} CategoryMeta */

/** @type {CategoryMeta[]} */
export const CATEGORIES = [
  {
    id: "sales",
    label: "営業トーク",
    icon: "💼",
    description: "商談・テレアポ・DM・LINE など、そのまま使える営業台本",
    popular: true,
  },
  {
    id: "proposal",
    label: "提案書作成",
    icon: "📋",
    description: "取引先向け提案書・プレゼン資料（成果物Blueprint）",
    popular: true,
  },
  {
    id: "newsletter",
    label: "メルマガ・LINE",
    icon: "📧",
    description: "取引先向けメール・LINE配信文（件名・本文・CTA）",
    popular: true,
  },
  {
    id: "training",
    label: "教育・ロープレ",
    icon: "🎯",
    description: "スタッフ教育・営業ロープレ・研修資料",
    popular: true,
  },
  {
    id: "sns",
    label: "SNS投稿画像",
    icon: "📱",
    description: "Instagram/LINE向け画像＋キャプション＋生成プロンプト",
    popular: false,
  },
  {
    id: "image",
    label: "POP・販促物",
    icon: "🎨",
    description: "店内POP・販促ビジュアル（文案＋レイアウト＋画像プロンプト）",
    popular: false,
  },
  {
    id: "agent",
    label: "AIエージェント",
    icon: "🤖",
    description: "営業支援 AI・商談ロープレ AI",
    popular: false,
  },
  {
    id: "analysis",
    label: "分析",
    icon: "📊",
    description: "取引先分析・提案準備・ヒアリング設計",
    popular: false,
  },
  {
    id: "other",
    label: "その他",
    icon: "✨",
    description: "メール・資料など自由な用途",
    popular: false,
  },
];

const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

/** @param {string} id @returns {CategoryMeta|undefined} */
export function getCategory(id) {
  return categoryMap.get(id);
}

/** @returns {CategoryMeta[]} */
export function getAllCategories() {
  return CATEGORIES;
}

/** @returns {CategoryMeta[]} */
export function getPopularCategories() {
  return CATEGORIES.filter((c) => c.popular);
}

/** @param {string} query @returns {CategoryMeta[]} */
export function searchCategories(query) {
  const q = query.trim().toLowerCase();
  if (!q) return CATEGORIES;
  return CATEGORIES.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );
}
