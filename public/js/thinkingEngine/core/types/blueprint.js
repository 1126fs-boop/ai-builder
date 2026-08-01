/**
 * DeliverableBlueprint — 成果物設計図（保存可能）
 */

import { createPersistableEnvelope, generatePersistableId, unwrapPersistable } from "./persistable.js";

/**
 * Blueprint エンベロープを生成
 * @param {Object} config
 */
export function createBlueprint(config) {
  const {
    contextId,
    categoryId,
    useCaseId,
    payload,
    quality,
    sessionId,
    id,
    extensions = {},
    meta = {},
  } = config;

  const envelope = createPersistableEnvelope({
    type: "blueprint",
    id: id ?? generatePersistableId("bp"),
    categoryId,
    useCaseId,
    payload: {
      ...payload,
      quality: quality ?? payload?.quality ?? null,
    },
    lineage: {
      parentId: contextId ?? null,
      sessionId: sessionId ?? null,
    },
    extensions,
    meta: {
      contextId: contextId ?? null,
      ...meta,
    },
  });

  return envelope;
}

/**
 * Renderer 互換: エンベロープまたは plain から設計内容を取得
 * @param {Object} blueprint
 */
export function unwrapBlueprint(blueprint) {
  return unwrapPersistable(blueprint);
}
