/**
 * AI Builder v0.2 — メインスクリプト
 *
 * 責務:
 *   - ビュー切り替え（ホーム / 質問 / 結果）
 *   - 質問フローの制御
 *   - プロンプト生成 & 品質チェック表示
 *
 * データは questions.js（AIBuilderData）を参照。
 * UI 描画・イベント処理のみを担当し、質問定義は持たない。
 */

/* ============================================================
   1. アプリ状態
   ============================================================ */

/**
 * @typedef {Object} AppState
 * @property {string|null} categoryId   - 選択中カテゴリ ID
 * @property {number}      questionIndex - 現在の質問インデックス（0始まり）
 * @property {Object<string,string>} answers - 質問 ID → 回答のマップ
 * @property {string|null} customDraft  - choice_with_custom の自由入力下書き
 */

/** @type {AppState} */
const state = {
  categoryId: null,
  questionIndex: 0,
  answers: {},
  customDraft: null,
};

/* ============================================================
   2. DOM 参照
   ============================================================ */

const DOM = {
  // ビュー
  viewHome: document.getElementById("view-home"),
  viewQuestions: document.getElementById("view-questions"),
  viewResult: document.getElementById("view-result"),

  // ホーム
  categoryGrid: document.getElementById("category-grid"),

  // 質問 — トップバー
  btnTopHome: document.getElementById("btn-top-home"),
  progressLabel: document.getElementById("progress-label"),
  progressSegments: document.getElementById("progress-segments"),

  // 質問 — カード
  questionCard: document.getElementById("question-card"),
  questionNumber: document.getElementById("question-number"),
  questionText: document.getElementById("question-text"),
  optionsContainer: document.getElementById("options-container"),
  textInputArea: document.getElementById("text-input-area"),
  textInput: document.getElementById("text-input"),

  // 質問 — ナビ
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),

  // 結果
  resultCategoryLabel: document.getElementById("result-category-label"),
  promptOutput: document.getElementById("prompt-output"),
  qualityStars: document.getElementById("quality-stars"),
  qualityScore: document.getElementById("quality-score"),
  qualityMissingList: document.getElementById("quality-missing-list"),
  btnCopy: document.getElementById("btn-copy"),
  btnCopyLabel: document.getElementById("btn-copy-label"),
  btnRestart: document.getElementById("btn-restart"),
  btnHome: document.getElementById("btn-home"),

  // トースト
  toast: document.getElementById("toast"),
};

/** @type {Record<string, HTMLElement>} */
const VIEWS = {
  home: DOM.viewHome,
  questions: DOM.viewQuestions,
  result: DOM.viewResult,
};

/* ============================================================
   3. ビュー管理
   ============================================================ */

/**
 * 指定ビューに切り替え
 * @param {"home"|"questions"|"result"} viewName
 */
