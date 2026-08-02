/**
 * AI Builder v1.0 — AI作成ウィザード
 */

import { getCategory } from "../categories.js";
import { getQuestions } from "../questions.js";
import { hasSchemaFlow, getWizardInitialQuestions } from "./thinkingEngine/schemas/index.js";
import { runQualitySupplement } from "./thinkingEngine/core/quality/qualitySupplementEngine.js";
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
  free_input: "必ず入れたい内容、NGワード、ブランドトーン、デザインイメージ、キャッチコピー、キャンペーン名など。AIの自動補完と併用できます",
};

function renderQualityStatusPanel(status) {
  if (!DOM.qualityStatusPanel || !status?.headline) {
    if (DOM.qualityStatusPanel) DOM.qualityStatusPanel.hidden = true;
    return;
  }

  DOM.qualityStatusPanel.hidden = false;
  DOM.qualityStatusPanel.classList.toggle("quality-status--ready", status.readyToGenerate);
  DOM.qualityStatusHeadline.textContent = status.headline;
  DOM.qualityStatusSubline.textContent = status.subline || "";

  if (status.missing?.length > 0 && !status.readyToGenerate) {
    DOM.qualityStatusMissingWrap.hidden = false;
    DOM.qualityStatusMissingList.innerHTML = "";
    status.missing.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      DOM.qualityStatusMissingList.appendChild(li);
    });
  } else {
    DOM.qualityStatusMissingWrap.hidden = true;
    DOM.qualityStatusMissingList.innerHTML = "";
  }

  if (status.nextItem && !status.readyToGenerate) {
    DOM.qualityStatusNext.hidden = false;
    DOM.qualityStatusNext.textContent = `次に入力：${status.nextItem}`;
  } else {
    DOM.qualityStatusNext.hidden = true;
    DOM.qualityStatusNext.textContent = "";
  }
}

function hideQualityStatusPanel() {
  if (DOM.qualityStatusPanel) DOM.qualityStatusPanel.hidden = true;
}

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
      state.questionFlow = [...getWizardInitialQuestions(categoryId)];
      state.gapAnalysisDone = false;
      state.gapAnalysisRound = 0;
      state.askedFollowUpIds = ["free_input"];
      state.inferredAnswers = {};
      state.lastGapQuality = null;
      state.wizardQualityPassed = false;
      state.supplementMode = false;
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
    hideQualityStatusPanel();
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
  const questions = getActiveQuestions();
  const currentQuestion = questions[state.questionIndex];
  const isFreeInputStep =
    currentQuestion?.id === "free_input" && !currentQuestion?._supplementType && !state.supplementMode;
  const isQualityCheck = state.gapAnalysisRound > 0 || state.supplementMode;

  if (isFreeInputStep) {
    DOM.progressLabel.textContent = "自由記述（任意）";
  } else if (isQualityCheck) {
    DOM.progressLabel.textContent = `品質補完 ${current} / ${total}`;
  } else {
    DOM.progressLabel.textContent = `質問 ${current} / ${total}`;
  }

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

  DOM.questionNumber.textContent = question._supplementType
    ? "品質補完"
    : question.id === "free_input"
      ? "自由記述（任意）"
      : `STEP ${index + 1}`;
  DOM.questionText.textContent = question.text;
  const reasonHint = question._reason ? `💡 ${question._reason}` : "";
  const baseHint = QUESTION_HINTS[question.id] || question.hint || "";
  DOM.questionHint.textContent = [reasonHint, baseHint].filter(Boolean).join("\n");
  DOM.questionHint.hidden = !DOM.questionHint.textContent;

  if (state.lastGapQuality?.status) {
    renderQualityStatusPanel(state.lastGapQuality.status);
  } else {
    hideQualityStatusPanel();
  }

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
  DOM.textInput.rows = question.id === "free_input" ? 8 : 4;
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
  DOM.textInput.rows = question.id === "free_input" ? 8 : 4;
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
  const isSupplement = question._supplementType != null;
  const isFreeInputStep = question.id === "free_input" && !isSupplement;
  if (isLast && isFreeInputStep && hasSchemaFlow(state.categoryId) && !state.gapAnalysisDone) {
    DOM.btnNextLabel.textContent = "品質を確認";
  } else if (isLast && isSupplement) {
    DOM.btnNextLabel.textContent = question.optional ? "回答またはスキップ" : "回答して再確認";
  } else if (isLast && hasSchemaFlow(state.categoryId) && !state.gapAnalysisDone) {
    DOM.btnNextLabel.textContent = "品質を確認";
  } else if (isLast) {
    DOM.btnNextLabel.textContent = "プロンプトを生成";
  } else {
    DOM.btnNextLabel.textContent = "次へ";
  }
}

