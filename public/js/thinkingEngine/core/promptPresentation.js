/**
 * プロンプト表示・Handoff 統合
 *
 * 画像クリエイティブ系は UI / ChatGPT / 合成API が同一 GeneratedPrompt を参照する。
 */

import { getPrimaryPromptText, unwrapGeneratedPrompt } from "./types/generatedPrompt.js";
import { buildHandoff } from "../adapters/registry.js";

/** @param {string} [useCaseId] */
export function isImageCreativeUseCase(useCaseId) {
  return useCaseId === "sns_image" || useCaseId === "pop_promo";
}

/**
 * 結果画面の表示・コピー用テキスト
 * 画像系は ChatGPT Handoff 全文（背景+レイアウト+公式URL）を表示
 * @param {Object} generatedPrompt
 */
export function getResultDisplayPromptText(generatedPrompt) {
  if (!generatedPrompt) return "";
  const meta = generatedPrompt.meta ?? {};
  const payload = unwrapGeneratedPrompt(generatedPrompt);
  const useCaseId = generatedPrompt.useCaseId ?? meta.useCaseId ?? payload.useCaseId;

  if (isImageCreativeUseCase(useCaseId)) {
    return buildHandoff(generatedPrompt, "chatgpt").text;
  }
  return getPrimaryPromptText(generatedPrompt);
}

/**
 * ChatGPT Handoff 用 — ユーザー編集を text 部分のみ反映し、画像ブロックは維持
 * @param {Object} generatedPrompt
 * @param {string} [userEditedText]
 */
export function getChatGptHandoffText(generatedPrompt, userEditedText) {
  const handoff = buildHandoff(generatedPrompt, "chatgpt");
  const full = handoff.text;
  const edited = userEditedText?.trim();

  if (!edited || edited === full) return full;

  const imageMarker = "# 画像生成指示";
  const markerIdx = full.indexOf(imageMarker);
  if (markerIdx === -1) return edited;

  const imageBlock = full.slice(markerIdx);
  if (edited.includes(imageMarker)) return edited;

  return `${edited}\n\n---\n\n${imageBlock}`;
}

/**
 * 合成API / 将来 GPT Image API 用 — imageDirective を Single Source of Truth として返す
 * @param {Object} generatedPrompt
 */
export function getImageCompositePayload(generatedPrompt) {
  const payload = unwrapGeneratedPrompt(generatedPrompt);
  return {
    imagePrompt: payload.prompts?.imagePrompt ?? "",
    negativePrompt: payload.prompts?.negativePrompt ?? "",
    textPrompt: payload.prompts?.textPrompt ?? "",
    captionPrompt: payload.prompts?.captionPrompt ?? "",
    imageDirective: payload.imageDirective ?? null,
  };
}
