/**
 * Knowledge — 型定義 & レイヤー構造
 *
 * 美容業界知識・営業ノウハウ・会社独自ルールを拡張可能なレイヤーで管理。
 * 将来: learned レイヤーに成功事例・高評価 Blueprint を蓄積。
 */

/**
 * @typedef {"industry"|"sales"|"company"|"product"|"learned"} KnowledgeLayerId
 */

/**
 * @typedef {Object} KnowledgeItem
 * @property {string} id
 * @property {KnowledgeLayerId} layer
 * @property {string} key
 * @property {string|string[]|Object} value
 * @property {string[]} [tags]
 * @property {string} [source] 出典（domainKnowledge / admin / learned）
 * @property {number} [priority]
 */

/** 将来の学習ナレッジ用プレースホルダー */
export const LEARNED_KNOWLEDGE_ENABLED = false;
