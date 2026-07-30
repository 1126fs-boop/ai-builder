/**
 * AI Builder v0.3 — アプリエントリポイント
 *
 * 各モジュールを統合し、イベントを接続します。
 */

import { resetAll } from "./state.js";
import { DOM, showView } from "./ui.js";
import { initHomeView, renderHome, handleSearchInput, scrollToCategories } from "./homeView.js";
import { initQuestionView, startCategory, goNext, goPrev, goHomeFromQuestions } from "./questionView.js";
import {
  initResultView,
  showGeneratedResult,
  openSavedResult,
  copyPrompt,
  handleFavoriteToggle,
  restartCategory,
  goHomeFromResult,
} from "./resultView.js";

/* ── ホームへ戻る（共通） ── */
function goHome() {
  resetAll();
  renderHome();
  showView("home");
}

/* ── モジュール初期化 ── */
function init() {
  initHomeView({
    onStartCategory: startCategory,
    onOpenSaved: openSavedResult,
  });

  initQuestionView({
    onComplete: showGeneratedResult,
    onGoHome: goHome,
  });

  initResultView({
    onGoHome: goHome,
  });

  /* ホーム */
  renderHome();
  DOM.searchInput.addEventListener("input", (e) => handleSearchInput(e.target.value));
  DOM.btnNewAi.addEventListener("click", scrollToCategories);

  /* 質問 */
  DOM.btnNext.addEventListener("click", goNext);
  DOM.btnPrev.addEventListener("click", goPrev);
  DOM.btnTopHome.addEventListener("click", goHomeFromQuestions);

  /* 結果 */
  DOM.btnCopy.addEventListener("click", copyPrompt);
  DOM.btnFavorite.addEventListener("click", handleFavoriteToggle);
  DOM.btnRestart.addEventListener("click", restartCategory);
  DOM.btnHome.addEventListener("click", goHomeFromResult);
}

document.addEventListener("DOMContentLoaded", init);
