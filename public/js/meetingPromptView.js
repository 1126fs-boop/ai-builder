/**
 * AI会議 → プロンプト生成 連携ビュー
 */

import { loadMeetingForPrompt, clearMeetingForPrompt } from "./meeting/meetingBridge.js";
import { buildPromptFromMeeting, generateMeetingTitle, evaluateMeetingPrompt } from "../promptBuilder.js";
import { saveAI, addRecentAI } from "./storage.js";
import { state } from "./state.js";
import { DOM, showView, showToast, showGenerating, showGeneratingStep } from "./ui.js";
import { withTimeout } from "./asyncUtils.js";
import { createProfiler } from "./ai/performanceProfiler.js";

const LOG = "[meetingPromptView]";
const GENERATION_TIMEOUT_MS = 30000;

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
  showGeneratingStep("AI会議の内容をプロンプトに変換中…");

  try {
    await withTimeout(runMeetingGeneration(edits, handlers), GENERATION_TIMEOUT_MS, "プロンプト生成");
    clearMeetingForPrompt();
  } catch (err) {
    console.error(LOG, err);
    showToast(err instanceof Error ? err.message : "生成に失敗しました");
    showView("meetingPrompt");
  } finally {
    showGenerating(false);
    showGeneratingStep("");
  }
}

async function runMeetingGeneration(edits, handlers) {
  const profiler = createProfiler("会議→プロンプト生成");
  profiler.mark("開始");

  showGeneratingStep("品質診断とプロンプト構築を並列実行中…");

  const [quality, prompt] = await Promise.all([
    Promise.resolve().then(() => {
      showGeneratingStep("品質診断中…");
      return evaluateMeetingPrompt(edits);
    }),
    Promise.resolve().then(() => {
      showGeneratingStep("プロンプトを構築中…");
      return buildPromptFromMeeting(edits);
    }),
  ]);

  profiler.mark("プロンプト構築完了");

  if (!prompt?.trim()) {
    throw new Error("プロンプトの生成に失敗しました。");
  }

  showGeneratingStep("クラウドに保存中…");
  const title = generateMeetingTitle(edits.topic);
  const saved = await saveAI({
    title,
    category: "agent",
    categoryLabel: "AI会議連携",
    prompt,
    answers: edits,
    quality,
  });

  profiler.mark("Supabase保存完了");
  profiler.report();

  state.categoryId = "agent";
  state.savedPromptId = saved.id;
  addRecentAI(saved.id);

  handlers.onComplete(saved);
}

export function getCurrentMeetingEdits() {
  return currentEdits;
}
