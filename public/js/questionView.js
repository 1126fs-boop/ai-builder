/**
 * AI Builder v1.0 — AI作成ウィザード
 */

import { getCategory } from "../categories.js";
import { getQuestions } from "../questions.js";
import { hasSchemaFlow, getSeedQuestions, runGapAnalysis } from "./thinkingEngine/schemas/index.js";
import { ABSOLUTE_MAX_GAP_ROUNDS } from "./thinkingEngine/schemas/_sharedSchemaFields.js";
import { state, resetFlow } from "./state.js";
import { DOM, showView } from "./ui.js";
import { addRecentCategory } from "./storage.js";

let onComplete = () => {};
let onGoHome = () => {};

/** 質問ヒント（営業現場のガイド） */
const QUESTION_HINTS = {
  industry: "商談先のサロン・クリニックの業種を選んでください",
  client_challenge: "お客様が抱える経営課題。ソリューション提案の起点になります",
  sales_type: "今日の営業アクションの種類",
  goal: "この営業で達成したいこと",
  ai_role: "AI に担ってほしい役割・専門性",
  tone: "取引先に合った文体",
  output_format: "ChatGPT に貼り付けた後の出力形式",
  extra_info: "取引先名・競合・予算感など。入力すると品質スコアが大幅アップ",
  wam_product: "株式会社ワム公式HP（wamu-gr.co.jp/product/）掲載商品から選択。画像生成のみ公式HPを参照",
  product_image_upload: "公式HPに商品画像がない商品は、正規パッケージ写真をAIツールにアップロードしてから記載",
  proposal_scope: "提案書の種類に合わせて構成とトーンを最適化します",
  product_area: "提案する商品・サービス領域です",
  client_context: "取引先の状況を入力すると提案書の具体性が大きく向上します",
  hearing_notes: "商談メモがあれば貼り付けてください",
  sns_format: "サイズ・構成が自動で最適化されます",
  appeal_axis: "経営課題と結びつけた訴求軸を設計します",
  target_audience: "ターゲットでトーンと訴求が変わります",
  catch_direction: "入力するとコピーの精度が上がります",
  channel: "形式に合わせて文体と長さを最適化します",
  purpose: "目的で件名・CTAの設計が変わります",
  audience: "相手に合ったトーンと訴求を設計します",
  value: "提供する価値。開封・読了率に直結します",
  product_topic: "新商品案内では商品名・テーマを入れると具体性が上がります",
  usage: "用途に合わせてレイアウトとサイズを最適化します",
  appeal_point: "訴求軸でヘッドラインとビジュアルが決まります",
  display_location: "掲示場所で文字サイズとレイアウトが変わります",
  size_format: "サイズ指定があるとデザイン指示が具体化します",
  free_input: "質問では拾えない情報（必須要素・イメージ・補足）を書くと品質が上がります",
};

export function initQuestionView(handlers) {
  onComplete = handlers.onComplete;
  onGoHome = handlers.onGoHome;

  document.addEventListener("keydown", handleWizardKeydown);
}

function handleWizardKeydown(e) {
  if (e.key !== "Enter" || e.shiftKey) return;
  if (!DOM.viewQuestions.classList.contains("view--active")) return;
  if (DOM.btnNext.disabled) return;
  e.preventDefault();
  goNext();
}

export function startCategory(categoryId) {
  try {
    const category = getCategory(categoryId);
    if (!category) {
      console.error("[questionView] 未知のカテゴリ:", categoryId);
      return;
    }

    state.categoryId = categoryId;
    resetFlow();
    state.categoryId = categoryId;

    if (hasSchemaFlow(categoryId)) {
      state.questionFlow = [...getSeedQuestions(categoryId)];
      state.gapAnalysisDone = false;
      state.gapAnalysisRound = 0;
      state.askedFollowUpIds = [];
      state.inferredAnswers = {};
      state.lastGapQuality = null;
    }

    if (!DOM.wizardCategory) {
      console.error("[questionView] #wizard-category が見つかりません");
      return;
    }

    DOM.wizardCategory.textContent = `${category.icon} ${category.label}`;
    addRecentCategory(categoryId).catch((err) => {
      console.warn("[questionView] 最近使ったカテゴリ保存失敗", err);
    });

    renderQuestion();
    showView("questions");
  } catch (err) {
    console.error("[questionView] startCategory failed", err);
  }
}

/** 現在の質問リスト（Schema フロー or 従来） */
function getActiveQuestions() {
  if (state.questionFlow?.length) return state.questionFlow;
  return getQuestions(state.categoryId);
}

function renderProgress(current, total) {
  const isQualityCheck = state.gapAnalysisRound > 0;
  DOM.progressLabel.textContent = isQualityCheck
    ? `品質確認 ${current} / ${total}`
    : `質問 ${current} / ${total}`;

  DOM.progressSegments.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const seg = document.createElement("span");
    seg.className = "progress-segments__item";
    if (i < current) seg.classList.add("progress-segments__item--filled");
    if (i === current - 1) seg.classList.add("progress-segments__item--active");
    DOM.progressSegments.appendChild(seg);
  }

  const pct = Math.round((current / total) * 100);
  DOM.progressSegments.setAttribute("aria-valuenow", String(pct));
}

