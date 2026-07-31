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

/** 生成中オーバーレイ */
export function showGenerating(show) {
  if (DOM.generatingOverlay) DOM.generatingOverlay.hidden = !show;
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