function showView(viewName) {
  Object.entries(VIEWS).forEach(([name, el]) => {
    const active = name === viewName;
    el.classList.toggle("view--active", active);
    el.hidden = !active;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================================================
   4. ホーム画面
   ============================================================ */

/** カテゴリカードを描画 */
function renderCategoryCards() {
  DOM.categoryGrid.innerHTML = "";

  AIBuilderData.getCategories().forEach((category, index) => {
    const card = document.createElement("button");
    card.className = "category-card";
    card.style.animationDelay = `${index * 0.06}s`;
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", `${category.label}を選択`);
    card.dataset.categoryId = category.id;

    card.innerHTML = `
      <span class="category-card__icon" aria-hidden="true">${category.icon}</span>
      <span class="category-card__label">${category.label}</span>
      <span class="category-card__desc">${category.description}</span>
    `;

    card.addEventListener("click", () => startCategory(category.id));
    DOM.categoryGrid.appendChild(card);
  });
}

/**
 * カテゴリ選択 → 質問フロー開始
 * @param {string} categoryId
 */
function startCategory(categoryId) {
  state.categoryId = categoryId;
  state.questionIndex = 0;
  state.answers = {};
  state.customDraft = null;

  renderQuestion();
  showView("questions");
}

/* ============================================================
   5. 質問フロー
   ============================================================ */

/** 現在のカテゴリオブジェクトを取得 */
function getCurrentCategory() {
  return AIBuilderData.getCategory(state.categoryId);
}

/** 現在の質問オブジェクトを取得 */
function getCurrentQuestion() {
  return getCurrentCategory().questions[state.questionIndex];
}

/* ── 進捗バー ── */

/**
 * セグメント型進捗バーを描画（██████░░░ 形式）
 * @param {number} current - 現在の質問番号（1始まり）
 * @param {number} total   - 全質問数
 */
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

  const percent = Math.round((current / total) * 100);
  DOM.progressSegments.setAttribute("aria-valuenow", String(percent));
}

/* ── 質問描画 ── */

/** 現在の質問を画面に描画 */
function renderQuestion() {
  const category = getCurrentCategory();
  const question = getCurrentQuestion();
  const total = category.questions.length;
  const index = state.questionIndex;

  renderProgress(index + 1, total);

  // 質問カードのアニメーションリセット
  DOM.questionCard.classList.remove("question-card--enter");
  void DOM.questionCard.offsetWidth;
  DOM.questionCard.classList.add("question-card--enter");

  DOM.questionNumber.textContent = `Q${index + 1}`;
  DOM.questionText.textContent = question.text;

  // 入力エリアをリセット
  DOM.optionsContainer.innerHTML = "";
  DOM.textInputArea.hidden = true;
  DOM.textInput.value = "";

  const savedAnswer = state.answers[question.id] || "";

  if (question.type === "text") {
    renderTextInput(question, savedAnswer);
  } else if (question.type === "choice_with_custom") {
    renderChoiceWithCustom(question, savedAnswer);
  } else {
    renderChoices(question, savedAnswer);
  }

  updateNavButtons(question);
}

/** 選択肢ボタンを描画 */
function renderChoices(question, savedAnswer) {
  question.options.forEach((option) => {
    const btn = createOptionButton(option, savedAnswer === option);
    btn.addEventListener("click", () => selectChoice(question, option, btn));
    DOM.optionsContainer.appendChild(btn);
  });
}

/** 選択肢 + 自由入力を描画 */
function renderChoiceWithCustom(question, savedAnswer) {
  const isCustom = savedAnswer && !question.options.includes(savedAnswer);

  question.options.forEach((option) => {
    const isSelected = option === "自由入力"
      ? isCustom
      : savedAnswer === option;

    const btn = createOptionButton(option, isSelected);
    btn.addEventListener("click", () => {
      if (option === "自由入力") {
        selectCustomOption(question);
      } else {
        selectChoice(question, option, btn);
      }
    });
    DOM.optionsContainer.appendChild(btn);
  });

  if (isCustom) {
    showTextInput(question, savedAnswer);
  }
}

/** テキスト入力のみの質問を描画 */
function renderTextInput(question, savedAnswer) {
  DOM.textInputArea.hidden = false;
  DOM.textInput.placeholder = question.placeholder || "自由に入力してください";
  DOM.textInput.value = savedAnswer;

  DOM.textInput.oninput = () => {
    state.answers[question.id] = DOM.textInput.value.trim();
    updateNavButtons(question);
  };
}

/** 自由入力テキスト欄を表示 */
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

/** 選択肢ボタン DOM を生成 */
function createOptionButton(label, selected) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "option-btn" + (selected ? " option-btn--selected" : "");
  btn.textContent = label;
  btn.setAttribute("role", "option");
  btn.setAttribute("aria-selected", String(selected));
  return btn;
}

/* ── 回答処理 ── */

/** 選択肢を選んだ */
function selectChoice(question, option, clickedBtn) {
  state.answers[question.id] = option;
  state.customDraft = null;
  DOM.textInputArea.hidden = true;

  highlightSelectedOption(clickedBtn);
  updateNavButtons(question);
}

/** 「自由入力」を選んだ */
function selectCustomOption(question) {
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

/** 選択状態の UI 更新 */
function highlightSelectedOption(selectedBtn) {
  DOM.optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
    const selected = btn === selectedBtn;
    btn.classList.toggle("option-btn--selected", selected);
    btn.setAttribute("aria-selected", String(selected));
  });
}

