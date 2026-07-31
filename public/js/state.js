/**
 * AI Builder v1.0 — アプリ状態
 */

export const state = {
  categoryId: null,
  questionIndex: 0,
  answers: {},
  customDraft: null,
  savedPromptId: null,
  searchQuery: "",
  libraryFilter: "all",
  /** Schema フロー用 */
  questionFlow: null,
  gapAnalysisDone: false,
  inferredAnswers: {},
};

export function resetFlow() {
  state.questionIndex = 0;
  state.answers = {};
  state.customDraft = null;
  state.savedPromptId = null;
  state.questionFlow = null;
  state.gapAnalysisDone = false;
  state.inferredAnswers = {};
}

export function resetAll() {
  state.categoryId = null;
  resetFlow();
}
