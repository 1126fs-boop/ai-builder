/**
 * プロンプト生成プロバイダー（差し替え可能）
 *
 * 現状: template（ルールベース）のみ
 * 将来: openai 等のプロバイダーを追加し、ACTIVE_PROVIDER を切り替える
 */

import { createProfiler } from "./performanceProfiler.js";
import { getCategory } from "../../categories.js";
import {
  buildPrompt,
  generateTitle,
  generateMeetingTitle,
} from "../../promptBuilder.js";
import { diagnoseQuality } from "../../qualityEngine.js";
import { buildMeetingPromptPayload } from "./promptEnhancer.js";
import { wrapPrompt } from "../../context.js";
import { structuredPro } from "./promptEnhancer.js";

/** @typedef {"template"|"openai"} PromptProviderId */

/** 使用中のプロバイダー（API 未使用時は template 固定） */
export const ACTIVE_PROVIDER = "template";

/**
 * ウィザード — テンプレート生成
 * @param {string} categoryId
 * @param {Object<string,string>} answers
 * @param {{ onStep?: (msg: string) => void }} [callbacks]
 */
export async function generateWizardViaProvider(categoryId, answers, callbacks = {}) {
  const profiler = createProfiler("ウィザード→テンプレート");
  profiler.mark("開始");
  callbacks.onStep?.("回答内容を整理中…");

  const category = getCategory(categoryId);
  if (!category) {
    throw new Error("カテゴリが見つかりません。最初からやり直してください。");
  }

  callbacks.onStep?.("プロンプトを生成中…");
  const quality = diagnoseQuality(categoryId, answers);
  const prompt = buildPrompt(categoryId, answers);

  if (!prompt?.trim()) {
    throw new Error("プロンプトの生成に失敗しました。");
  }

  const title = generateTitle(category.label, answers);
  profiler.mark("完了");

  return {
    prompt,
    quality,
    title,
    category: categoryId,
    categoryLabel: category.label,
    answers: { ...answers },
    metrics: {
      provider: ACTIVE_PROVIDER,
      aiApiCalls: 0,
      networkCalls: 0,
      totalMs: profiler.report().totalMs,
      phases: profiler.report().marks.map((m) => ({
        name: m.name,
        elapsedMs: Math.round(m.elapsed * 10) / 10,
      })),
    },
  };
}

/**
 * 会議連携 — テンプレート生成
 * @param {Object} edits
 * @param {{ onStep?: (msg: string) => void }} [callbacks]
 */
export async function generateMeetingViaProvider(edits, callbacks = {}) {
  const profiler = createProfiler("会議→テンプレート");
  profiler.mark("開始");

  if (!edits.topic?.trim()) {
    throw new Error("議題を入力してください。");
  }

  callbacks.onStep?.("AI会議の内容を整理中…");
  const payload = buildMeetingPromptPayload(edits);
  callbacks.onStep?.("プロンプトを生成中…");

  const prompt = wrapPrompt(structuredPro(payload));
  const quality = diagnoseQuality("agent", {
    purpose: edits.topic,
    feature: "AI会議連携プロンプト",
    role: "ソリューション営業",
    extra_info: [edits.summary, edits.conclusion].filter(Boolean).join("\n").slice(0, 500),
  });

  if (!prompt?.trim()) {
    throw new Error("プロンプトの生成に失敗しました。");
  }

  const title = generateMeetingTitle(edits.topic);
  profiler.mark("完了");

  return {
    prompt,
    quality,
    title,
    category: "agent",
    categoryLabel: "AI会議連携",
    answers: { ...edits },
    metrics: {
      provider: ACTIVE_PROVIDER,
      aiApiCalls: 0,
      networkCalls: 0,
      totalMs: profiler.report().totalMs,
      phases: profiler.report().marks.map((m) => ({
        name: m.name,
        elapsedMs: Math.round(m.elapsed * 10) / 10,
      })),
    },
  };
}
