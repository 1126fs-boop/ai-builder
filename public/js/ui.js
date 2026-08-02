/**
 * AI Builder v1.0 — DOM & 共通 UI
 */

export const DOM = {
  appBar: document.getElementById("app-bar"),
  templatesList: document.getElementById("templates-list"),
  viewHome: document.getElementById("view-home"),
  viewQuestions: document.getElementById("view-questions"),
  viewResult: document.getElementById("view-result"),
  viewMeetingPrompt: document.getElementById("view-meeting-prompt"),

  meetingPromptTopic: document.getElementById("meeting-prompt-topic"),
  meetingPromptSummary: document.getElementById("meeting-prompt-summary"),
  meetingPromptConclusion: document.getElementById("meeting-prompt-conclusion"),
  meetingPromptPreconditions: document.getElementById("meeting-prompt-preconditions"),
  meetingPromptDiscussion: document.getElementById("meeting-prompt-discussion"),
  btnGenerateFromMeeting: document.getElementById("btn-generate-from-meeting"),
  btnCancelMeetingPrompt: document.getElementById("btn-cancel-meeting-prompt"),

  searchInput: document.getElementById("search-input"),
  btnNewAi: document.getElementById("btn-new-ai"),
  libraryList: document.getElementById("library-list"),
  libraryCount: document.getElementById("library-count"),
  filterChips: document.querySelectorAll(".filter-chip"),
  popularGrid: document.getElementById("popular-grid"),
  allCategoriesGrid: document.getElementById("all-categories-grid"),

  btnTopHome: document.getElementById("btn-top-home"),
  wizardCategory: document.getElementById("wizard-category"),
  progressLabel: document.getElementById("progress-label"),
  progressSegments: document.getElementById("progress-segments"),
  questionCard: document.getElementById("question-card"),
  questionNumber: document.getElementById("question-number"),
  questionText: document.getElementById("question-text"),
  questionHint: document.getElementById("question-hint"),
  optionsContainer: document.getElementById("options-container"),
  textInputArea: document.getElementById("text-input-area"),
  textInput: document.getElementById("text-input"),
  qualityStatusPanel: document.getElementById("quality-status-panel"),
  qualityStatusHeadline: document.getElementById("quality-status-headline"),
  qualityStatusSubline: document.getElementById("quality-status-subline"),
  qualityStatusMissingWrap: document.getElementById("quality-status-missing-wrap"),
  qualityStatusMissingList: document.getElementById("quality-status-missing-list"),
  qualityStatusNext: document.getElementById("quality-status-next"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),
  btnNextLabel: document.getElementById("btn-next-label"),

  generatingOverlay: document.getElementById("generating-overlay"),
  generatingStep: document.getElementById("generating-step"),
  resultGrade: document.getElementById("result-grade"),
  resultTitle: document.getElementById("result-title"),
  resultCategoryLabel: document.getElementById("result-category-label"),
  recommendedAi: document.getElementById("recommended-ai"),
  promptOutput: document.getElementById("prompt-output"),
  qualityStars: document.getElementById("quality-stars"),
  qualityScore: document.getElementById("quality-score"),
  qualityGradeLabel: document.getElementById("quality-grade-label"),
  dimensionsContainer: document.getElementById("dimensions-container"),
  qualityStrengthsList: document.getElementById("quality-strengths-list"),
  qualityMissingList: document.getElementById("quality-missing-list"),
  qualityRecommendation: document.getElementById("quality-recommendation"),
  btnCopy: document.getElementById("btn-copy"),
  btnCopyLabel: document.getElementById("btn-copy-label"),
  btnChatgptHandoff: document.getElementById("btn-chatgpt-handoff"),
  btnGenerateImage: document.getElementById("btn-generate-image"),
  btnDownloadImage: document.getElementById("btn-download-image"),
  imageResultSection: document.getElementById("image-result-section"),
  imagePreview: document.getElementById("image-preview"),
  imagePlaceholder: document.getElementById("image-placeholder"),
  btnFavorite: document.getElementById("btn-favorite"),
  btnRestart: document.getElementById("btn-restart"),
  btnHome: document.getElementById("btn-home"),

  toast: document.getElementById("toast"),
};

export const VIEWS = {
  home: DOM.viewHome,
  questions: DOM.viewQuestions,
  result: DOM.viewResult,
  meetingPrompt: DOM.viewMeetingPrompt,
};

let toastTimer = null;

/** @param {"home"|"questions"|"result"|"meetingPrompt"} name */
export function showView(name) {
  Object.entries(VIEWS).forEach(([key, el]) => {
    if (!el) return;
    const active = key === name;
    el.classList.toggle("view--active", active);
    el.hidden = !active;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showToast(message) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add("toast--visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove("toast--visible"), 2800);
}

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

export function renderEmpty(container, message, icon = "📭") {
  container.innerHTML = `<div class="empty-state"><span class="empty-state__icon">${icon}</span><p>${message}</p></div>`;
}

/** 生成中オーバーレイ（CSS キャッシュに依存せず確実に表示/非表示） */
export function showGenerating(show) {
  const el = DOM.generatingOverlay;
  if (!el) {
    console.warn("[ui] generatingOverlay が見つかりません");
    return;
  }
  el.hidden = !show;
  // 旧 CSS（display:flex が hidden を上書き）がキャッシュされていても確実に消す
  el.style.display = show ? "flex" : "none";
  el.setAttribute("aria-busy", show ? "true" : "false");
  el.classList.toggle("generating--active", show);
  console.log(
    `[ui] showGenerating(${show}) hidden=${el.hidden} style.display=${el.style.display} computed=${getComputedStyle(el).display}`
  );
}

/** 生成ステップ表示 */
export function showGeneratingStep(text) {
  if (DOM.generatingStep) DOM.generatingStep.textContent = text || "";
}

/** HTML エスケープ */
export function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