/** ナビボタンの有効/無効を更新 */
function updateNavButtons(question) {
  const answer = state.answers[question.id];
  const hasAnswer = question.optional
    ? true
    : Boolean(answer && answer.length > 0);

  DOM.btnPrev.disabled = false;
  DOM.btnNext.disabled = !hasAnswer;

  const isLast = state.questionIndex >= getCurrentCategory().questions.length - 1;
  DOM.btnNext.innerHTML = isLast
    ? `完成 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`
    : `次へ <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
}

/* ── ナビゲーション ── */

/** 次の質問へ / 結果画面へ */
function goNext() {
  const category = getCurrentCategory();
  const isLast = state.questionIndex >= category.questions.length - 1;

  if (isLast) {
    showResult();
  } else {
    state.questionIndex++;
    state.customDraft = null;
    renderQuestion();
  }
}

/** 前の質問へ */
function goPrev() {
  if (state.questionIndex > 0) {
    state.questionIndex--;
    state.customDraft = null;
    renderQuestion();
  } else {
    goHome();
  }
}

/* ============================================================
   6. 結果画面
   ============================================================ */

/** 結果画面を表示 */
function showResult() {
  const category = getCurrentCategory();
  const prompt = category.buildPrompt(state.answers);
  const quality = AIBuilderData.getQualityCheck(state.categoryId);

  DOM.resultCategoryLabel.textContent = `${category.icon} ${category.label}`;
  DOM.promptOutput.textContent = prompt;

  renderQualityCheck(quality);

  DOM.btnCopy.classList.remove("btn--copied");
  DOM.btnCopyLabel.textContent = "コピー";

  showView("result");
}

/**
 * 品質チェック（ダミー）を描画
 * @param {{ score: number, stars: number, missing: string[] }} quality
 */
function renderQualityCheck(quality) {
  DOM.qualityStars.textContent = "★".repeat(quality.stars) + "☆".repeat(5 - quality.stars);
  DOM.qualityScore.textContent = `${quality.score}点`;

  DOM.qualityMissingList.innerHTML = "";
  quality.missing.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    DOM.qualityMissingList.appendChild(li);
  });
}

/** プロンプトをクリップボードにコピー */
async function copyPrompt() {
  const text = DOM.promptOutput.textContent;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    fallbackCopy(text);
  }

  DOM.btnCopy.classList.add("btn--copied");
  DOM.btnCopyLabel.textContent = "コピーしました！";
  showToast("クリップボードにコピーしました");
}

/** execCommand によるコピーフォールバック */
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

/** 同じカテゴリを最初から */
function restartCategory() {
  if (state.categoryId) {
    startCategory(state.categoryId);
  }
}

/** ホーム画面へ戻る */
function goHome() {
  state.categoryId = null;
  state.questionIndex = 0;
  state.answers = {};
  state.customDraft = null;
  showView("home");
}

/* ============================================================
   7. ユーティリティ
   ============================================================ */

let toastTimer = null;

/** トースト通知 */
function showToast(message) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add("toast--visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove("toast--visible"), 2500);
}

/* ============================================================
   8. 初期化
   ============================================================ */

function init() {
  renderCategoryCards();

  DOM.btnNext.addEventListener("click", goNext);
  DOM.btnPrev.addEventListener("click", goPrev);
  DOM.btnTopHome.addEventListener("click", goHome);
  DOM.btnCopy.addEventListener("click", copyPrompt);
  DOM.btnRestart.addEventListener("click", restartCategory);
  DOM.btnHome.addEventListener("click", goHome);
}

document.addEventListener("DOMContentLoaded", init);
