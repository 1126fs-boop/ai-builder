/**
 * 学習ナレッジ — ローカル永続化
 *
 * 成功事例・修正履歴・高評価プロンプトを localStorage に蓄積。
 * 将来 Supabase へ拡張可能。
 */

const STORAGE_KEY = "aibuilder_v1_learning";
const MAX_RECORDS = 200;

/**
 * @returns {import("./learningRegistry.js").LearningRecord[]}
 */
export function loadLearningRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {import("./learningRegistry.js").LearningRecord[]} records
 */
export function saveLearningRecords(records) {
  try {
    const trimmed = records.slice(0, MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("[learningStorage] save failed", err);
  }
}

export function clearLearningRecords() {
  localStorage.removeItem(STORAGE_KEY);
}

export { MAX_RECORDS };
