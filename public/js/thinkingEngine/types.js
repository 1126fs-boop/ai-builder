/**
 * 思考エンジン — 型定義・定数
 *
 * アプリ全体で共通利用。各機能は client + scenario でエンジンを呼び出す。
 */

/** 登録済みクライアント ID */
export const CLIENT = {
  MEETING: "meeting",
  PROMPT: "prompt",
  /** 将来: 営業分析 */
  ANALYSIS: "analysis",
  /** 将来: 文章作成 */
  DOCUMENT: "document",
  /** 将来: 企画作成 */
  PLANNING: "planning",
};

/** クライアント別シナリオ ID */
export const SCENARIO = {
  MEETING: {
    ROUND: "round",
    CONCLUSION: "conclusion",
    TRANSFER: "transfer",
  },
  PROMPT: {
    WIZARD: "wizard",
    EDITS: "edits",
    TO_PAYLOAD: "to-payload",
    GAP: "gap",
    PROPOSAL_DELIVERABLE: "proposal-deliverable",
  },
  ANALYSIS: {
    REPORT: "report",
  },
  DOCUMENT: {
    DRAFT: "draft",
  },
  PLANNING: {
    PROPOSAL: "proposal",
  },
};

/**
 * @typedef {Object} ThinkingRequest
 * @property {string} client
 * @property {string} scenario
 * @property {Object} input
 * @property {Object} [meta]
 */

/**
 * @typedef {Object} ThinkingResult
 * @property {string} purpose
 * @property {string[]} missingInfo
 * @property {string} constraints
 * @property {string} outputFormat
 * @property {string[]} improvements
 * @property {Object[]} promptStructure
 * @property {string} thinkingProcess
 * @property {string} evaluationCriteria
 * @property {string} [notes]
 * @property {Object} [output]
 * @property {Object} [meta]
 */
