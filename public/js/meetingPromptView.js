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
import { withTimeout } from "./asyncUtils.js";

/** @type {object|null} */
let currentEdits = null;
let generationInFlight = false;
const LOG = "[meetingPromptView]";
const GENERATION_TIMEOUT_MS = 15000;

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
  if (generationInFlight) {
    console.warn(`${LOG} handleGenerate: skipped (already running)`);
    return;
  }

  generationInFlight = true;
  showView("result");
  showGenerating(true);
  showGeneratingStep("AI会議の内容を読み込み中…");
  console.log(`${LOG} handleGenerate: start`);

  try {
    await withTimeout(runMeetingGeneration(edits, handlers), GENERATION_TIMEOUT_MS, "会議プロンプト生成");
    clearMeetingForPrompt();
    console.log(`${LOG} handleGenerate: complete`);
  } catch (err) {
    console.error(`${LOG} handleGenerate: failed`, err);
    showToast(err instanceof Error ? err.message : "生成に失敗しました");
    showView("meetingPrompt");
  } finally {
    showGenerating(false);
    showGeneratingStep("");
    generationInFlight = false;
    console.log(`${LOG} handleGenerate: loading dismissed`);
  }
}

async function runMeetingGeneration(edits, handlers) {
  console.log(`${LOG} runMeetingGeneration: start`);
  await yieldToMain();

  const genResult = await generateMeetingPrompt(edits, {
    onStep: (step) => showGeneratingStep(step),
  });
  console.log(`${LOG} runMeetingGeneration: template done`, {
    source: genResult.metrics?.source,
    ms: genResult.metrics?.totalMs,
    promptLen: genResult.prompt?.length,
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

  showToast("プロンプトを生成しました");
  showGeneratingStep("");
  logGenerationSummary(genResult, { networkCalls: 0 });

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