/** 品質補完ループ — 不足項目だけ追加し、OK になるまでウィザード内で繰り返す */
function runQualitySupplementStep() {
  const result = runQualitySupplement(state.categoryId, state.answers, {
    askedQuestionIds: state.askedFollowUpIds,
  });

  for (const [key, val] of Object.entries(result.mergedAnswers ?? {})) {
    if (val && !state.answers[key]?.trim()) {
      state.answers[key] = val;
    }
  }
  state.inferredAnswers = result.gap?.inferredAnswers ?? state.inferredAnswers;

  state.lastGapQuality = {
    score: result.gap?.qualityScore,
    minimum: result.gap?.minimumQualityScore,
    sufficient: result.gap?.qualitySufficient,
    missing: result.qualityStatus?.missing ?? result.gap?.missingQualityFields ?? [],
    status: result.qualityStatus ?? null,
  };

  if (result.qualityStatus) {
    renderQualityStatusPanel(result.qualityStatus);
  }

  if (result.readyToGenerate) {
    state.wizardQualityPassed = true;
    state.gapAnalysisDone = true;
    state.supplementMode = false;
    state.answers.__wizardQualityCompleted = true;
    state.answers.__wizardQuality = {
      score: result.qualityStatus?.score ?? Math.round((result.gap?.qualityScore ?? 0) * 100),
      missing: result.qualityStatus?.missing ?? [],
    };
    return "generate";
  }

  if (result.supplementQuestions?.length > 0) {
    result.supplementQuestions.forEach((q) => {
      if (!state.askedFollowUpIds.includes(q.id)) {
        state.askedFollowUpIds.push(q.id);
      }
    });
    const current = getActiveQuestions();
    state.questionFlow = [...current, ...result.supplementQuestions];
    state.gapAnalysisRound += 1;
    state.supplementMode = true;
    return "ask";
  }

  // 補完質問が出せないが品質未達 — ウィザード内で追加入力を促す（生成はしない）
  return "blocked";
}

export async function goNext() {
  const questions = getActiveQuestions();
  const isLast = state.questionIndex >= questions.length - 1;

  // 品質補完ループ: 最後の質問のたびに再採点 → 不足なら1問追加 / OK なら生成
  if (
    isLast &&
    hasSchemaFlow(state.categoryId) &&
    !state.gapAnalysisDone &&
    state.gapAnalysisRound < ABSOLUTE_MAX_GAP_ROUNDS
  ) {
    const step = runQualitySupplementStep();
    if (step === "ask") {
      state.questionIndex++;
      state.customDraft = null;
      renderQuestion();
      return;
    }
    if (step === "generate") {
      await onComplete();
      return;
    }
    if (step === "blocked") {
      showView("questions");
      if (state.lastGapQuality?.status) {
        renderQualityStatusPanel(state.lastGapQuality.status);
      }
      return;
    }
  }

  if (isLast) {
    if (hasSchemaFlow(state.categoryId) && !state.gapAnalysisDone) {
      showView("questions");
      DOM.questionHint.textContent =
        "品質確認が完了していません。回答を追加するか、前の質問に戻って不足項目を埋めてください。";
      return;
    }
    await onComplete();
    return;
  }

  state.questionIndex++;
  state.customDraft = null;
  renderQuestion();
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
