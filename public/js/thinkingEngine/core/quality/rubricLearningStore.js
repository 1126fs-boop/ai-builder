/**
 * ルーブリック学習 — 永続化（カテゴリ別）
 */

const STORAGE_KEY = "aibuilder_v1_rubric_learning";
const MAX_ADJUSTMENTS_PER_CATEGORY = 30;

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[rubricLearningStore] save failed", err);
  }
}

/** @param {string} categoryId */
export function getRubricAdjustments(categoryId) {
  const all = loadAll();
  return all[categoryId]?.adjustments ?? [];
}

/**
 * @param {string} categoryId
 * @param {string} criterionId
 * @param {{ hint: string, source?: string, boostDelta?: number }} update
 */
export function upsertRubricAdjustment(categoryId, criterionId, update) {
  const all = loadAll();
  if (!all[categoryId]) all[categoryId] = { adjustments: [] };

  const list = all[categoryId].adjustments;
  const idx = list.findIndex((a) => a.criterionId === criterionId);

  if (idx >= 0) {
    list[idx].count += 1;
    list[idx].boost = Math.min(0.25, list[idx].boost + (update.boostDelta ?? 0.02));
    list[idx].hint = update.hint || list[idx].hint;
    list[idx].updatedAt = new Date().toISOString();
  } else {
    list.unshift({
      criterionId,
      boost: update.boostDelta ?? 0.03,
      hint: update.hint,
      count: 1,
      source: update.source ?? "learned",
      updatedAt: new Date().toISOString(),
    });
  }

  all[categoryId].adjustments = list.slice(0, MAX_ADJUSTMENTS_PER_CATEGORY);
  saveAll(all);
}
