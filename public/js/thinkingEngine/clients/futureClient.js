/**
 * 思考エンジン — 将来機能用クライアント（スタブ）
 *
 * 営業分析・文章作成・企画作成など、将来追加する機能向けの拡張ポイント。
 */

import { assembleThinkingResult } from "../core/thinkingCore.js";

function notImplemented(client, scenario) {
  return assembleThinkingResult({
    purpose: `${client} / ${scenario} — 未実装`,
    missingInfo: ["機能実装待ち"],
    constraints: "- テンプレートエンジンのみ対応",
    outputFormat: "未定",
    improvements: ["将来のクライアント実装で本メソッドを差し替える"],
    notes: "このシナリオは将来実装予定です。",
    output: null,
    meta: { client, scenario, stub: true },
  });
}

/** 営業分析 — 将来実装 */
export function runAnalysisReport(input) {
  return notImplemented("analysis", "report");
}

/** 文章作成 — 将来実装 */
export function runDocumentDraft(input) {
  return notImplemented("document", "draft");
}

/** 企画作成 — 将来実装 */
export function runPlanningProposal(input) {
  return notImplemented("planning", "proposal");
}
