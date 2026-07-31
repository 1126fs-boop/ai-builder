/**
 * 思考エンジン — アプリ共通公開 API
 *
 * AI会議・プロンプト生成・将来機能はすべて本モジュールのクライアントとして利用する。
 * 各機能モジュール同士の直接依存は禁止。
 *
 * 将来 OpenAI 導入時: ACTIVE_ENGINE を切り替え、providers のみ差し替え。
 */

import { CLIENT, SCENARIO } from "./types.js";
import { run as templateRun } from "./providers/templateProvider.js";
import { registerScenario, listRegisteredScenarios } from "./clients/registry.js";

/** @typedef {"template"|"openai"} ThinkingEngineId */

export { CLIENT, SCENARIO, registerScenario, listRegisteredScenarios };

/** 使用中の思考エンジン */
export const ACTIVE_ENGINE = "template";

const PROVIDERS = {
  template: templateRun,
};

function getProvider() {
  const fn = PROVIDERS[ACTIVE_ENGINE];
  if (!fn) throw new Error(`未対応の思考エンジン: ${ACTIVE_ENGINE}`);
  return fn;
}

/**
 * 思考分析の統一エントリポイント
 * @param {import("./types.js").ThinkingRequest} request
 * @returns {import("./types.js").ThinkingResult}
 */
export function runThinking(request) {
  if (!request?.client || !request?.scenario) {
    throw new Error("runThinking: client と scenario が必要です");
  }
  return getProvider()(request);
}

// ── 後方互換 API（既存クライアント向け） ──

export function analyzeForWizard(categoryId, answers) {
  return runThinking({
    client: CLIENT.PROMPT,
    scenario: SCENARIO.PROMPT.WIZARD,
    input: { categoryId, answers },
  });
}

export function analyzeForPromptEdits(edits) {
  return runThinking({
    client: CLIENT.PROMPT,
    scenario: SCENARIO.PROMPT.EDITS,
    input: edits,
  });
}

export function thinkingToPromptPayload(thinking, extras = {}) {
  return runThinking({
    client: CLIENT.PROMPT,
    scenario: SCENARIO.PROMPT.TO_PAYLOAD,
    input: { thinking },
    meta: { extras },
  });
}

export function analyzeForMeetingRound(params) {
  const result = runThinking({
    client: CLIENT.MEETING,
    scenario: SCENARIO.MEETING.ROUND,
    input: params,
  });
  return result.output;
}

export function analyzeForMeetingConclusion(params) {
  const result = runThinking({
    client: CLIENT.MEETING,
    scenario: SCENARIO.MEETING.CONCLUSION,
    input: params,
  });
  return result.output;
}

export function buildMeetingTransferPayload(meetingResult) {
  const result = runThinking({
    client: CLIENT.MEETING,
    scenario: SCENARIO.MEETING.TRANSFER,
    input: meetingResult,
  });
  return result.output;
}

// ── 共通ユーティリティ ──

export {
  formatDiscussionSections,
  structuredPro,
  buildStructureFromThinking,
} from "./sectionBuilder.js";

export {
  DEFAULT_THINKING_PROCESS,
  DEFAULT_EVALUATION_CRITERIA,
  BASE_RULES,
  CHALLENGE_IMPACT,
  INDUSTRY_CONTEXT,
  FORMAT_INSTRUCTIONS,
  ROLE_EXPERTISE,
  ROUND_TYPES,
  MIN_DISCUSSION_ROUNDS,
  STANCE_LABELS,
} from "./domainKnowledge.js";

export {
  pickReferenceMessages,
  pickStance,
  summarizeDiscussion,
} from "./clients/meetingClient.js";
