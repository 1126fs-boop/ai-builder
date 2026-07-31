/**
 * AI会議 — 履歴保存（localStorage・既存 storage.js とは独立）
 */

import { SAVED_EMAIL_KEY } from "../supabaseClient.js";

const STORAGE_KEY = "aibuilder_v1_meetings";
const MAX_MEETINGS = 50;

/** ユーザーごとにキーを分離（storage.js と同じパターン） */
function storageKey() {
  const email = localStorage.getItem(SAVED_EMAIL_KEY);
  if (!email) return STORAGE_KEY;
  const suffix = email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `${STORAGE_KEY}_${suffix}`;
}

function readAll() {
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(meetings) {
  localStorage.setItem(storageKey(), JSON.stringify(meetings));
}

/** 一意 ID 生成 */
function generateId() {
  return `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 会議結果を保存
 * @param {object} data
 */
export function saveMeeting(data) {
  const meetings = readAll();
  const record = {
    id: data.id || generateId(),
    title: data.title,
    datetime: data.datetime || new Date().toISOString(),
    selectedRoleIds: data.selectedRoleIds,
    selectedRoleNames: data.selectedRoleNames,
    messages: data.messages,
    conclusion: data.conclusion,
    version: "1.0",
  };

  meetings.unshift(record);
  if (meetings.length > MAX_MEETINGS) meetings.length = MAX_MEETINGS;
  writeAll(meetings);
  return record;
}

/** 全会議履歴を取得（新しい順） */
export function getMeetings() {
  return readAll();
}

/** ID で1件取得 */
export function getMeetingById(id) {
  return readAll().find((m) => m.id === id) ?? null;
}

/** 会議を削除 */
export function deleteMeeting(id) {
  const filtered = readAll().filter((m) => m.id !== id);
  writeAll(filtered);
}

/** 日時を表示用にフォーマット */
export function formatMeetingDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
