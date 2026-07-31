/**
 * 思考エンジン — クライアント登録表
 *
 * client + scenario → ハンドラー
 * 新機能追加時はここに登録する。
 */

import { CLIENT, SCENARIO } from "../types.js";
import * as meetingClient from "./meetingClient.js";
import * as promptClient from "./promptClient.js";
import * as futureClient from "./futureClient.js";

/** @type {Map<string, Function>} */
const HANDLERS = new Map([
  [`${CLIENT.MEETING}:${SCENARIO.MEETING.ROUND}`, (input) => meetingClient.runRound(input)],
  [`${CLIENT.MEETING}:${SCENARIO.MEETING.CONCLUSION}`, (input) => meetingClient.runConclusion(input)],
  [`${CLIENT.MEETING}:${SCENARIO.MEETING.TRANSFER}`, (input) => meetingClient.runTransfer(input)],

  [`${CLIENT.PROMPT}:${SCENARIO.PROMPT.WIZARD}`, (input) => promptClient.runWizard(input)],
  [`${CLIENT.PROMPT}:${SCENARIO.PROMPT.EDITS}`, (input) => promptClient.runEdits(input)],
  [`${CLIENT.PROMPT}:${SCENARIO.PROMPT.TO_PAYLOAD}`, (input) => promptClient.runToPayload(input)],
  [`${CLIENT.PROMPT}:${SCENARIO.PROMPT.GAP}`, (input) => promptClient.runProposalGap(input)],
  [`${CLIENT.PROMPT}:${SCENARIO.PROMPT.PROPOSAL_DELIVERABLE}`, (input) => promptClient.runProposalDeliverable(input)],

  [`${CLIENT.ANALYSIS}:${SCENARIO.ANALYSIS.REPORT}`, (input) => futureClient.runAnalysisReport(input)],
  [`${CLIENT.DOCUMENT}:${SCENARIO.DOCUMENT.DRAFT}`, (input) => futureClient.runDocumentDraft(input)],
  [`${CLIENT.PLANNING}:${SCENARIO.PLANNING.PROPOSAL}`, (input) => futureClient.runPlanningProposal(input)],
]);

/**
 * ハンドラーを取得
 * @param {string} client
 * @param {string} scenario
 */
export function resolveHandler(client, scenario) {
  const key = `${client}:${scenario}`;
  const handler = HANDLERS.get(key);
  if (!handler) {
    throw new Error(`未登録の思考シナリオ: ${key}`);
  }
  return handler;
}

/** 登録済みシナリオ一覧（デバッグ用） */
export function listRegisteredScenarios() {
  return [...HANDLERS.keys()];
}

/**
 * 新シナリオを登録（将来のプラグイン拡張用）
 * @param {string} client
 * @param {string} scenario
 * @param {Function} handler
 */
export function registerScenario(client, scenario, handler) {
  HANDLERS.set(`${client}:${scenario}`, handler);
}
