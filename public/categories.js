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
    label: "営業",
    icon: "💼",
    description: "商談・テレアポ・DM・LINE など BtoB 営業",
    popular: true,
  },
  {
    id: "proposal",
    label: "提案書",
    icon: "📋",
    description: "提案書・プレゼン資料・ソリューション提案",
    popular: true,
  },
  {
    id: "newsletter",
    label: "メルマガ",
    icon: "📧",
    description: "取引先サロン向けメール・フォロー",
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
    label: "SNS",
    icon: "📱",
    description: "サロン向け販促・集客 SNS コンテンツ",
    popular: false,
  },
  {
    id: "image",
    label: "販促・POP",
    icon: "🎨",
    description: "POP・店内貼り・販促ビジュアル（公式HP商品参照）",
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