export function renderQuestion() {
  const questions = getActiveQuestions();
  const question = questions[state.questionIndex];
  const index = state.questionIndex;

  renderProgress(index + 1, questions.length);

  DOM.questionCard.classList.remove("question-card--enter");
  void DOM.questionCard.offsetWidth;
  DOM.questionCard.classList.add("question-card--enter");

  DOM.questionNumber.textContent = `STEP ${index + 1}`;
  DOM.questionText.textContent = question.text;
  const reasonHint = question._reason ? `💡 ${question._reason}` : "";
  const baseHint = QUESTION_HINTS[question.id] || question.hint || "";
  DOM.questionHint.textContent = [reasonHint, baseHint].filter(Boolean).join(" ");
  DOM.questionHint.hidden = !DOM.questionHint.textContent;

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
  question.options.forEach((opt, i) => {
    const btn = createOptionBtn(opt, saved === opt);
    btn.style.animationDelay = `${i * 0.04}s`;
    btn.classList.add("option-btn--animate");
    btn.addEventListener("click", () => selectChoice(question, opt, btn));
    DOM.optionsContainer.appendChild(btn);
  });
}

function renderChoiceWithCustom(question, saved) {
  const isCustom = saved && !question.options.includes(saved);

  question.options.forEach((opt, i) => {
    const selected = opt === "自由入力" ? isCustom : saved === opt;
    const btn = createOptionBtn(opt, selected);
    btn.style.animationDelay = `${i * 0.04}s`;
    btn.classList.add("option-btn--animate");
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
  setTimeout(() => DOM.textInput.focus(), 300);
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
  setTimeout(() => DOM.textInput.focus(), 200);
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

  // 選択肢タップ後、短い遅延で次へ（ウィザード UX）
  if (question.type === "choice") {
    DOM.btnNext.disabled = false;
    setTimeout(() => {
      if (state.answers[question.id] === option) goNext();
    }, 450);
  }
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

  const total = getActiveQuestions().length;
  const isLast = state.questionIndex >= total - 1;
  const isFollowUp = question._reason != null;
  if (isLast && isFollowUp) {
    DOM.btnNextLabel.textContent = question.optional ? "スキップして生成" : "回答して生成";
  } else if (isLast && hasSchemaFlow(state.categoryId)) {
    DOM.btnNextLabel.textContent = "品質を確認";
  } else if (isLast) {
    DOM.btnNextLabel.textContent = "プロンプトを生成";
  } else {
    DOM.btnNextLabel.textContent = "次へ";
  }
}

/** ギャップ分析を実行し、追問があれば questionFlow に追加 */
function runGapAndMaybeExtendFlow() {
  const gap = runGapAnalysis(state.categoryId, state.answers, {
    askedQuestionIds: state.askedFollowUpIds,
  });
  state.inferredAnswers = gap.inferredAnswers ?? {};
  state.lastGapQuality = {
    score: gap.qualityScore,
    minimum: gap.minimumQualityScore,
    sufficient: gap.qualitySufficient,
    missing: gap.missingQualityFields ?? [],
  };

  for (const [key, val] of Object.entries(state.inferredAnswers)) {
    if (val && !state.answers[key]?.trim()) {
      state.answers[key] = val;
    }
  }

  if (gap.followUpQuestions.length > 0) {
    gap.followUpQuestions.forEach((q) => state.askedFollowUpIds.push(q.id));
    const current = getActiveQuestions();
    state.questionFlow = [...current, ...gap.followUpQuestions];
    state.gapAnalysisRound += 1;
    return true;
  }

  // 追問なし = 品質OK または これ以上聞く項目なし
  state.gapAnalysisDone = true;
  return false;
}

export async function goNext() {
  const questions = getActiveQuestions();
  const isLast = state.questionIndex >= questions.length - 1;

  // 品質ベースのギャップ分析（十分なら追問ゼロ / 不足時だけ追加 / 安全弁あり）
  if (
    isLast &&
    hasSchemaFlow(state.categoryId) &&
    !state.gapAnalysisDone &&
    state.gapAnalysisRound < ABSOLUTE_MAX_GAP_ROUNDS
  ) {
    const extended = runGapAndMaybeExtendFlow();
    if (extended) {
      state.questionIndex++;
      state.customDraft = null;
      renderQuestion();
      return;
    }
  }

  if (isLast) {
    await onComplete();
  } else {
    state.questionIndex++;
    state.customDraft = null;
    renderQuestion();
  }
}

export function goPrev() {
  if (state.questionIndex > 0) {
    state.questionIndex--;
    state.customDraft = null;
    renderQuestion();
  } else {
    onGoHome();
  }
}

export function goHomeFromQuestions() {
  onGoHome();
}
