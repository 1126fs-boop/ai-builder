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
    structure: structure ?? meta?.structure ?? {},
    creativeBrief: structure?.creativeBrief ?? null,
    lensReviews: lensReviews ?? [],
    synthesis: synthesis ?? {},
    lensCouncil: lensCouncil ?? null,
    meta: meta ?? {},
    contextId: envelope.id ?? null,
  };
}

/** Blueprint に戦略設計・意図分析を付与 */
export function attachStrategicFields(blueprint, inputs) {
  const { structure, purpose } = inputs;
  return {
    ...blueprint,
    strategicBlueprint: structure?.strategicBlueprint ?? blueprint.strategicBlueprint ?? null,
    strategicIntent: purpose?.strategicIntent ?? blueprint.strategicIntent ?? null,
    narrativeArc: blueprint.narrativeArc ?? structure?.narrativeArc ?? null,
    copyStrategy: blueprint.copyStrategy ?? structure?.copyStrategy ?? null,
  };
}
