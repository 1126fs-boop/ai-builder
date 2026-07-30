/**
 * AI Builder v1.0 — 結果画面（保存・品質診断・AI評価）
 */

import { getCategory } from "../categories.js";
import { buildPrompt, generateTitle, evaluatePrompt, formatStars } from "../promptBuilder.js";
import {
  saveAI,
  getAI,
  toggleFavorite,
  isFavorite,
  addRecentAI,
  deleteAI,
} from "./storage.js";
import { state } from "./state.js";
import { DOM, showView, showToast, copyToClipboard, showGenerating, esc } from "./ui.js";
import { startCategory } from "./questionView.js";

let onGoHome = () => {};
let currentSavedId = null;

export function initResultView(handlers) {
  onGoHome = handlers.onGoHome;
}

/** 回答から結果を生成 */
export async function showGeneratedResult() {
  showView("result");
  showGenerating(true);

  // 生成アニメーション（UX: 品質計算の体感）
  await delay(800);

  const category = getCategory(state.categoryId);
  const quality = evaluatePrompt(state.categoryId, state.answers);
  const prompt = buildPrompt(state.categoryId, state.answers);
  const title = generateTitle(category.label, state.answers);

  const saved = await saveAI({
    title,
    category: state.categoryId,
    categoryLabel: category.label,
    prompt,
    answers: { ...state.answers },
    quality,
  });

  currentSavedId = saved.id;
  state.savedPromptId = saved.id;
  addRecentAI(saved.id);

  renderResult(saved);
  showGenerating(false);
}

/** 共通テンプレートから結果画面を開く */
export function openTemplateResult(template) {
  const category = getCategory(template.category);
  const quality = evaluatePrompt(template.category, {});

  const item = {
    id: null,
    title: template.name,
    category: template.category,
    categoryLabel: category?.label || template.category,
    prompt: template.prompt_body,
    answers: {},
    quality,
    datetime: new Date().toISOString(),
  };

  currentSavedId = null;
  state.savedPromptId = null;
  state.categoryId = template.category;

  renderResult(item);
  showView("result");
}

/** ライブラリから開く */
export function openSavedResult(savedId) {
  const item = getAI(savedId);
  if (!item) return;

  currentSavedId = item.id;
  state.savedPromptId = item.id;
  state.categoryId = item.category;

  renderResult(item);
  showView("result");
}

/** 結果画面描画 */
function renderResult(item) {
  const quality = item.quality || evaluatePrompt(item.category, item.answers || {});

  DOM.resultGrade.textContent = quality.grade;
  DOM.resultGrade.className = `result-header__grade result-header__grade--${quality.grade.toLowerCase()}`;
  DOM.resultTitle.textContent = item.title;
  DOM.resultCategoryLabel.textContent = `${getCategory(item.category)?.icon || "📄"} ${item.categoryLabel}`;
  DOM.promptOutput.textContent = item.prompt;
  DOM.recommendedAi.textContent = quality.recommendedAi;

  DOM.qualityStars.textContent = formatStars(quality.score);
  DOM.qualityScore.textContent = quality.score;
  DOM.qualityGradeLabel.textContent = quality.gradeLabel;

  renderDimensions(quality.dimensions);
  renderList(DOM.qualityStrengthsList, quality.strengths, "quality-strengths-list");
  renderList(DOM.qualityMissingList, quality.missing, "quality-missing-list");
  DOM.qualityRecommendation.textContent = quality.recommendation;

  updateFavoriteButton(item.id);
  DOM.btnCopy.classList.remove("btn--copied");
  DOM.btnCopyLabel.textContent = "プロンプトをコピー";
}

function renderDimensions(dimensions) {
  DOM.dimensionsContainer.innerHTML = "";
  dimensions.forEach((d) => {
    const el = document.createElement("div");
    el.className = "dimension";
    el.innerHTML = `
      <div class="dimension__header">
        <span class="dimension__label">${esc(d.label)}</span>
        <span class="dimension__value">${d.score}</span>
      </div>
      <div class="dimension__bar">
        <div class="dimension__fill" style="width:0%" data-target="${d.score}"></div>
      </div>
    `;
    DOM.dimensionsContainer.appendChild(el);
  });

  requestAnimationFrame(() => {
    DOM.dimensionsContainer.querySelectorAll(".dimension__fill").forEach((bar) => {
      bar.style.width = `${bar.dataset.target}%`;
    });
  });
}

function renderList(container, items, className) {
  container.innerHTML = "";
  if (items.length === 0) {
    container.innerHTML = `<li class="${className}__empty">—</li>`;
    return;
  }
  items.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    container.appendChild(li);
  });
}

function updateFavoriteButton(savedId) {
  if (!savedId) {
    DOM.btnFavorite.hidden = true;
    return;
  }
  DOM.btnFavorite.hidden = false;
  const fav = isFavorite(savedId);
  DOM.btnFavorite.textContent = fav ? "★ お気に入り済み" : "☆ お気に入りに追加";
  DOM.btnFavorite.classList.toggle("btn--favorited", fav);
}

export async function copyPrompt() {
  await copyToClipboard(DOM.promptOutput.textContent);
  DOM.btnCopy.classList.add("btn--copied");
  DOM.btnCopyLabel.textContent = "コピーしました！";
  showToast("クリップボードにコピーしました");
}

export async function handleFavoriteToggle() {
  if (!currentSavedId) return;
  const nowFav = await toggleFavorite(currentSavedId);
  updateFavoriteButton(currentSavedId);
  showToast(nowFav ? "お気に入りに追加しました" : "お気に入りを解除しました");
}

export function restartCategory() {
  if (state.categoryId) startCategory(state.categoryId);
}

export function goHomeFromResult() {
  onGoHome();
}

/** 長押し削除用（ライブラリから） */
export function removeCurrentAI() {
  if (currentSavedId) deleteAI(currentSavedId);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
