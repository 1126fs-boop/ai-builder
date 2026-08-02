/**
 * AI Builder v2.0 — 結果画面（保存・品質診断・AI評価・Adapter Handoff）
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
import { withTimeout } from "./asyncUtils.js";
import { buildHandoff } from "./thinkingEngine/index.js";
import { openaiImagesAdapter } from "./thinkingEngine/adapters/openaiImagesAdapter.js";
import { generateImageFromPrompt } from "./imageGenerationService.js";
import { openChatGptApp, getChatGptHandoffMessage } from "./chatgptHandoff.js";

const LOG = "[resultView]";
const GENERATION_TIMEOUT_MS = 15000;
let generationInFlight = false;
let imageGenInFlight = false;

let onGoHome = () => {};
let currentSavedId = null;
/** @type {Object|null} */
let currentGeneratedPrompt = null;
/** @type {string|null} */
let currentImageBlobUrl = null;

export function initResultView(handlers) {
  onGoHome = handlers.onGoHome;
}

/** 回答から結果を生成 */
export async function showGeneratedResult() {
  if (generationInFlight) {
    console.warn(`${LOG} showGeneratedResult: skipped (already running)`);
    return;
  }

  generationInFlight = true;
  console.log(`${LOG} showGeneratedResult: start`);
  showView("result");
  showGenerating(true);
  showGeneratingStep("プロンプト生成を準備中…");

  try {
    await withTimeout(runGeneration(), GENERATION_TIMEOUT_MS, "プロンプト生成");
    console.log(`${LOG} showGeneratedResult: complete`);
  } catch (err) {
    console.error(`${LOG} showGeneratedResult: failed`, err);
    showToast(err instanceof Error ? err.message : "プロンプト生成に失敗しました。");
    onGoHome();
  } finally {
    showGenerating(false);
    showGeneratingStep("");
    generationInFlight = false;
    console.log(`${LOG} showGeneratedResult: loading dismissed`);
  }
}

/** 会議連携から結果を表示（meetingPromptView から呼ばれる） */
export function showMeetingResult(saved) {
  currentSavedId = saved.id;
  state.savedPromptId = saved.id;
  currentGeneratedPrompt = saved.answers?.__persistables?.generatedPrompt ?? null;
  renderResult(saved);
  showView("result");
}

async function runGeneration() {
  console.log(`${LOG} runGeneration: start`, { categoryId: state.categoryId });
  showGeneratingStep("回答内容を整理中…");
  await yieldToMain();

  currentSavedId = null;
  state.savedPromptId = null;
  revokeImageBlob();

  const mergedAnswers = { ...state.inferredAnswers, ...state.answers };
  const genResult = await generateWizardPrompt(state.categoryId, mergedAnswers, {
    onStep: (step) => showGeneratingStep(step),
  });
  console.log(`${LOG} runGeneration: template done`, {
    source: genResult.metrics?.source,
    ms: genResult.metrics?.totalMs,
    promptLen: genResult.prompt?.length,
  });

  state.categoryId = genResult.category;
  currentGeneratedPrompt = genResult.generatedPrompt ?? null;

  const previewSaved = {
    id: null,
    title: genResult.title,
    category: genResult.category,
    categoryLabel: genResult.categoryLabel,
    prompt: genResult.prompt,
    answers: genResult.answers,
    quality: genResult.quality,
    qualityGate: genResult.qualityGate,
    datetime: new Date().toISOString(),
  };

  showToast("プロンプトを生成しました");
  showGeneratingStep("");
  renderResult(previewSaved);
  logGenerationSummary(genResult, { networkCalls: 0 });

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
  currentGeneratedPrompt = null;
  revokeImageBlob();

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
  currentGeneratedPrompt = item.answers?.__persistables?.generatedPrompt ?? null;
  revokeImageBlob();

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

  renderAdapterActions(item);
  renderImageSection(item);

  updateFavoriteButton(item.id);
  DOM.btnCopy.classList.remove("btn--copied");
  DOM.btnCopyLabel.textContent = "プロンプトをコピー";
}

