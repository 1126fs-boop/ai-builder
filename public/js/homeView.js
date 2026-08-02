/**
 * AI Builder v2.0 — ホーム & AIライブラリ
 */

import { getAllCategories, getPopularCategories, getCategory, searchCategories } from "../categories.js";
import {
  searchAI,
  getLibraryStats,
  isFavorite,
  toggleFavorite,
  deleteAI,
  formatDate,
} from "./storage.js";
import { loadTemplates, renderTemplatesList } from "./templates.js";
import { state } from "./state.js";
import { DOM, renderEmpty, esc } from "./ui.js";

let onStartCategory = () => {};
let onOpenSaved = () => {};
let onOpenTemplate = () => {};

export function initHomeView(handlers) {
  onStartCategory = handlers.onStartCategory;
  onOpenSaved = handlers.onOpenSaved;
  onOpenTemplate = handlers.onOpenTemplate || (() => {});
}

export async function renderHome() {
  renderCategoryGrids();
  try {
    await loadTemplates();
    renderTemplates();
  } catch (err) {
    console.error("[homeView] templates failed", err);
  }
  try {
    renderLibrary();
  } catch (err) {
    console.error("[homeView] library failed", err);
  }
}

/** カテゴリグリッドのみ同期描画（メイン導線 — 最優先） */
export function renderCategoryGrids() {
  try {
    renderAllCategories();
    renderPopular();
  } catch (err) {
    console.error("[homeView] category grids failed", err);
  }
}

function renderTemplates() {
  if (!DOM.templatesList) return;
  renderTemplatesList(DOM.templatesList, (t) => onOpenTemplate(t));
}

/* ── AIライブラリ ── */

function renderLibrary() {
  if (!DOM.libraryList || !DOM.libraryCount) return;
  const query = state.searchQuery;
  const filter = state.libraryFilter;
  const stats = getLibraryStats();

  DOM.libraryCount.textContent = `${stats.total} 件`;

  let items = searchAI(query, filter);

  DOM.libraryList.innerHTML = "";

  if (items.length === 0) {
    const msg = filter === "favorites"
      ? "お気に入りはまだありません"
      : query
        ? "該当する AI がありません"
        : "AI を作成すると、ここに保存されます";
    renderEmpty(DOM.libraryList, msg, "✨");
    return;
  }

  items.forEach((item, i) => {
    DOM.libraryList.appendChild(createLibraryItem(item, i));
  });
}

function createLibraryItem(item, index) {
  const el = document.createElement("div");
  el.className = "library-item";
  el.style.animationDelay = `${index * 0.04}s`;

  const score = item.quality?.score ?? "—";
  const grade = item.quality?.grade ?? "";
  const fav = isFavorite(item.id);

  el.innerHTML = `
    <button class="library-item__main" type="button" data-id="${item.id}">
      <span class="library-item__icon">${getCategory(item.category)?.icon || "📄"}</span>
      <span class="library-item__body">
        <span class="library-item__title">${esc(item.title)}</span>
        <span class="library-item__meta">${esc(item.categoryLabel)} · ${formatDate(item.datetime)}</span>
      </span>
      ${grade ? `<span class="library-item__grade library-item__grade--${grade.toLowerCase()}">${grade}</span>` : ""}
      <span class="library-item__score">${score}${typeof score === "number" ? "点" : ""}</span>
    </button>
    <div class="library-item__actions">
      <button class="library-item__fav${fav ? " library-item__fav--active" : ""}" type="button" data-fav="${item.id}" aria-label="お気に入り">${fav ? "★" : "☆"}</button>
      <button class="library-item__delete" type="button" data-del="${item.id}" aria-label="削除">×</button>
    </div>
  `;

  el.querySelector(".library-item__main").addEventListener("click", () => onOpenSaved(item.id));

  el.querySelector("[data-fav]").addEventListener("click", async (e) => {
    e.stopPropagation();
    await toggleFavorite(item.id);
    renderLibrary();
  });

  el.querySelector("[data-del]").addEventListener("click", async (e) => {
    e.stopPropagation();
    if (confirm(`「${item.title}」を削除しますか？`)) {
      await deleteAI(item.id);
      renderLibrary();
    }
  });

  return el;
}

/* ── フィルタ ── */

export function setLibraryFilter(filter) {
  state.libraryFilter = filter;
  DOM.filterChips.forEach((chip) => {
    chip.classList.toggle("filter-chip--active", chip.dataset.filter === filter);
  });
  renderLibrary();
}

/* ── カテゴリ ── */

function createCategoryCard(category, delay = 0) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "category-card";
  card.dataset.categoryId = category.id;
  card.style.animationDelay = `${delay * 0.05}s`;
  card.innerHTML = `
    <span class="category-card__icon">${category.icon}</span>
    <span class="category-card__label">${category.label}</span>
    <span class="category-card__desc">${category.description}</span>
  `;
  card.addEventListener("click", () => onStartCategory(category.id));
  return card;
}

function renderPopular() {
  if (!DOM.popularGrid) return;
  DOM.popularGrid.innerHTML = "";
  const query = state.searchQuery;
  const categories = query
    ? searchCategories(query).filter((c) => c.popular)
    : getPopularCategories();

  if (categories.length === 0) {
    renderEmpty(DOM.popularGrid, "該当なし");
    return;
  }

  categories.forEach((cat, i) => DOM.popularGrid.appendChild(createCategoryCard(cat, i)));
}

function renderAllCategories() {
  if (!DOM.allCategoriesGrid) {
    console.error("[homeView] #all-categories-grid が見つかりません");
    return;
  }
  DOM.allCategoriesGrid.innerHTML = "";
  const categories = state.searchQuery ? searchCategories(state.searchQuery) : getAllCategories();

  if (categories.length === 0) {
    renderEmpty(DOM.allCategoriesGrid, "該当なし");
    return;
  }

  categories.forEach((cat, i) => DOM.allCategoriesGrid.appendChild(createCategoryCard(cat, i)));
}

export function handleSearchInput(value) {
  state.searchQuery = value;
  renderHome();
}
