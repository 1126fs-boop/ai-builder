/**
 * AI Builder v0.3 — ホーム画面
 */

import { getAllCategories, getPopularCategories, getCategory, searchCategories } from "../categories.js";
import { getRecentCategoryIds, getFavoritePrompts, getSavedPrompt, searchSavedPrompts, formatDate, isFavorite } from "./storage.js";
import { state } from "./state.js";
import { DOM, renderEmpty } from "./ui.js";

/** @type {(categoryId: string) => void} */
let onStartCategory = () => {};

/** @type {(savedId: string) => void} */
let onOpenSaved = () => {};

/**
 * コールバックを登録
 * @param {{ onStartCategory: (id: string) => void, onOpenSaved: (id: string) => void }} handlers
 */
export function initHomeView(handlers) {
  onStartCategory = handlers.onStartCategory;
  onOpenSaved = handlers.onOpenSaved;
}

/** ホーム画面を再描画 */
export function renderHome() {
  const query = state.searchQuery;
  renderRecent(query);
  renderPopular(query);
  renderFavorites(query);
  renderAllCategories(query);
}

/**
 * カテゴリカード DOM を生成
 * @param {import("../categories.js").CategoryMeta} category
 * @param {number} [delay]
 */
function createCategoryCard(category, delay = 0) {
  const card = document.createElement("button");
  card.className = "category-card";
  card.style.animationDelay = `${delay * 0.05}s`;
  card.dataset.categoryId = category.id;
  card.innerHTML = `
    <span class="category-card__icon" aria-hidden="true">${category.icon}</span>
    <span class="category-card__label">${category.label}</span>
    <span class="category-card__desc">${category.description}</span>
  `;
  card.addEventListener("click", () => onStartCategory(category.id));
  return card;
}

/** 最近使ったAI */
function renderRecent(query) {
  const recentIds = getRecentCategoryIds();
  DOM.recentList.innerHTML = "";

  if (recentIds.length === 0) {
    renderEmpty(DOM.recentList, "まだ履歴がありません");
    return;
  }

  const filtered = recentIds
    .map((id) => getCategory(id))
    .filter(Boolean)
    .filter((c) => !query || c.label.toLowerCase().includes(query.toLowerCase()));

  if (filtered.length === 0) {
    renderEmpty(DOM.recentList, "該当する履歴がありません");
    return;
  }

  filtered.forEach((category) => {
    const item = document.createElement("button");
    item.className = "list-item";
    item.innerHTML = `
      <span class="list-item__icon">${category.icon}</span>
      <span class="list-item__body">
        <span class="list-item__title">${category.label}</span>
        <span class="list-item__desc">${category.description}</span>
      </span>
      <span class="list-item__arrow">›</span>
    `;
    item.addEventListener("click", () => onStartCategory(category.id));
    DOM.recentList.appendChild(item);
  });
}

/** 人気カテゴリ */
function renderPopular(query) {
  DOM.popularGrid.innerHTML = "";
  const categories = query
    ? searchCategories(query).filter((c) => c.popular)
    : getPopularCategories();

  if (categories.length === 0) {
    renderEmpty(DOM.popularGrid, "該当するカテゴリがありません");
    return;
  }

  categories.forEach((cat, i) => {
    DOM.popularGrid.appendChild(createCategoryCard(cat, i));
  });
}

/** お気に入り */
function renderFavorites(query) {
  DOM.favoritesList.innerHTML = "";
  let favorites = getFavoritePrompts();

  if (query) {
    favorites = searchSavedPrompts(query).filter((p) => isFavorite(p.id));
  }

  if (favorites.length === 0) {
    renderEmpty(DOM.favoritesList, "お気に入りはまだありません");
    return;
  }

  favorites.forEach((item) => {
    DOM.favoritesList.appendChild(createSavedItem(item));
  });
}

/** 全カテゴリ */
function renderAllCategories(query) {
  DOM.allCategoriesGrid.innerHTML = "";
  const categories = query ? searchCategories(query) : getAllCategories();

  if (categories.length === 0) {
    renderEmpty(DOM.allCategoriesGrid, "該当するカテゴリがありません");
    return;
  }

  categories.forEach((cat, i) => {
    DOM.allCategoriesGrid.appendChild(createCategoryCard(cat, i));
  });
}

/**
 * 保存済みプロンプトのリストアイテム
 * @param {import("./storage.js").SavedPrompt} item
 */
function createSavedItem(item) {
  const el = document.createElement("button");
  el.className = "list-item";
  el.innerHTML = `
    <span class="list-item__icon">${getCategory(item.category)?.icon || "📄"}</span>
    <span class="list-item__body">
      <span class="list-item__title">${item.title}</span>
      <span class="list-item__desc">${item.categoryLabel} · ${formatDate(item.datetime)}</span>
    </span>
    <span class="list-item__arrow">›</span>
  `;
  el.addEventListener("click", () => onOpenSaved(item.id));
  return el;
}

/** 検索入力ハンドラ */
export function handleSearchInput(value) {
  state.searchQuery = value;
  renderHome();
}

/** 「＋ 新しいAIを作る」→ 全カテゴリへスクロール */
export function scrollToCategories() {
  document.getElementById("section-all-categories")?.scrollIntoView({ behavior: "smooth" });
}
