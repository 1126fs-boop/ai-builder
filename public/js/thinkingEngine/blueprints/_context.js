/**
 * Blueprint 共通 — AnalysisContext からの入力解決
 */

/**
 * AnalysisContext エンベロープから Blueprint ビルド用データを取得
 * @param {Object} ctx AnalysisContext エンベロープ
 */
export function resolveBlueprintInputs(ctx) {
  const envelope = ctx?.payload ? ctx : { payload: ctx };
  const { answers, purpose, challenge, knowledge, meta, structure, lensReviews, synthesis, lensCouncil } =
    envelope.payload ?? {};

  return {
    answers: answers ?? {},
    purpose: purpose ?? {},
    challenge: challenge ?? {},
    knowledge: knowledge ?? {},
    structure: structure ?? {},
    creativeBrief: structure?.creativeBrief ?? null,
    lensReviews: lensReviews ?? [],
    synthesis: synthesis ?? {},
    lensCouncil: lensCouncil ?? null,
    meta: meta ?? {},
    contextId: envelope.id ?? null,
  };
}
