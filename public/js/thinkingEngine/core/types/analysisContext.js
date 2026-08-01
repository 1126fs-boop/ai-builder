/**
 * AnalysisContext — 思考分析の中間成果物（保存可能）
 */

import { createPersistableEnvelope, generatePersistableId } from "./persistable.js";

/**
 * @typedef {Object} PurposeAnalysis
 * @property {string} primaryGoal
 * @property {string} audience
 * @property {string} deliverableType
 * @property {string[]} successCriteria
 * @property {string} tone
 * @property {string[]} constraints
 */

/**
 * @typedef {Object} ChallengeAnalysis
 * @property {string} surfaceChallenge
 * @property {string} rootCause
 * @property {string} impact
 * @property {string} industry
 * @property {string} industryContext
 * @property {string} beforeHypothesis
 * @property {string} afterHypothesis
 * @property {string[]} kpiCandidates
 * @property {number} confidence 0〜1
 */

/**
 * @typedef {Object} GapAnalysis
 * @property {import("../../schemas/types.js").SchemaQuestion[]} followUpQuestions
 * @property {Object} inferredAnswers
 * @property {boolean} canGenerate
 * @property {boolean} canProceedToBlueprint
 * @property {number} qualityScore
 * @property {number} analysisConfidence
 * @property {string[]} missingCritical
 * @property {string[]} missingOptional
 */

/**
 * @typedef {Object} KnowledgeSnapshot
 * @property {string[]} industryFacts
 * @property {string[]} challengePatterns
 * @property {Object|null} productKnowledge
 * @property {string[]} salesPrinciples
 * @property {string[]} antiPatterns
 * @property {string[]} companyRules
 * @property {Object[]} refs 将来: 参照したナレッジ item ID 一覧
 */

/**
 * @typedef {Object} AnalysisContextPayload
 * @property {Object} answers マージ済みユーザー回答
 * @property {PurposeAnalysis} purpose
 * @property {ChallengeAnalysis} challenge
 * @property {GapAnalysis} gap
 * @property {KnowledgeSnapshot} knowledge
 * @property {Object} meta フェーズ実行ログ
 */

/**
 * AnalysisContext を生成
 * @param {Object} config
 * @returns {import("./persistable.js") & { payload: AnalysisContextPayload }}
 */
export function createAnalysisContext(config) {
  const {
    categoryId,
    useCaseId,
    answers,
    purpose,
    challenge,
    gap,
    knowledge,
    meta = {},
    id,
    sessionId,
    extensions = {},
  } = config;

  return createPersistableEnvelope({
    type: "analysis_context",
    id: id ?? generatePersistableId("ctx"),
    categoryId,
    useCaseId,
    payload: {
      answers: answers ?? {},
      purpose: purpose ?? {},
      challenge: challenge ?? {},
      gap: gap ?? {},
      knowledge: knowledge ?? {
        industryFacts: [],
        challengePatterns: [],
        productKnowledge: null,
        salesPrinciples: [],
        antiPatterns: [],
        companyRules: [],
        refs: [],
      },
      meta: {
        engineVersion: "phase-a",
        phases: meta.phases ?? [],
        completedAt: meta.completedAt ?? null,
        ...meta,
      },
    },
    lineage: { sessionId: sessionId ?? null },
    extensions,
  });
}

/** @param {Object} ctx AnalysisContext エンベロープ */
export function unwrapAnalysisContext(ctx) {
  return ctx?.payload ?? ctx;
}
