/**
 * AI Builder v2.0 — エントリポイント
 */

import { resetAll } from "./state.js";
import { DOM, showView } from "./ui.js";
import { initHomeView, renderHome, handleSearchInput, handleNewAiClick, setLibraryFilter } from "./homeView.js";
import { initQuestionView, startCategory, goNext, goPrev, goHomeFromQuestions } from "./questionView.js";
import {
  initResultView,
  showGeneratedResult,
  openSavedResult,
  openTemplateResult,
  copyPrompt,
  handleFavoriteToggle,
  restartCategory,
  goHomeFromResult,
} from "./resultView.js";
import { registerServiceWorker } from "./pwa.js";
import { initStorage } from "./storage.js";
import { initAuthBar } from "./authBar.js";
import { initProducts } from "../wamProducts.js";

function goHome() {
  resetAll();
  renderHome();
  showView("home");
}

async function init() {
  await Promise.all([initStorage(), initProducts()]);
  await initAuthBar();

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

  await renderHome();

  DOM.searchInput?.addEventListener("input", (e) => handleSearchInput(e.target.value));
  DOM.btnNewAi?.addEventListener("click", handleNewAiClick);

  DOM.filterChips.forEach((chip) => {
    chip.addEventListener("click", () => setLibraryFilter(chip.dataset.filter));
  });

  DOM.btnNext.addEventListener("click", goNext);
  DOM.btnPrev.addEventListener("click", goPrev);
  DOM.btnTopHome.addEventListener("click", goHomeFromQuestions);

  DOM.btnCopy.addEventListener("click", copyPrompt);
  DOM.btnFavorite.addEventListener("click", handleFavoriteToggle);
  DOM.btnRestart.addEventListener("click", restartCategory);
  DOM.btnHome.addEventListener("click", goHomeFromResult);

  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", init);
