/**
 * AI Builder v1.0 — LocalStorage 管理（AI保存 & ライブラリ）
 */

const KEYS = {
  SAVED: "aibuilder_v1_saved",
  FAVORITES: "aibuilder_v1_favorites",
  RECENT: "aibuilder_v1_recent",
};

const LEGACY = {
  SAVED: "aibuilder_v3_saved",
  FAVORITES: "aibuilder_v3_favorites",
  RECENT: "aibuilder_v3_recent",
};

const MAX_RECENT = 10;
const MAX_SAVED = 100;

/**
 * @typedef {Object} SavedAI
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string} categoryLabel
 * @property {string} datetime
 * @property {string} prompt
 * @property {Object<string,string>} answers
 * @property {import("../qualityEngine.js").QualityReport|null} quality
 * @property {string} version
 */

/* ── 内部 ── */

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** v3 → v1 マイグレーション */
export function migrateStorage() {
  const current = read(KEYS.SAVED, null);
  if (current && current.length > 0) return;

  const legacy = read(LEGACY.SAVED, []);
  if (legacy.length === 0) return;

  const migrated = legacy.map((item) => ({
    ...item,
    answers: item.answers || {},
    quality: item.quality || null,
    version: "1.0",
  }));

  write(KEYS.SAVED, migrated);

  const legacyFav = read(LEGACY.FAVORITES, []);
  if (legacyFav.length) write(KEYS.FAVORITES, legacyFav);

  const legacyRecent = read(LEGACY.RECENT, []);
  if (legacyRecent.length) write(KEYS.RECENT, legacyRecent);
}

/* ── AI 保存 ── */

/**
 * AI（プロンプト）を保存
 * @param {Object} data
 * @returns {SavedAI}
 */
export function saveAI(data) {
  const items = read(KEYS.SAVED, []);
  const item = {
    id: generateId(),
    title: data.title,
    category: data.category,
    categoryLabel: data.categoryLabel,
    datetime: new Date().toISOString(),
    prompt: data.prompt,
    answers: data.answers || {},
    quality: data.quality || null,
    version: "1.0",
  };
  items.unshift(item);
  write(KEYS.SAVED, items.slice(0, MAX_SAVED));
  return item;
}

/** @returns {SavedAI[]} */
export function getAllAI() {
  return read(KEYS.SAVED, []);
}

/** @param {string} id @returns {SavedAI|undefined} */
export function getAI(id) {
  return getAllAI().find((p) => p.id === id);
}

/** @param {string} id */
export function deleteAI(id) {
  write(KEYS.SAVED, getAllAI().filter((p) => p.id !== id));
  removeFavorite(id);
  removeRecentAI(id);
}

/** @param {string} id @param {string} title */
export function updateAITitle(id, title) {
  const items = getAllAI().map((p) => (p.id === id ? { ...p, title } : p));
  write(KEYS.SAVED, items);
}

/** @param {string} query @param {"all"|"favorites"} [filter] */
export function searchAI(query, filter = "all") {
  let items = filter === "favorites" ? getFavoriteAI() : getAllAI();
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q)
  );
}

/* ── お気に入り ── */

function getFavoriteIds() {
  return read(KEYS.FAVORITES, []);
}

/** @returns {SavedAI[]} */
export function getFavoriteAI() {
  const ids = new Set(getFavoriteIds());
  return getAllAI().filter((p) => ids.has(p.id));
}

/** @param {string} id @returns {boolean} */
export function toggleFavorite(id) {
  const favs = getFavoriteIds();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
    write(KEYS.FAVORITES, favs);
    return false;
  }
  favs.unshift(id);
  write(KEYS.FAVORITES, favs);
  return true;
}

/** @param {string} id */
export function isFavorite(id) {
  return getFavoriteIds().includes(id);
}

function removeFavorite(id) {
  write(KEYS.FAVORITES, getFavoriteIds().filter((f) => f !== id));
}

/* ── 最近使った AI ── */

/** @param {string} aiId */
export function addRecentAI(aiId) {
  let recent = read(KEYS.RECENT, []);
  recent = recent.filter((id) => id !== aiId);
  recent.unshift(aiId);
  write(KEYS.RECENT, recent.slice(0, MAX_RECENT));
}

function removeRecentAI(id) {
  write(KEYS.RECENT, read(KEYS.RECENT, []).filter((r) => r !== id));
}

/** @returns {SavedAI[]} */
export function getRecentAI() {
  const ids = read(KEYS.RECENT, []);
  const map = new Map(getAllAI().map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

/** カテゴリ使用記録（ウィザード用） */
export function addRecentCategory(categoryId) {
  let cats = read("aibuilder_v1_recent_cat", []);
  cats = cats.filter((c) => c !== categoryId);
  cats.unshift(categoryId);
  write("aibuilder_v1_recent_cat", cats.slice(0, 8));
}

/** @returns {string[]} */
export function getRecentCategoryIds() {
  return read("aibuilder_v1_recent_cat", []);
}

/** ライブラリ統計 */
export function getLibraryStats() {
  const all = getAllAI();
  return {
    total: all.length,
    favorites: getFavoriteAI().length,
    categories: new Set(all.map((p) => p.category)).size,
  };
}

/** @param {string} iso */
export function formatDate(iso) {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d) / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}時間前`;
  if (diffMin < 10080) return `${Math.floor(diffMin / 1440)}日前`;
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

/* ── 後方互換エイリアス ── */
export const savePrompt = saveAI;
export const getSavedPrompts = getAllAI;
export const getSavedPrompt = getAI;
export const deleteSavedPrompt = deleteAI;
export const searchSavedPrompts = searchAI;
export const getFavoritePrompts = getFavoriteAI;
