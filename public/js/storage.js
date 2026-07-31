/**
 * AI Builder v2.0 — 保存管理（Supabase + LocalStorage フォールバック）
 */

import { getSupabase, isCloudEnabled, getCurrentUser, SAVED_EMAIL_KEY } from "./supabaseClient.js";
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

/** @type {string[]} */
let _recentIds = [];
/** @type {string[]} */
let _recentCategoryIds = [];
/** @type {Record<string, unknown>} */
let _settings = {};

/** ユーザーごとに localStorage キーを分離 */
function storageKey(base) {
  const email = localStorage.getItem(SAVED_EMAIL_KEY);
  if (!email) return base;
  const suffix = email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `${base}_${suffix}`;
}

/** @type {import("../qualityEngine.js").SavedAI[]} */
let _cache = [];
let _cloud = false;
let _ready = false;
/** @type {import("@supabase/supabase-js").SupabaseClient|null} */
let _sessionSb = null;
/** @type {import("@supabase/supabase-js").User|null} */
let _sessionUser = null;
let _recentPersistTimer = null;

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
    const raw = localStorage.getItem(storageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(storageKey(key), JSON.stringify(value));
}

async function loadUserPreferences(userId) {
  const sb = await getSupabase();
  if (!sb) return;

  const { data } = await sb
    .from("user_preferences")
    .select("recent_ai_ids, recent_category_ids, settings")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    _recentIds = Array.isArray(data.recent_ai_ids) ? data.recent_ai_ids : [];
    _recentCategoryIds = Array.isArray(data.recent_category_ids) ? data.recent_category_ids : [];
    _settings = data.settings && typeof data.settings === "object" ? data.settings : {};
    return;
  }

  // 初回: 端末のローカルデータを引き継ぐ
  _recentIds = read(KEYS.RECENT, []);
  _recentCategoryIds = read("aibuilder_v1_recent_cat", []);
  _settings = read("aibuilder_v1_settings", {});

  await persistUserPreferences(userId);
}

async function persistUserPreferences(userId) {
  const sb = await getSupabase();
  if (!sb) return;

  await sb.from("user_preferences").upsert({
    user_id: userId,
    recent_ai_ids: _recentIds,
    recent_category_ids: _recentCategoryIds,
    settings: _settings,
  });
}

/** initStorage で取得済みの Supabase / ユーザーを再利用 */
export async function resolveCloudAuth() {
  if (_sessionSb && _sessionUser) {
    return { sb: _sessionSb, user: _sessionUser };
  }
  const sb = await getSupabase();
  const user = await getCurrentUser();
  if (sb) _sessionSb = sb;
  if (user) _sessionUser = user;
  return { sb, user };
}

function scheduleRecentPersist() {
  if (!_cloud || !_sessionUser) return;
  clearTimeout(_recentPersistTimer);
  _recentPersistTimer = setTimeout(() => {
    persistUserPreferences(_sessionUser.id).catch((err) => {
      console.warn(`${LOG} recent persist failed`, err);
    });
  }, 400);
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
    _recentIds = read(KEYS.RECENT, []);
    _recentCategoryIds = read("aibuilder_v1_recent_cat", []);
    _settings = read("aibuilder_v1_settings", {});
    _ready = true;
    return;
  }

  const sb = await getSupabase();
  const user = await getCurrentUser();
  if (sb) _sessionSb = sb;
  if (user) _sessionUser = user;
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

  await loadUserPreferences(user.id);

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

  _cache.unshift(item);
  _cache = _cache.slice(0, MAX_SAVED);

  if (_cloud) {
    const saveStart = performance.now();
    persistItemToCloud(item)
      .then((saved) => {
        const saveMs = Math.round(performance.now() - saveStart);
        console.log(`${LOG} saveAI: background cloud sync done`, { id: saved.id, saveMs });
      })
      .catch((err) => {
        console.error(`${LOG} saveAI: background cloud save failed`, err);
      });
    return item;
  }

  write(
    KEYS.SAVED,
    _cache.map(({ isFavorite, ...rest }) => rest)
  );
  console.log(`${LOG} saveAI: local save success`, { id: item.id });
  return item;
}

/** @returns {Promise<SavedAI>} */
async function persistItemToCloud(item) {
  const saveStart = performance.now();
  let networkCalls = 0;

  try {
    const { sb, user } = await resolveCloudAuth();
    networkCalls += 1;

    if (sb && user) {
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
      networkCalls += 1;

      if (error) throw error;

      if (row) {
        const saved = rowToItem(row);
        const idx = _cache.findIndex((p) => p.id === item.id);
        if (idx >= 0) _cache[idx] = saved;
        const saveMs = Math.round(performance.now() - saveStart);
        console.log(`${LOG} saveAI: cloud save success`, { id: saved.id, saveMs, networkCalls });
        return saved;
      }
    }
  } catch (err) {
    console.error(`${LOG} saveAI: cloud save failed, keeping local cache`, err);
    write(
      KEYS.SAVED,
      _cache.map(({ isFavorite, ...rest }) => rest)
    );
  }

  return item;
}

/** @deprecated saveAI が非同期クラウド保存に対応済み */
export function saveAIInBackground(data) {
  return saveAI(data);
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

  _recentIds = _recentIds.filter((r) => r !== id);
  if (_cloud) {
    const user = await getCurrentUser();
    if (user) await persistUserPreferences(user.id);
  } else {
    write(KEYS.RECENT, _recentIds);
  }
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
  _recentIds = _recentIds.filter((id) => id !== aiId);
  _recentIds.unshift(aiId);
  _recentIds = _recentIds.slice(0, MAX_RECENT);

  if (_cloud) {
    scheduleRecentPersist();
  } else {
    write(KEYS.RECENT, _recentIds);
  }
}

/** @returns {SavedAI[]} */
export function getRecentAI() {
  const map = new Map(getAllAI().map((p) => [p.id, p]));
  return _recentIds.map((id) => map.get(id)).filter(Boolean);
}

export async function addRecentCategory(categoryId) {
  _recentCategoryIds = _recentCategoryIds.filter((c) => c !== categoryId);
  _recentCategoryIds.unshift(categoryId);
  _recentCategoryIds = _recentCategoryIds.slice(0, 8);

  if (_cloud) {
    const user = await getCurrentUser();
    if (user) await persistUserPreferences(user.id);
  } else {
    write("aibuilder_v1_recent_cat", _recentCategoryIds);
  }
}

/** @returns {string[]} */
export function getRecentCategoryIds() {
  return _recentCategoryIds;
}

/* ── ユーザー設定 ── */

/** @returns {Record<string, unknown>} */
export function getUserSettings() {
  return { ..._settings };
}

/** @param {Record<string, unknown>} partial */
export async function saveUserSettings(partial) {
  _settings = { ..._settings, ...partial };

  if (_cloud) {
    const user = await getCurrentUser();
    if (user) await persistUserPreferences(user.id);
  } else {
    write("aibuilder_v1_settings", _settings);
  }
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
