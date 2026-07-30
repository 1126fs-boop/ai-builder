/**
 * AI Builder v2.0 — 保存管理（Supabase + LocalStorage フォールバック）
 */

import { getSupabase, isCloudEnabled, getCurrentUser } from "./supabaseClient.js";
import { withTimeout } from "./asyncUtils.js";

const LOG = "[storage]";
const CLOUD_TIMEOUT_MS = 12000;

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

/** @type {import("../qualityEngine.js").SavedAI[]} */
let _cache = [];
let _cloud = false;
let _ready = false;

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
 * @property {boolean} [isFavorite]
 */

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

function rowToItem(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryLabel: row.category_label || "",
    datetime: row.created_at,
    prompt: row.prompt,
    answers: row.answers || {},
    quality: row.quality || null,
    version: row.version || "2.0",
    isFavorite: Boolean(row.is_favorite),
  };
}

function itemToRow(item, userId) {
  return {
    id: item.id.startsWith("ai_") ? undefined : item.id,
    user_id: userId,
    title: item.title,
    category: item.category,
    category_label: item.categoryLabel,
    prompt: item.prompt,
    answers: item.answers || {},
    quality: item.quality,
    is_favorite: Boolean(item.isFavorite),
    version: item.version || "2.0",
  };
}

/** v3 → v1 マイグレーション（LocalStorage） */
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

/** クラウド or ローカルからデータを読み込む */
export async function initStorage() {
  if (_ready) return;
  migrateStorage();

  _cloud = await isCloudEnabled();
  if (!_cloud) {
    _cache = read(KEYS.SAVED, []).map((item) => ({
      ...item,
      isFavorite: read(KEYS.FAVORITES, []).includes(item.id),
    }));
    _ready = true;
    return;
  }

  const sb = await getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) {
    _cache = [];
    _ready = true;
    return;
  }

  const { data, error } = await sb
    .from("saved_ais")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_SAVED);

  if (error) {
    console.warn("saved_ais load failed:", error.message);
    _cache = [];
    _ready = true;
    return;
  }

  _cache = (data || []).map(rowToItem);

  const localItems = read(KEYS.SAVED, []);
  if (localItems.length > 0 && _cache.length === 0) {
    await migrateLocalToCloud(localItems, user.id);
  }

  _ready = true;
}

async function migrateLocalToCloud(localItems, userId) {
  const sb = await getSupabase();
  if (!sb) return;

  const favIds = new Set(read(KEYS.FAVORITES, []));
  for (const item of localItems.slice(0, MAX_SAVED)) {
    const row = {
      user_id: userId,
      title: item.title,
      category: item.category,
      category_label: item.categoryLabel || "",
      prompt: item.prompt,
      answers: item.answers || {},
      quality: item.quality,
      is_favorite: favIds.has(item.id),
      version: "2.0",
    };
    const { data } = await sb.from("saved_ais").insert(row).select().single();
    if (data) _cache.unshift(rowToItem(data));
  }

  localStorage.removeItem(KEYS.SAVED);
  localStorage.removeItem(KEYS.FAVORITES);
}

export function isCloudMode() {
  return _cloud;
}

/* ── AI 保存 ── */

/**
 * @param {Object} data
 * @returns {Promise<SavedAI>}
 */
export async function saveAI(data) {
  const item = {
    id: generateId(),
    title: data.title,
    category: data.category,
    categoryLabel: data.categoryLabel,
    datetime: new Date().toISOString(),
    prompt: data.prompt,
    answers: data.answers || {},
    quality: data.quality || null,
    version: _cloud ? "2.0" : "1.0",
    isFavorite: false,
  };

  if (_cloud) {
    try {
      console.log(`${LOG} saveAI: cloud save start`, { title: item.title, category: item.category });

      const sb = await withTimeout(getSupabase(), CLOUD_TIMEOUT_MS, "Supabase 接続");
      const user = await withTimeout(getCurrentUser(), CLOUD_TIMEOUT_MS, "ユーザー認証");

      if (sb && user) {
        console.log(`${LOG} saveAI: sending insert request`, { userId: user.id });

        const { data: row, error } = await withTimeout(
          sb
            .from("saved_ais")
            .insert({
              user_id: user.id,
              title: item.title,
              category: item.category,
              category_label: item.categoryLabel,
              prompt: item.prompt,
              answers: item.answers,
              quality: item.quality,
              version: item.version,
            })
            .select()
            .single(),
          CLOUD_TIMEOUT_MS,
          "saved_ais 保存"
        );

        if (error) {
          console.error(`${LOG} saveAI: insert error`, error);
          throw error;
        }

        if (row) {
          const saved = rowToItem(row);
          _cache.unshift(saved);
          console.log(`${LOG} saveAI: cloud save success`, { id: saved.id });
          return saved;
        }
      } else {
        console.warn(`${LOG} saveAI: Supabase client or user unavailable, using local fallback`);
      }
    } catch (err) {
      console.error(`${LOG} saveAI: cloud save failed, using local fallback`, err);
    }
  }

  _cache.unshift(item);
  _cache = _cache.slice(0, MAX_SAVED);
  write(
    KEYS.SAVED,
    _cache.map(({ isFavorite, ...rest }) => rest)
  );
  console.log(`${LOG} saveAI: local save success`, { id: item.id });
  return item;
}

