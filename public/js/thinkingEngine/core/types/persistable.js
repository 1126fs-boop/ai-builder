/**
 * 保存可能オブジェクト — 共通エンベロープ
 *
 * AnalysisContext / Blueprint / Deliverable はすべて本形式で包む。
 * 将来の学習・ナレッジ化（評価・修正・採用事例）に lineage / extensions を利用する。
 */

/** @typedef {"analysis_context"|"blueprint"|"deliverable"|"generated_prompt"|"knowledge_item"} PersistableType */

export const SCHEMA_VERSION = {
  analysis_context: 1,
  blueprint: 1,
  deliverable: 1,
  generated_prompt: 2,
  knowledge_item: 1,
};

/**
 * @typedef {Object} PersistableLineage
 * @property {string|null} [parentId] 派生元オブジェクト ID
 * @property {string|null} [sessionId] 生成セッション ID
 * @property {Object|null} [feedback] 将来: { rating, comment, ratedAt }
 * @property {Object|null} [adoption] 将来: { adopted, adoptedAt, usedIn }
 * @property {Object|null} [userRevision] 将来: { original, revised, diff }
 * @property {Object|null} [learning] 将来: { promotedToKnowledge, knowledgeItemId }
 */

/**
 * 一意 ID を生成（将来 UUID v4 に差し替え可能）
 * @param {string} prefix
 */
export function generatePersistableId(prefix) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}_${rand}`;
}

/**
 * 保存可能オブジェクトの共通エンベロープを生成
 * @param {Object} config
 */
export function createPersistableEnvelope(config) {
  const {
    type,
    schemaVersion,
    id,
    categoryId,
    useCaseId,
    payload,
    lineage = {},
    extensions = {},
    meta = {},
  } = config;

  return {
    _type: type,
    schemaVersion: schemaVersion ?? SCHEMA_VERSION[type] ?? 1,
    id: id ?? generatePersistableId(type.slice(0, 3)),
    categoryId: categoryId ?? null,
    useCaseId: useCaseId ?? null,
    createdAt: new Date().toISOString(),
    payload,
    lineage: {
      parentId: lineage.parentId ?? null,
      sessionId: lineage.sessionId ?? null,
      feedback: lineage.feedback ?? null,
      adoption: lineage.adoption ?? null,
      userRevision: lineage.userRevision ?? null,
      learning: lineage.learning ?? null,
    },
    extensions,
    meta,
  };
}

/**
 * エンベロープまたはレガシー plain オブジェクトから payload を取得
 * @param {Object} obj
 */
export function unwrapPersistable(obj) {
  if (!obj) return obj;
  if (obj._type && obj.payload !== undefined) return obj.payload;
  return obj;
}

/**
 * JSON シリアライズ（DB / Supabase 保存用）
 * @param {Object} envelope
 */
export function serializePersistable(envelope) {
  return JSON.stringify(envelope);
}

/**
 * JSON デシリアライズ
 * @param {string} json
 */
export function deserializePersistable(json) {
  return JSON.parse(json);
}
