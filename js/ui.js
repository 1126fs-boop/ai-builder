/**
 * AI Builder v0.3 — DOM 参照 & 共通 UI
 */

/** DOM 要素のキャッシュ */
export const DOM = {
  viewHome: document.getElementById("view-home"),
  viewQuestions: document.getElementById("view-questions"),
  viewResult: document.getElementById("view-result"),

  searchInput: document.getElementById("search-input"),
  btnNewAi: document.getElementById("btn-new-ai"),
  recentList: document.getElementById("recent-list"),
  popularGrid: document.getElementById("popular-grid"),
  favoritesList: document.getElementById("favorites-list"),
  allCategoriesGrid: document.getElementById("all-categories-grid"),

  btnTopHome: document.getElementById("btn-top-home"),
  progressLabel: document.getElementById("progress-label"),
  progressSegments: document.getElementById("progress-segments"),
  questionCard: document.getElementById("question-card"),
  questionNumber: document.getElementById("question-number"),
  questionText: document.getElementById("question-text"),
  optionsContainer: document.getElementById("options-container"),
  textInputArea: document.getElementById("text-input-area"),
  textInput: document.getElementById("text-input"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),

  resultCategoryLabel: document.getElementById("result-category-label"),
  promptOutput: document.getElementById("prompt-output"),
  qualityStars: document.getElementById("quality-stars"),
  qualityScore: document.getElementById("quality-score"),
  qualityMissingList: document.getElementById("quality-missing-list"),
  btnCopy: document.getElementById("btn-copy"),
  btnCopyLabel: document.getElementById("btn-copy-label"),
  btnFavorite: document.getElementById("btn-favorite"),
  btnRestart: document.getElementById("btn-restart"),
  btnHome: document.getElementById("btn-home"),

  toast: document.getElementById("toast"),
};

/** @type {Record<string, HTMLElement>} */
export const VIEWS = {
  home: DOM.viewHome,
  questions: DOM.viewQuestions,
  result: DOM.viewResult,
};

let toastTimer = null;

/**
 * ビュー切り替え
 * @param {"home"|"questions"|"result"} name
 */
export function showView(name) {
  Object.entries(VIEWS).forEach(([key, el]) => {
    const active = key === name;
    el.classList.toggle("view--active", active);
    el.hidden = !active;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** トースト通知 */
export function showToast(message) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add("toast--visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove("toast--visible"), 2500);
}

/** クリップボードにコピー */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/** SVG アイコン（次へ） */
export const ICON_NEXT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

/** 空状態メッセージ */
export function renderEmpty(container, message) {
  container.innerHTML = `<p class="empty-state">${message}</p>`;
}
