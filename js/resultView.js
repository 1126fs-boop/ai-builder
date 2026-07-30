/**
 * AI Builder v0.3 — 結果画面
 */

import { getCategory } from "../categories.js";
import { buildPrompt, generateTitle, getQualityCheck, formatStars } from "../promptBuilder.js";
import {
  savePrompt,
  getSavedPrompt,
  toggleFavorite,
  isFavorite,
  addRecentCategory,
} from "./storage.js";
import { state } from "./state.js";
import { DOM, showView, showToast, copyToClipboard } from "./ui.js";
import { startCategory } from "./questionView.js";

/** @type {() => void} */
let onGoHome = () => {};

/** 現在表示中の保存 ID */
let currentSavedId = null;

/**
 * コールバックを登録
 * @param {{ onGoHome: () => void }} handlers
 */
export function initResultView(handlers) {
  onGoHome = handlers.onGoHome;
}

/** 回答から結果を生成して表示 */
export function showGeneratedResult() {
  const category = getCategory(state.categoryId);
  const prompt = buildPrompt(state.categoryId, state.answers);
  const quality = getQualityCheck(state.categoryId);
  const title = generateTitle(category.label, state.answers);

  const saved = savePrompt({
    title,
    category: state.categoryId,
    categoryLabel: category.label,
    prompt,
  });

  currentSavedId = saved.id;
  state.savedPromptId = saved.id;
  addRecentCategory(state.categoryId);

  renderResult(category.label, category.icon, prompt, quality, saved.id);
  showView("result");
}

/**
 * 保存済みプロンプトを開く
 * @param {string} savedId
 */
export function openSavedResult(savedId) {
  const item = getSavedPrompt(savedId);
  if (!item) return;

  const category = getCategory(item.category);
  currentSavedId = item.id;
  state.savedPromptId = item.id;
  state.categoryId = item.category;

  renderResult(
    item.categoryLabel,
    category?.icon || "📄",
    item.prompt,
    getQualityCheck(item.category),
    item.id
  );
  showView("result");
}

/**
 * 結果画面を描画
 * @param {string} label
 * @param {string} icon
 * @param {string} prompt
 * @param {{ score: number, stars: number, missing: string[] }} quality
 * @param {string} savedId
 */
function renderResult(label, icon, prompt, quality, savedId) {
  DOM.resultCategoryLabel.textContent = `${icon} ${label}`;
  DOM.promptOutput.textContent = prompt;

  DOM.qualityStars.textContent = formatStars(quality.stars);
  DOM.qualityScore.textContent = `${quality.score}点`;

  DOM.qualityMissingList.innerHTML = "";
  quality.missing.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    DOM.qualityMissingList.appendChild(li);
  });

  updateFavoriteButton(savedId);

  DOM.btnCopy.classList.remove("btn--copied");
  DOM.btnCopyLabel.textContent = "コピー";
}

/** お気に入りボタンの状態更新 */
function updateFavoriteButton(savedId) {
  const fav = isFavorite(savedId);
  DOM.btnFavorite.textContent = fav ? "★ お気に入り済み" : "☆ お気に入りに追加";
  DOM.btnFavorite.classList.toggle("btn--favorited", fav);
}

/** コピー */
export async function copyPrompt() {
  await copyToClipboard(DOM.promptOutput.textContent);
  DOM.btnCopy.classList.add("btn--copied");
  DOM.btnCopyLabel.textContent = "コピーしました！";
  showToast("クリップボードにコピーしました");
}

/** お気に入りトグル */
export function handleFavoriteToggle() {
  if (!currentSavedId) return;
  const nowFav = toggleFavorite(currentSavedId);
  updateFavoriteButton(currentSavedId);
  showToast(nowFav ? "お気に入りに追加しました" : "お気に入りを解除しました");
}

/** 同カテゴリを最初から */
export function restartCategory() {
  if (state.categoryId) startCategory(state.categoryId);
}

/** ホームへ */
export function goHomeFromResult() {
  onGoHome();
}
