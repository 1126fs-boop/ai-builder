/**
 * AI Builder v2.0 — エントリポイント
 */

import { resetAll } from "./state.js";
import { DOM, showView } from "./ui.js";
import { initHomeView, renderHome, renderCategoryGrids, handleSearchInput, setLibraryFilter } from "./homeView.js";
import { initQuestionView, startCategory, goNext, goPrev, goHomeFromQuestions } from "./questionView.js";
import {
  initResultView,
  showGeneratedResult,
  showMeetingResult,
  openSavedResult,
  openTemplateResult,
  copyPrompt,
  handoffToChatgpt,
  generateResultImage,
  downloadResultImage,
  handleFavoriteToggle,
  restartCategory,
  goHomeFromResult,
} from "./resultView.js";
import { initMeetingPromptView, tryOpenMeetingPromptView } from "./meetingPromptView.js";
import { registerServiceWorker } from "./pwa.js";
import { initStorage } from "./storage.js";
import { initAuthBar } from "./authBar.js";
import { initProducts } from "../wamProducts.js";
import { initLearning } from "./learningBridge.js";

function goHome() {
  resetAll();
  renderHome();
  showView("home");
}

async function init() {
  initLearning();

  initHomeView({
    onStartCategory: startCategory,
    onOpenSaved: openSavedResult,
    onOpenTemplate: openTemplateResult,
  });

  initQuestionView({
    onComplete: showGeneratedResult,
    onGoHome: goHome,
  });

  initResultView({ onGoHome: goHome });

  initMeetingPromptView({
    onComplete: showMeetingResult,
    onCancel: goHome,
  });

  // カテゴリ一覧を最優先で描画（ストレージ待ちより先）
  renderCategoryGrids();

  // フォールバック HTML カードにも対応（イベント委譲）
  DOM.viewHome?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-category-id]");
    if (card?.dataset.categoryId) {
      startCategory(card.dataset.categoryId);
    }
  });

  try {
    await Promise.all([initStorage(), initProducts()]);
    await initAuthBar();

    await renderHome();
  } catch (err) {
    console.error("[app] init failed", err);
    renderCategoryGrids();
  }

  if (tryOpenMeetingPromptView()) {
    /* AI会議からの引き継ぎ */
  }

  DOM.searchInput?.addEventListener("input", (e) => handleSearchInput(e.target.value));

  DOM.filterChips.forEach((chip) => {
    chip.addEventListener("click", () => setLibraryFilter(chip.dataset.filter));
  });

  DOM.btnNext.addEventListener("click", goNext);
  DOM.btnPrev.addEventListener("click", goPrev);
  DOM.btnTopHome.addEventListener("click", goHomeFromQuestions);

  DOM.btnCopy.addEventListener("click", copyPrompt);
  DOM.btnChatgptHandoff?.addEventListener("click", handoffToChatgpt);
  DOM.btnGenerateImage?.addEventListener("click", generateResultImage);
  DOM.btnDownloadImage?.addEventListener("click", downloadResultImage);
  DOM.btnFavorite.addEventListener("click", handleFavoriteToggle);
  DOM.btnRestart.addEventListener("click", restartCategory);
  DOM.btnHome.addEventListener("click", goHomeFromResult);

  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", init);
