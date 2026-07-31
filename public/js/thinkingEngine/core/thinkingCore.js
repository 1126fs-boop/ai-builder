/**
 * 思考エンジン — コア（6要素の組み立て）
 */

import {
  DEFAULT_THINKING_PROCESS,
  DEFAULT_EVALUATION_CRITERIA,
} from "../domainKnowledge.js";
import { buildStructureFromThinking } from "../sectionBuilder.js";

/**
 * 思考分析結果を統一形式で組み立てる
 * @param {Object} partial
 */
export function assembleThinkingResult(partial) {
  const base = {
    purpose: partial.purpose || "",
    missingInfo: partial.missingInfo || [],
    constraints: partial.constraints || "",
    outputFormat: partial.outputFormat || "",
    improvements: partial.improvements || [],
    thinkingProcess: partial.thinkingProcess || DEFAULT_THINKING_PROCESS,
    evaluationCriteria: partial.evaluationCriteria || DEFAULT_EVALUATION_CRITERIA,
    notes: partial.notes || "",
    background: partial.background,
    context: partial.context,
    preconditions: partial.preconditions,
    output: partial.output,
    meta: partial.meta,
  };
  base.promptStructure = buildStructureFromThinking(base);
  return base;
}
