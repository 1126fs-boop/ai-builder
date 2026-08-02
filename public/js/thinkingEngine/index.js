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

/** 提案書 — ギャップ分析（後方互換） */
export function analyzeProposalGaps(answers) {
  return analyzeDeliverableGaps("proposal", answers);
}

/** 全 Blueprint カテゴリ — ギャップ分析 */
export function analyzeDeliverableGaps(categoryId, answers) {
  return runThinking({
    client: CLIENT.PROMPT,
    scenario: SCENARIO.PROMPT.GAP,
    input: { categoryId, answers },
  });
}

/** 提案書 — 成果物生成（後方互換） */
export function buildProposalDeliverable(answers) {
  return buildDeliverable("proposal", answers);
}

/** 全 Blueprint カテゴリ — 成果物生成 */
export function buildDeliverable(categoryId, answers) {
  return runThinking({
    client: CLIENT.PROMPT,
    scenario: SCENARIO.PROMPT.DELIVERABLE,
    input: { categoryId, answers },
  });
}

export { hasSchemaFlow, runGapAnalysis, getSeedQuestions } from "./schemas/index.js";

export { runAnalysisPipeline, runWizardAnalysis } from "./core/pipeline/analysisPipeline.js";
export { runDeliverablePipeline } from "./core/pipeline/deliverablePipeline.js";
export {
  createAnalysisContext,
  unwrapAnalysisContext,
} from "./core/types/analysisContext.js";
export { createBlueprint, unwrapBlueprint } from "./core/types/blueprint.js";
export {
  createGeneratedPrompt,
  createPromptDeliverable,
  getPrimaryPromptText,
  getDeliverablePromptText,
  unwrapGeneratedPrompt,
} from "./core/types/generatedPrompt.js";
export {
  serializePersistable,
  deserializePersistable,
  generatePersistableId,
} from "./core/types/persistable.js";
export {
  registerKnowledgeItem,
  registerCompanyRule,
  buildKnowledgeSnapshot,
  buildFullKnowledgeBlock,
  listKnowledgeItems,
} from "./core/knowledge/knowledgeRegistry.js";
export {
  applyKnowledgeToBlueprint,
  enrichBlueprintWithKnowledge,
  formatAppliedHintsForPrompt,
} from "./core/knowledge/knowledgeApplicator.js";
export {
  getDomainKnowledgeForCategory,
  buildDomainKnowledgeBlock,
  DOMAIN_REGISTRY,
} from "./core/knowledge/industryKnowledgeBase.js";
export {
  getSeasonalContext,
  buildCategoryPlaybookBlock,
  NEWSLETTER_PLAYBOOK,
  PROPOSAL_PLAYBOOK,
  SALES_PLAYBOOK,
  POP_PLAYBOOK,
} from "./core/knowledge/categoryPlaybooks.js";
export {
  getCategoryKnowledgeMeta,
  buildCategoryKnowledgeBlock,
  buildCategoryKnowledgeSnapshot,
  CATEGORY_KB_META,
} from "./core/knowledge/categoryKnowledgeRegistry.js";
export {
  fetchTrendsKnowledge,
  initTrendsKnowledge,
  registerTrendUpdate,
  buildTrendsKnowledgeBlock,
  getTrendsForCategorySync,
} from "./core/knowledge/trendsKnowledgeStore.js";
export {
  registerSuccessCase,
  registerUserRevision,
  registerHighRatedPrompt,
  registerIndustryInsight,
  getLearnedInsightsForAnalysis,
  listLearningRecords,
  getLearningStats,
  getCategoryLearningStats,
  initLearningRegistry,
  learnFromGeneration,
  learnFromSave,
  learnFromUserEdit,
} from "./core/knowledge/learningRegistry.js";
export { runQualityGate, QUALITY_PASS_THRESHOLD } from "./core/quality/rubricFramework.js";
export {
  getCategoryRubricProfile,
  buildRubricQualityBlock,
  learnRubricFromQualityGate,
  learnRubricFromUserEdit,
  learnRubricFromHighRating,
} from "./core/quality/rubricLearningRegistry.js";
export { CATEGORY_RUBRIC_PROFILES, getBaseRubricProfile } from "./core/quality/categoryRubricProfiles.js";
export {
  buildAnalysisIntelligence,
  formatAnalysisIntelligenceSummary,
} from "./core/analyzers/analysisIntelligence.js";
export { buildHandoff, buildImageGenerationHandoff, getAdapter, listAdapters } from "./adapters/registry.js";

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
