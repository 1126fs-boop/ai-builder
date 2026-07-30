/**
 * AI Builder v0.3 — 質問フロー
 */

import { getQuestions } from "../questions.js";
import { state, resetFlow } from "./state.js";
import { DOM, showView, ICON_NEXT } from "./ui.js";

/** @type {() => void} */
let onComplete = () => {};

/** @type {() => void} */
let onGoHome = () => {};

/**
 * コールバックを登録
 * @param {{ onComplete: () => void, onGoHome: () => void }} handlers
 */
export function initQuestionView(handlers) {
  onComplete = handlers.onComplete;
  onGoHome = handlers.onGoHome;
}

/**
 * カテゴリの質問フローを開始
 * @param {string} categoryId
 */
export function startCategory(categoryId) {
  state.categoryId = categoryId;
  resetFlow();
  state.categoryId = categoryId;
  renderQuestion();
  showView("questions");
}

/** 現在の質問を取得 */
function getCurrentQuestion() {
  return getQuestions(state.categoryId)[state.questionIndex];
}

/** 進捗バーを描画 */
function renderProgress(current, total) {
  DOM.progressLabel.textContent = `質問 ${current} / ${total}`;

  DOM.progressSegments.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const seg = document.createElement("span");
    seg.className = "progress-segments__item";
    if (i < current) seg.classList.add("progress-segments__item--filled");
    if (i === current - 1) seg.classList.add("progress-segments__item--active");
    DOM.progressSegments.appendChild(seg);
  }

  DOM.progressSegments.setAttribute("aria-valuenow", String(Math.round((current / total) * 100)));
}

/** 質問画面を描画 */
export function renderQuestion() {
  const questions = getQuestions(state.categoryId);
  const question = questions[state.questionIndex];
  const index = state.questionIndex;

  renderProgress(index + 1, questions.length);

  DOM.questionCard.classList.remove("question-card--enter");
  void DOM.questionCard.offsetWidth;
  DOM.questionCard.classList.add("question-card--enter");

  DOM.questionNumber.textContent = `Q${index + 1}`;
  DOM.questionText.textContent = question.text;

  DOM.optionsContainer.innerHTML = "";
  DOM.textInputArea.hidden = true;
  DOM.textInput.value = "";

  const saved = state.answers[question.id] || "";

  if (question.type === "text") {
    renderTextInput(question, saved);
  } else if (question.type === "choice_with_custom") {
    renderChoiceWithCustom(question, saved);
  } else {
    renderChoices(question, saved);
  }

  updateNavButtons(question);
}

function renderChoices(question, saved) {
  question.options.forEach((opt) => {
    const btn = createOptionBtn(opt, saved === opt);
    btn.addEventListener("click", () => selectChoice(question, opt, btn));
    DOM.optionsContainer.appendChild(btn);
  });
}

function renderChoiceWithCustom(question, saved) {
  const isCustom = saved && !question.options.includes(saved);

  question.options.forEach((opt) => {
    const selected = opt === "自由入力" ? isCustom : saved === opt;
    const btn = createOptionBtn(opt, selected);
    btn.addEventListener("click", () => {
      if (opt === "自由入力") selectCustom(question);
      else selectChoice(question, opt, btn);
    });
    DOM.optionsContainer.appendChild(btn);
  });

  if (isCustom) showTextInput(question, saved);
}

function renderTextInput(question, saved) {
  DOM.textInputArea.hidden = false;
  DOM.textInput.placeholder = question.placeholder || "自由に入力してください";
  DOM.textInput.value = saved;
  DOM.textInput.oninput = () => {
    state.answers[question.id] = DOM.textInput.value.trim();
    updateNavButtons(question);
  };
}

function showTextInput(question, value) {
  DOM.textInputArea.hidden = false;
  DOM.textInput.placeholder = question.placeholder || "自由に入力してください";
  DOM.textInput.value = value || state.customDraft || "";
  DOM.textInput.oninput = () => {
    state.customDraft = DOM.textInput.value;
    state.answers[question.id] = DOM.textInput.value.trim();
    updateNavButtons(question);
  };
  DOM.textInput.focus();
}

function createOptionBtn(label, selected) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "option-btn" + (selected ? " option-btn--selected" : "");
  btn.textContent = label;
  btn.setAttribute("role", "option");
  btn.setAttribute("aria-selected", String(selected));
  return btn;
}

function selectChoice(question, option, btn) {
  state.answers[question.id] = option;
  state.customDraft = null;
  DOM.textInputArea.hidden = true;
  highlightOption(btn);
  updateNavButtons(question);
}

function selectCustom(question) {
  DOM.optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
    const isCustom = btn.textContent === "自由入力";
    btn.classList.toggle("option-btn--selected", isCustom);
    btn.setAttribute("aria-selected", String(isCustom));
  });
  const existing = state.answers[question.id];
  const isPrevCustom = existing && !question.options.includes(existing);
  showTextInput(question, isPrevCustom ? existing : "");
  updateNavButtons(question);
}

function highlightOption(selectedBtn) {
  DOM.optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
    const sel = btn === selectedBtn;
    btn.classList.toggle("option-btn--selected", sel);
    btn.setAttribute("aria-selected", String(sel));
  });
}

function updateNavButtons(question) {
  const answer = state.answers[question.id];
  const valid = question.optional ? true : Boolean(answer && answer.length > 0);
  DOM.btnNext.disabled = !valid;

  const total = getQuestions(state.categoryId).length;
  const isLast = state.questionIndex >= total - 1;
  DOM.btnNext.innerHTML = isLast ? `完成 ${ICON_NEXT}` : `次へ ${ICON_NEXT}`;
}

/** 次へ */
export function goNext() {
  const total = getQuestions(state.categoryId).length;
  if (state.questionIndex >= total - 1) {
    onComplete();
  } else {
    state.questionIndex++;
    state.customDraft = null;
    renderQuestion();
  }
}

/** 戻る（回答は state.answers に保持） */
export function goPrev() {
  if (state.questionIndex > 0) {
    state.questionIndex--;
    state.customDraft = null;
    renderQuestion();
  } else {
    onGoHome();
  }
}

/** ホームボタン */
export function goHomeFromQuestions() {
  onGoHome();
}
