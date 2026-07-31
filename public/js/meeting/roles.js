/**
 * AI会議 — 役割別AI定義（8役割）
 */

/** @typedef {Object} MeetingRole
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} color
 * @property {string} description
 * @property {boolean} isFacilitator
 */

/** @type {MeetingRole[]} */
export const MEETING_ROLES = [
  {
    id: "sales_director",
    name: "営業部長AI",
    icon: "👔",
    color: "#2563eb",
    description: "営業組織全体の戦略・KPI・チームマネジメントの視点",
    isFacilitator: false,
  },
  {
    id: "top_sales",
    name: "トップ営業AI",
    icon: "🏆",
    color: "#059669",
    description: "現場の商談・クロージング・顧客関係構築の視点",
    isFacilitator: false,
  },
  {
    id: "beauty_consultant",
    name: "美容コンサルAI",
    icon: "💆",
    color: "#db2777",
    description: "サロン・クリニックの経営課題・メニュー設計の視点",
    isFacilitator: false,
  },
  {
    id: "marketer",
    name: "マーケターAI",
    icon: "📊",
    color: "#7c3aed",
    description: "集客・ブランディング・販促施策の視点",
    isFacilitator: false,
  },
  {
    id: "executive",
    name: "経営者AI",
    icon: "💼",
    color: "#0f766e",
    description: "ROI・中長期戦略・投資判断の視点",
    isFacilitator: false,
  },
  {
    id: "sns_manager",
    name: "SNS運用AI",
    icon: "📱",
    color: "#ea580c",
    description: "SNS・デジタル集客・コンテンツ戦略の視点",
    isFacilitator: false,
  },
  {
    id: "recruiter",
    name: "採用AI",
    icon: "🤝",
    color: "#0891b2",
    description: "採用・定着・スタッフ育成・組織づくりの視点",
    isFacilitator: false,
  },
  {
    id: "facilitator",
    name: "ファシリテーターAI",
    icon: "🎯",
    color: "#4f46e5",
    description: "全員の意見を整理し、最終結論をまとめる",
    isFacilitator: true,
  },
];

/** ID から役割を取得 */
export function getRoleById(id) {
  return MEETING_ROLES.find((r) => r.id === id) ?? null;
}

/** 議論に参加する役割（ファシリテーター除く） */
export function getDiscussionRoles(selectedIds) {
  return selectedIds
    .map(getRoleById)
    .filter((r) => r && !r.isFacilitator);
}

/** ファシリテーター役割 */
export function getFacilitatorRole() {
  return MEETING_ROLES.find((r) => r.isFacilitator) ?? null;
}
