/**
 * GeneratedPrompt — アプリの最終責務（保存可能 v2）
 *
 * 生成AIへ渡すプロンプト束。成果物（提案書・画像等）は生成AI側が作る。
 */

import { createPersistableEnvelope, generatePersistableId } from "./persistable.js";

/**
 * @typedef {Object} PromptBundle
 * @property {string|null} systemPrompt
 * @property {string|null} textPrompt
 * @property {string|null} imagePrompt
 * @property {string|null} negativePrompt
 * @property {string|null} captionPrompt
 */

/**
 * GeneratedPrompt v2 を生成
 * @param {Object} config
 */
export function createGeneratedPrompt(config) {
  const {
    contextId,
    blueprintId,
    categoryId,
    useCaseId,
    prompts,
    imageDirective,
    recommendedAdapters,
    expectedArtifact,
    sessionId,
    id,
    extensions = {},
    meta = {},
  } = config;

  const bundle = normalizePrompts(prompts);

  return createPersistableEnvelope({
    type: "generated_prompt",
    schemaVersion: 2,
    id: id ?? generatePersistableId("gp"),
    categoryId,
    useCaseId,
    payload: {
      prompts: bundle,
      imageDirective: imageDirective ?? null,
      recommendedAdapters: recommendedAdapters ?? ["chatgpt"],
      expectedArtifact: expectedArtifact ?? { type: "text", label: "テキスト成果物" },
    },
    lineage: {
      parentId: blueprintId ?? null,
      sessionId: sessionId ?? null,
    },
    extensions,
    meta: {
      contextId: contextId ?? null,
      blueprintId: blueprintId ?? null,
      ...meta,
    },
  });
}

/** @param {PromptBundle|Object} prompts */
function normalizePrompts(prompts) {
  const p = prompts ?? {};
  return {
    systemPrompt: p.systemPrompt ?? null,
    textPrompt: p.textPrompt ?? null,
    imagePrompt: p.imagePrompt ?? null,
    negativePrompt: p.negativePrompt ?? null,
    captionPrompt: p.captionPrompt ?? null,
  };
}

/**
 * UI / 後方互換 — 表示・コピー用の代表テキスト
 * @param {Object} generatedPrompt エンベロープ
 */
export function getPrimaryPromptText(generatedPrompt) {
  const payload = generatedPrompt?.payload ?? generatedPrompt;
  const prompts = payload?.prompts ?? payload?.content ?? {};

  if (prompts.textPrompt) {
    return prompts.systemPrompt
      ? `# システム\n${prompts.systemPrompt}\n\n# 依頼\n${prompts.textPrompt}`
      : prompts.textPrompt;
  }

  // 画像系: textPrompt が無い場合は caption + image を結合
  const parts = [];
  if (prompts.captionPrompt) parts.push(prompts.captionPrompt);
  if (prompts.imagePrompt) parts.push(`[画像生成]\n${prompts.imagePrompt}`);
  if (parts.length) return parts.join("\n\n---\n\n");

  return payload?.content?.prompt ?? "";
}

/** 後方互換 alias */
export function getDeliverablePromptText(generatedPrompt) {
  return getPrimaryPromptText(generatedPrompt);
}

/** @deprecated createPromptDeliverable の後方互換 */
export function createPromptDeliverable(config) {
  const { prompt, prompts, ...rest } = config;
  const bundle = prompts ?? { textPrompt: prompt ?? "" };
  return createGeneratedPrompt({ ...rest, prompts: bundle });
}

/** @deprecated */
export function createDeliverable(config) {
  return createGeneratedPrompt({
    ...config,
    prompts: config.content ?? { textPrompt: config.content?.prompt ?? "" },
  });
}

/** unwrap */
export function unwrapGeneratedPrompt(gp) {
  return gp?.payload ?? gp;
}
