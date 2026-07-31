/**
 * Question Schema — 型定義
 *
 * 用途ごとの Seed / Dynamic / Infer 質問設計
 */

/**
 * @typedef {"choice"|"choice_with_custom"|"text"} SchemaQuestionType
 */

/**
 * @typedef {Object} SchemaQuestion
 * @property {string} id
 * @property {string} text
 * @property {SchemaQuestionType} type
 * @property {string[]} [options]
 * @property {string} [placeholder]
 * @property {boolean} [optional]
 * @property {string} [hint]
 * @property {"critical"|"high"|"medium"} [qualityImpact]
 */

/**
 * @typedef {Object} DynamicRule
 * @property {string} questionId
 * @property {number} priority
 * @property {(answers: Object) => boolean} when
 * @property {string} reason
 */

/**
 * @typedef {Object} UseCaseSchema
 * @property {string} useCaseId
 * @property {string} categoryId
 * @property {string} label
 * @property {SchemaQuestion[]} seedQuestions
 * @property {Record<string, SchemaQuestion>} dynamicQuestions
 * @property {DynamicRule[]} dynamicRules
 * @property {number} maxDynamicQuestions
 * @property {(answers: Object) => Object} [inferDefaults]
 * @property {(answers: Object, pendingDynamic: number) => number} [estimateQuality]
 */

/**
 * @typedef {Object} GapAnalysisResult
 * @property {SchemaQuestion[]} followUpQuestions
 * @property {Object} inferredAnswers
 * @property {boolean} canGenerate
 * @property {number} qualityScore
 * @property {string[]} missingCritical
 */
