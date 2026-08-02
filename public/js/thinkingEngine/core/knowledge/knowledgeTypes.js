/**
 * Knowledge Types — 学習・レイヤー定義
 */

/** 学習ナレッジを AnalysisContext / Blueprint へ反映 */
export const LEARNED_KNOWLEDGE_ENABLED = true;

/** 高評価とみなす品質スコア閾値（0〜100） */
export const HIGH_RATED_SCORE_THRESHOLD = 80;

/**
 * @typedef {"industry"|"sales"|"company"|"product"|"learned"|"domain"} KnowledgeLayerId
 */

/**
 * @typedef {Object} KnowledgeItem
 * @property {string} id
 * @property {KnowledgeLayerId} layer
 * @property {string} key
 * @property {string|string[]|Object} value
 * @property {string[]} [tags]
 * @property {string} [source]
 * @property {number} [priority]
 */
