/**
 * 提案書 — 分析パイプライン（後方互換ラッパー）
 *
 * 実装は deliverablePipeline に統合済み。
 */

import { runGapAnalysis } from "../../schemas/index.js";
import { runDeliverablePipeline } from "./deliverablePipeline.js";

export function runProposalGapAnalysis(answers) {
  return runGapAnalysis("proposal", answers);
}

export function runProposalPipeline(answers) {
  return runDeliverablePipeline("proposal", answers);
}
