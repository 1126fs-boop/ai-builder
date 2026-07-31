/**
 * AI会議 → プロンプト生成 連携ビュー
 */

import { loadMeetingForPrompt, clearMeetingForPrompt } from "./meeting/meetingBridge.js";
import {
  generateMeetingPrompt,
  toSavePayload,
  logGenerationSummary,
} from "./ai/promptGenerationPipeline.js";
import { saveAI, addRecentAI } from "./storage.js";
import { state } from "./state.js";
import { DOM, showView, showToast, showGenerating, showGeneratingStep } from "./ui.js";
import { yieldToMain } from "./ai/performanceProfiler.js";

/** @type {object|null} */
let currentEdits = null;

export function initMeetingPromptView(handlers) {
  DOM.btnGenerateFromMeeting?.addEventListener("click", () => handleGenerate(handlers));
  DOM.btnCancelMeetingPrompt?.addEventListener("click", () => {
    clearMeetingForPrompt();
    handlers.onCancel();
  });
}

/** URL パラメータ or sessionStorage から会議データを読み込み */
export function tryOpenMeetingPromptView() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("fromMeeting") !== "1") return false;

  const data = loadMeetingForPrompt();
  if (!data) return false;

  currentEdits = { ...data };
  if (DOM.meetingPromptTopic) DOM.meetingPromptTopic.value = data.topic || "";
  if (DOM.meetingPromptSummary) DOM.meetingPromptSummary.value = data.summary || "";
  if (DOM.meetingPromptConclusion) DOM.meetingPromptConclusion.value = data.conclusion || "";
  if (DOM.meetingPromptPreconditions) DOM.meetingPromptPreconditions.value = data.preconditions || "";
  if (DOM.meetingPromptDiscussion) DOM.meetingPromptDiscussion.value = data.discussion || "";

  showView("meetingPrompt");
  return true;
}

function collectEdits() {
  return {
    topic: DOM.meetingPromptTopic?.value?.trim() || "",
    summary: DOM.meetingPromptSummary?.value?.trim() || "",
    conclusion: DOM.meetingPromptConclusion?.value?.trim() || "",
    preconditions: DOM.meetingPromptPreconditions?.value?.trim() || "",
    discussion: DOM.meetingPromptDiscussion?.value?.trim() || "",
  };
}

async function handleGenerate(handlers) {
  const edits = collectEdits();
  if (!edits.topic) {
    showToast("議題を入力してください");
    return;
  }

  showView("result");
  showGenerating(true);
  showGeneratingStep("AI会議の内容を読み込み中…");

  try {
    await runMeetingGeneration(edits, handlers);
    clearMeetingForPrompt();
  } catch (err) {
    console.error("[meetingPromptView]", err);
    showToast(err instanceof Error ? err.message : "生成に失敗しました");
    showView("meetingPrompt");
  } finally {
    showGenerating(false);
    showGeneratingStep("");
  }
}

async function runMeetingGeneration(edits, handlers) {
  await yieldToMain();

  DOM.promptOutput.textContent = "";

  let streamedText = "";
  let overlayDismissed = false;

  const genResult = await generateMeetingPrompt(edits, {
    onStep: (step) => showGeneratingStep(step),
    onDelta: (text) => {
      if (!overlayDismissed) {
        showGenerating(false);
        overlayDismissed = true;
      }
      streamedText += text;
      DOM.promptOutput.textContent = streamedText;
      DOM.promptOutput.scrollTop = DOM.promptOutput.scrollHeight;
    },
  });

  const previewSaved = {
    id: null,
    title: genResult.title,
    category: genResult.category,
    categoryLabel: genResult.categoryLabel,
    prompt: genResult.prompt,
    answers: genResult.answers,
    quality: genResult.quality,
    datetime: new Date().toISOString(),
  };

  state.categoryId = genResult.category;
  handlers.onComplete(previewSaved);

  if (genResult.metrics.fallback) {
    showToast("GPT-4o を利用できないため、テンプレートで生成しました");
  } else {
    showToast("GPT-4o で AI会議の内容を統合しました");
  }

  showGeneratingStep("");
  logGenerationSummary(genResult, { networkCalls: genResult.metrics.aiApiCalls });

  const saveStart = performance.now();
  saveAI(toSavePayload(genResult)).then((saved) => {
    state.savedPromptId = saved.id;
    addRecentAI(saved.id);
    logGenerationSummary(genResult, {
      networkCalls: genResult.metrics.aiApiCalls + 1,
      saveMs: Math.round(performance.now() - saveStart),
    });
    showToast("クラウドへの保存が完了しました");
  });
}

export function getCurrentMeetingEdits() {
  return currentEdits;
}