/** @returns {SavedAI[]} */
export function getAllAI() {
  return _cache;
}

/** @param {string} id @returns {SavedAI|undefined} */
export function getAI(id) {
  return _cache.find((p) => p.id === id);
}

/** @param {string} id */
export async function deleteAI(id) {
  if (_cloud) {
    const sb = await getSupabase();
    if (sb) await sb.from("saved_ais").delete().eq("id", id);
  }

  _cache = _cache.filter((p) => p.id !== id);
  if (!_cloud) {
    write(
      KEYS.SAVED,
      _cache.map(({ isFavorite, ...rest }) => rest)
    );
    removeFavoriteLocal(id);
  }
  removeRecentAI(id);
}

/** @param {string} id @param {string} title */
export async function updateAITitle(id, title) {
  _cache = _cache.map((p) => (p.id === id ? { ...p, title } : p));

  if (_cloud) {
    const sb = await getSupabase();
    if (sb) await sb.from("saved_ais").update({ title }).eq("id", id);
  } else {
    write(
      KEYS.SAVED,
      _cache.map(({ isFavorite, ...rest }) => rest)
    );
  }
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

function getFavoriteIdsLocal() {
  return read(KEYS.FAVORITES, []);
}

/** @returns {SavedAI[]} */
export function getFavoriteAI() {
  return getAllAI().filter((p) => p.isFavorite || (!_cloud && getFavoriteIdsLocal().includes(p.id)));
}

/** @param {string} id @returns {boolean} */
export function isFavorite(id) {
  const item = getAI(id);
  if (item) return Boolean(item.isFavorite);
  return !_cloud && getFavoriteIdsLocal().includes(id);
}

/** @param {string} id @returns {Promise<boolean>} */
export async function toggleFavorite(id) {
  const item = getAI(id);
  if (!item) return false;

  const nowFav = !isFavorite(id);
  item.isFavorite = nowFav;

  if (_cloud) {
    const sb = await getSupabase();
    if (sb) await sb.from("saved_ais").update({ is_favorite: nowFav }).eq("id", id);
  } else {
    let favs = getFavoriteIdsLocal();
    if (nowFav) favs.unshift(id);
    else favs = favs.filter((f) => f !== id);
    write(KEYS.FAVORITES, favs);
  }

  return nowFav;
}

function removeFavoriteLocal(id) {
  write(KEYS.FAVORITES, getFavoriteIdsLocal().filter((f) => f !== id));
}

/* ── 最近使った AI ── */

export function addRecentAI(aiId) {
  let recent = read(KEYS.RECENT, []);
  recent = recent.filter((id) => id !== aiId);
  recent.unshift(aiId);
  write(KEYS.RECENT, recent.slice(0, MAX_RECENT));
}

function removeRecentAI(id) {
  write(
    KEYS.RECENT,
    read(KEYS.RECENT, []).filter((r) => r !== id)
  );
}

/** @returns {SavedAI[]} */
export function getRecentAI() {
  const ids = read(KEYS.RECENT, []);
  const map = new Map(getAllAI().map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

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

export const savePrompt = saveAI;
export const getSavedPrompts = getAllAI;
export const getSavedPrompt = getAI;
export const deleteSavedPrompt = deleteAI;
export const searchSavedPrompts = searchAI;
export const getFavoritePrompts = getFavoriteAI;