/** ChatGPT Handoff / 画像生成ボタン */
function renderAdapterActions(item) {
  const gp = currentGeneratedPrompt ?? item.answers?.__persistables?.generatedPrompt ?? null;

  if (DOM.btnChatgptHandoff) {
    DOM.btnChatgptHandoff.hidden = !gp;
    DOM.btnChatgptHandoff.textContent = "ChatGPTアプリで開く";
  }

  if (DOM.btnGenerateImage) {
    const canImage = gp && openaiImagesAdapter.canGenerate(gp);
    DOM.btnGenerateImage.hidden = !canImage;
  }
}

/** 画像プレビューセクション */
function renderImageSection(item) {
  if (!DOM.imageResultSection) return;

  const gp = currentGeneratedPrompt ?? item.answers?.__persistables?.generatedPrompt ?? null;
  const isImageCategory = item.category === "sns" || item.category === "image";
  const showSection = isImageCategory && gp;

  DOM.imageResultSection.hidden = !showSection;

  if (DOM.imagePreview && !currentImageBlobUrl) {
    DOM.imagePreview.hidden = true;
    DOM.imagePreview.removeAttribute("src");
  }

  if (DOM.btnDownloadImage) {
    DOM.btnDownloadImage.hidden = !currentImageBlobUrl;
  }

  if (DOM.imagePlaceholder && !currentImageBlobUrl) {
    DOM.imagePlaceholder.hidden = false;
      DOM.imagePlaceholder.textContent =
      "「画像を生成」で、毎回異なるオリジナル背景＋公式商品画像の合成画像を作成できます";
  }
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

function revokeImageBlob() {
  if (currentImageBlobUrl) {
    URL.revokeObjectURL(currentImageBlobUrl);
    currentImageBlobUrl = null;
  }
}

/** ChatGPT アプリで開く（プロンプト事前コピー済み） */
export async function handoffToChatgpt() {
  const gp = currentGeneratedPrompt;
  if (!gp) {
    showToast("プロンプトデータがありません");
    return;
  }

  try {
    const handoff = buildHandoff(gp, "chatgpt");
    await copyToClipboard(handoff.text);
    const { platform } = openChatGptApp();
    showToast(getChatGptHandoffMessage(platform));
  } catch (err) {
    showToast(err instanceof Error ? err.message : "Handoff に失敗しました");
  }
}

/** 画像を生成（公式商品画像合成） */
export async function generateResultImage() {
  const gp = currentGeneratedPrompt;
  if (!gp || imageGenInFlight) return;

  imageGenInFlight = true;
  if (DOM.btnGenerateImage) {
    DOM.btnGenerateImage.disabled = true;
    DOM.btnGenerateImage.textContent = "生成中…";
  }
  if (DOM.imagePlaceholder) {
    DOM.imagePlaceholder.textContent = "背景を生成し、公式商品画像を配置しています…";
  }

  try {
    revokeImageBlob();
    const { blobUrl } = await generateImageFromPrompt(gp);
    currentImageBlobUrl = blobUrl;

    if (DOM.imagePreview) {
      DOM.imagePreview.src = blobUrl;
      DOM.imagePreview.hidden = false;
    }
    if (DOM.imagePlaceholder) {
      DOM.imagePlaceholder.hidden = true;
    }

    showToast("画像を生成しました（オリジナルデザイン + 公式商品画像）");
    if (DOM.btnDownloadImage) {
      DOM.btnDownloadImage.hidden = false;
    }
  } catch (err) {
    console.error(`${LOG} generateResultImage failed`, err);
    showToast(err instanceof Error ? err.message : "画像生成に失敗しました");
    if (DOM.imagePlaceholder) {
      DOM.imagePlaceholder.hidden = false;
      DOM.imagePlaceholder.textContent = "「画像を生成」ボタンで、背景＋公式商品画像の合成画像を作成できます";
    }
  } finally {
    imageGenInFlight = false;
    if (DOM.btnGenerateImage) {
      DOM.btnGenerateImage.disabled = false;
      DOM.btnGenerateImage.textContent = "合成プレビュー（公式商品配置）";
    }
  }
}

/** 生成画像をダウンロード */
export function downloadResultImage() {
  if (!currentImageBlobUrl || !DOM.imagePreview?.src) {
    showToast("先に画像を生成してください");
    return;
  }
  const a = document.createElement("a");
  a.href = currentImageBlobUrl;
  a.download = `ai-builder-${Date.now()}.png`;
  a.click();
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
  revokeImageBlob();
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
