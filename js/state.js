/**
 * AI Builder v0.3 — アプリ状態
 */

/** @typedef {Object} AppState */
export const state = {
  /** @type {string|null} */
  categoryId: null,
  /** @type {number} */
  questionIndex: 0,
  /** @type {Object<string,string>} */
  answers: {},
  /** @type {string|null} */
  customDraft: null,
  /** @type {string|null} 表示中の保存済みプロンプト ID */
  savedPromptId: null,
  /** @type {string} ホーム検索クエリ */
  searchQuery: "",
};

/** 質問フローをリセット（カテゴリは維持） */
export function resetFlow() {
  state.questionIndex = 0;
  state.answers = {};
  state.customDraft = null;
  state.savedPromptId = null;
}

/** 全状態をリセット */
export function resetAll() {
  state.categoryId = null;
  resetFlow();
  state.searchQuery = "";
}
