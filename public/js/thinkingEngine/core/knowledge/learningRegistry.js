/**
 * 学習型 Knowledge — 将来拡張用レジストリ
 *
 * 美容業界知識・ワム商品知識・成功事例・修正履歴・高評価プロンプトを
 * AnalysisContext / Blueprint へ反映するための基盤。
 */

import { generatePersistableId } from "../types/persistable.js";
import { LEARNED_KNOWLEDGE_ENABLED } from "./knowledgeTypes.js";

/**
 * @typedef {Object} LearningRecord
 * @property {string} id
 * @property {"success_case"|"user_revision"|"high_rated_prompt"|"industry_insight"} type
 * @property {string} categoryId
 * @property {Object} payload
 * @property {number} [score]
 * @property {string} createdAt
 */

/** @type {LearningRecord[]} */
const records = [];

/**
 * 成功事例を登録
 * @param {Object} entry
 */
export function registerSuccessCase(entry) {
  records.push(normalizeRecord("success_case", entry));
}

/**
 * ユーザー修正履歴を登録
 * @param {Object} entry
 */
export function registerUserRevision(entry) {
  records.push(normalizeRecord("user_revision", entry));
}

/**
 * 高評価プロンプトを登録
 * @param {Object} entry
 */
export function registerHighRatedPrompt(entry) {
  records.push(normalizeRecord("high_rated_prompt", entry));
}

/**
 * 美容業界インサイトを登録
 * @param {Object} entry
 */
export function registerIndustryInsight(entry) {
  records.push(normalizeRecord("industry_insight", entry));
}

function normalizeRecord(type, entry) {
  return {
    id: entry.id ?? generatePersistableId("lrn"),
    type,
    categoryId: entry.categoryId ?? "general",
    payload: entry.payload ?? entry,
    score: entry.score ?? null,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
}

/**
 * 分析パイプライン用 — 学習ナレッジをスナップショットに変換
 * @param {string} categoryId
 */
export function getLearnedInsightsForAnalysis(categoryId) {
  if (!LEARNED_KNOWLEDGE_ENABLED) {
    return {
      enabled: false,
      successCases: [],
      highRatedPrompts: [],
      revisions: [],
      industryInsights: [],
      hints: [],
    };
  }

  const relevant = records.filter(
    (r) => r.categoryId === categoryId || r.categoryId === "general"
  );

  const successCases = relevant
    .filter((r) => r.type === "success_case")
    .slice(0, 5)
    .map((r) => r.payload);

  const highRatedPrompts = relevant
    .filter((r) => r.type === "high_rated_prompt" && (r.score ?? 0) >= 0.8)
    .slice(0, 5)
    .map((r) => r.payload);

  const revisions = relevant
    .filter((r) => r.type === "user_revision")
    .slice(0, 3)
    .map((r) => r.payload);

  const industryInsights = relevant
    .filter((r) => r.type === "industry_insight")
    .slice(0, 5)
    .map((r) => r.payload);

  const hints = [];
  if (successCases.length) hints.push("過去の成功事例パターンを Blueprint に反映");
  if (highRatedPrompts.length) hints.push("高評価プロンプトの構成を参考にする");
  if (revisions.length) hints.push("ユーザー修正傾向を品質改善に活用");

  return {
    enabled: true,
    successCases,
    highRatedPrompts,
    revisions,
    industryInsights,
    hints,
  };
}

/** 登録済みレコード一覧（管理・デバッグ用） */
export function listLearningRecords() {
  return [...records];
}
