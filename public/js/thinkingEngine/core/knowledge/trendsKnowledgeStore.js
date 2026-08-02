/**
 * トレンド Knowledge — 継続更新可能なKBレイヤー
 *
 * 静的JSON + localStorage上書き + 手動登録をマージ。
 * 将来: Supabase / 管理画面 / 定期fetch。
 */

const TRENDS_STORAGE_KEY = "aibuilder_v1_trends_overrides";
const TRENDS_JSON_URL = "/data/knowledge-trends.json";
const FETCH_TTL_MS = 1000 * 60 * 60 * 6; // 6時間

/** @type {{ loadedAt: number, data: Object|null }} */
let cache = { loadedAt: 0, data: null };

function loadOverrides() {
  try {
    const raw = localStorage.getItem(TRENDS_STORAGE_KEY);
    if (!raw) return { entries: [], byCategory: {} };
    return JSON.parse(raw);
  } catch {
    return { entries: [], byCategory: {} };
  }
}

function saveOverrides(data) {
  try {
    localStorage.setItem(TRENDS_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[trendsKnowledgeStore] save failed", err);
  }
}

/**
 * トレンドJSONを取得（キャッシュ + 定期更新）
 * @param {{ force?: boolean }} [options]
 */
export async function fetchTrendsKnowledge(options = {}) {
  const now = Date.now();
  if (!options.force && cache.data && now - cache.loadedAt < FETCH_TTL_MS) {
    return mergeTrendsSources(cache.data, loadOverrides());
  }

  try {
    const res = await fetch(TRENDS_JSON_URL, { cache: "no-cache" });
    if (res.ok) {
      cache.data = await res.json();
      cache.loadedAt = now;
    }
  } catch (err) {
    console.warn("[trendsKnowledgeStore] fetch failed", err);
  }

  return mergeTrendsSources(cache.data ?? { global: [], byCategory: {} }, loadOverrides());
}

function mergeTrendsSources(base, overrides) {
  const byCategory = { ...(base.byCategory ?? {}) };
  for (const [cat, items] of Object.entries(overrides.byCategory ?? {})) {
    byCategory[cat] = [...(items ?? []), ...(byCategory[cat] ?? [])];
  }
  return {
    version: base.version ?? "unknown",
    updatedAt: base.updatedAt ?? null,
    global: [...(overrides.entries ?? []), ...(base.global ?? [])],
    byCategory,
  };
}

/**
 * カテゴリ別トレンドを取得（同期 — キャッシュ済みのみ）
 * @param {string} categoryId
 */
export function getTrendsForCategorySync(categoryId) {
  const merged = mergeTrendsSources(cache.data ?? { global: [], byCategory: {} }, loadOverrides());
  const global = (merged.global ?? []).filter(
    (t) => !t.tags?.length || t.tags.includes(categoryId) || t.tags.includes("beauty")
  );
  const category = merged.byCategory?.[categoryId] ?? [];
  return [...category, ...global].slice(0, 12);
}

/**
 * トレンドを手動登録
 * @param {string} categoryId
 * @param {{ text: string, topic?: string, priority?: number }} entry
 */
export function registerTrendUpdate(categoryId, entry) {
  const overrides = loadOverrides();
  if (!overrides.byCategory[categoryId]) overrides.byCategory[categoryId] = [];
  overrides.byCategory[categoryId].unshift({
    id: `local_${Date.now()}`,
    text: entry.text,
    topic: entry.topic ?? "manual",
    priority: entry.priority ?? 70,
    createdAt: new Date().toISOString(),
  });
  overrides.byCategory[categoryId] = overrides.byCategory[categoryId].slice(0, 50);
  saveOverrides(overrides);
}

/**
 * Prompt 用ブロック
 * @param {string} categoryId
 */
export function buildTrendsKnowledgeBlock(categoryId) {
  const trends = getTrendsForCategorySync(categoryId);
  if (!trends.length) return "";

  const lines = ["【トレンド・最新ナレッジ（継続更新）】"];
  trends.forEach((t) => {
    const prefix = t.topic ? `[${t.topic}] ` : "";
    lines.push(`- ${prefix}${t.text}`);
  });
  if (cache.data?.updatedAt) {
    lines.push("", `（KB更新: ${cache.data.updatedAt.slice(0, 10)}）`);
  }
  return lines.join("\n");
}

/** アプリ起動時にバックグラウンドでトレンドを取得 */
export function initTrendsKnowledge() {
  fetchTrendsKnowledge().catch(() => {});
}

/**
 * 業界インサイトをトレンドKBにも反映
 * @param {string} categoryId
 * @param {string} text
 */
export function ingestIndustryInsightAsTrend(categoryId, text) {
  registerTrendUpdate(categoryId, { text, topic: "学習", priority: 75 });
}
