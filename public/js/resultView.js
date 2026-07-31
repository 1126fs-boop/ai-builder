/**
 * AI Builder v2.0 — 結果画面（保存・品質診断・AI評価）
 */

import { getCategory } from "../categories.js";
import {
  evaluatePrompt,
  formatStars,
} from "../promptBuilder.js";
import {
  saveAI,
  getAI,
  toggleFavorite,
  isFavorite,
  addRecentAI,
  deleteAI,
} from "./storage.js";
import { state } from "./state.js";
import { DOM, showView, showToast, copyToClipboard, showGenerating, showGeneratingStep } from "./ui.js";
import { startCategory } from "./questionView.js";
import {
  generateWizardPrompt,
  toSavePayload,
  logGenerationSummary,
} from "./ai/promptGenerationPipeline.js";
import { yieldToMain } from "./ai/performanceProfiler.js";

const LOG = "[resultView]";

let onGoHome = () => {};
let currentSavedId = null;

export function initResultView(handlers) {
  onGoHome = handlers.onGoHome;
}

/** 回答から結果を生成 */
export async function showGeneratedResult() {
  console.log(`${LOG} showGeneratedResult: start`);
  showView("result");
  showGenerating(true);
  showGeneratingStep("プロンプト生成を準備中…");

  try {
    await runGeneration();
    console.log(`${LOG} showGeneratedResult: complete`);
  } catch (err) {
    console.error(`${LOG} showGeneratedResult: failed`, err);
    showToast(err instanceof Error ? err.message : "プロンプト生成に失敗しました。");
    onGoHome();
  } finally {
    showGenerating(false);
    showGeneratingStep("");
    console.log(`${LOG} showGeneratedResult: loading dismissed`);
  }
}

/** 会議連携から結果を表示（meetingPromptView から呼ばれる） */
export function showMeetingResult(saved) {
  currentSavedId = saved.id;
  state.savedPromptId = saved.id;
  renderResult(saved);
  showView("result");
}

async function runGeneration() {
  showGeneratingStep("回答内容を整理中…");
  await yieldToMain();

  // 結果画面を先に表示（ストリーミング先）
  currentSavedId = null;
  state.savedPromptId = null;
  DOM.promptOutput.textContent = "";

  let streamedText = "";
  let overlayDismissed = false;

  const genResult = await generateWizardPrompt(state.categoryId, state.answers, {
    onStep: (step) => showGeneratingStep(step),
    onDelta: (text) => {
      if (!overlayDismissed) {
        showGenerating(false);
        overlayDismissed = true;
      }
      streamedText += text;
      DOM.promptOutput.textContent = streamedText;
      DOM.promptOutput.scrollTop = DOM.promptOutput.scrollHeight;
    },
  });

  state.categoryId = genResult.category;

  const previewSaved = {
    id: null,
    title: genResult.title,
    category: genResult.category,
    categoryLabel: genResult.categoryLabel,
    prompt: genResult.prompt,
    answers: genResult.answers,
    quality: genResult.quality,
    datetime: new Date().toISOString(),
  };

  if (genResult.metrics.fallback) {
    showToast("GPT-4o を利用できないため、テンプレートで生成しました");
  } else {
    showToast("GPT-4o でプロンプトを生成しました");
  }

  showGeneratingStep("");
  renderResult(previewSaved);
  logGenerationSummary(genResult, { networkCalls: genResult.metrics.aiApiCalls });

  const saveStart = performance.now();
  saveAI(toSavePayload(genResult)).then((saved) => {
    currentSavedId = saved.id;
    state.savedPromptId = saved.id;
    addRecentAI(saved.id);
    updateFavoriteButton(saved.id);
    logGenerationSummary(genResult, {
      networkCalls: genResult.metrics.aiApiCalls + 1,
      saveMs: Math.round(performance.now() - saveStart),
    });
    showToast("クラウドへの保存が完了しました");
  });
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

export function removeCurrentAI() {
  if (currentSavedId) deleteAI(currentSavedId);
}

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
