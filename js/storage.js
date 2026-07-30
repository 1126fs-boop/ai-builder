/**
 * AI Builder v0.3 — LocalStorage 管理
 *
 * 保存項目: タイトル / カテゴリ / 日時 / プロンプト
 * お気に入り・最近使ったAI もここで管理
 */

const KEYS = {
  SAVED: "aibuilder_v3_saved",
  FAVORITES: "aibuilder_v3_favorites",
  RECENT: "aibuilder_v3_recent",
};

const MAX_RECENT = 8;

/** @typedef {{ id: string, title: string, category: string, categoryLabel: string, datetime: string, prompt: string }} SavedPrompt */

/* ── 内部ヘルパー ── */

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
  return `sp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ── 保存プロンプト ── */

/**
 * プロンプトを保存
 * @param {{ title: string, category: string, categoryLabel: string, prompt: string }} data
 * @returns {SavedPrompt}
 */
export function savePrompt(data) {
  const items = read(KEYS.SAVED, []);
  const item = {
    id: generateId(),
    title: data.title,
    category: data.category,
    categoryLabel: data.categoryLabel,
    datetime: new Date().toISOString(),
    prompt: data.prompt,
  };
  items.unshift(item);
  write(KEYS.SAVED, items);
  return item;
}

/** @returns {SavedPrompt[]} */
export function getSavedPrompts() {
  return read(KEYS.SAVED, []);
}

/**
 * ID から保存済みプロンプトを取得
 * @param {string} id
 * @returns {SavedPrompt|undefined}
 */
export function getSavedPrompt(id) {
  return getSavedPrompts().find((p) => p.id === id);
}

/**
 * 保存済みプロンプトを削除
 * @param {string} id
 */
export function deleteSavedPrompt(id) {
  const items = getSavedPrompts().filter((p) => p.id !== id);
  write(KEYS.SAVED, items);
  removeFavorite(id);
}

/**
 * キーワードで保存済みプロンプトを検索
 * @param {string} query
 * @returns {SavedPrompt[]}
 */
export function searchSavedPrompts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return getSavedPrompts();
  return getSavedPrompts().filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q)
  );
}

/* ── お気に入り ── */

/** @returns {string[]} */
export function getFavoriteIds() {
  return read(KEYS.FAVORITES, []);
}

/**
 * お気に入りをトグル
 * @param {string} id
 * @returns {boolean} お気に入り状態
 */
export function toggleFavorite(id) {
  const favs = getFavoriteIds();
  const index = favs.indexOf(id);
  if (index >= 0) {
    favs.splice(index, 1);
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

/** @param {string} id */
function removeFavorite(id) {
  write(KEYS.FAVORITES, getFavoriteIds().filter((f) => f !== id));
}

/**
 * お気に入りの保存済みプロンプトを取得
 * @returns {SavedPrompt[]}
 */
export function getFavoritePrompts() {
  const favIds = new Set(getFavoriteIds());
  return getSavedPrompts().filter((p) => favIds.has(p.id));
}

/* ── 最近使ったAI ── */

/**
 * 最近使ったカテゴリを記録
 * @param {string} categoryId
 */
export function addRecentCategory(categoryId) {
  let recent = read(KEYS.RECENT, []);
  recent = recent.filter((id) => id !== categoryId);
  recent.unshift(categoryId);
  write(KEYS.RECENT, recent.slice(0, MAX_RECENT));
}

/** @returns {string[]} */
export function getRecentCategoryIds() {
  return read(KEYS.RECENT, []);
}

/**
 * 日時を表示用にフォーマット
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}時間前`;
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}
