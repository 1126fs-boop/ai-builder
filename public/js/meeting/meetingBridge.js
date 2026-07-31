/**
 * AI会議 → プロンプト生成 連携ブリッジ
 */

import { buildMeetingTransferPayload } from "../ai/contentFramework.js";

export const MEETING_PROMPT_KEY = "aibuilder_meeting_prompt_transfer";

/** 会議結果をプロンプト生成用に保存（キャッシュ済みペイロードがあれば再利用） */
export function saveMeetingForPrompt(meetingResult, cachedPayload = null) {
  const payload = cachedPayload || buildMeetingTransferPayload(meetingResult);
  sessionStorage.setItem(MEETING_PROMPT_KEY, JSON.stringify({ ...payload, savedAt: Date.now() }));
  return payload;
}

export function loadMeetingForPrompt() {
  try {
    const raw = sessionStorage.getItem(MEETING_PROMPT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearMeetingForPrompt() {
  sessionStorage.removeItem(MEETING_PROMPT_KEY);
}

export function navigateToPromptGeneration() {
  window.location.href = "/index.html?fromMeeting=1";
}
