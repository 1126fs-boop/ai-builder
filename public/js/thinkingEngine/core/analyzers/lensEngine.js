/**
 * フェーズ5 — 多視点レビュー → 統合（Multi Agent Lens Council）
 *
 * thinkingCore 内部で専門 Lens が議論し、AnalysisContext 用の
 * lensReviews / synthesis を生成する。外部 API は変更しない。
 */

import { runLensCouncil } from "./lensCouncil.js";
import { runCouncilQualityLoop } from "../quality/councilQualityGate.js";

export { getLensPanelForCategory, CATEGORY_LENS_PANELS, LENS_DEFINITIONS } from "./lensRegistry.js";
export { runLensCouncil } from "./lensCouncil.js";

/**
 * @param {string} categoryId
 * @param {Object} input
 * @param {Object} input.purpose
 * @param {Object} input.challenge
 * @param {Object} input.knowledge
 * @param {{ enableQualityLoop?: boolean, maxQualityIterations?: number }} [options]
 */
export function runLensEngine(categoryId, input, options = {}) {
  const enableQualityLoop = options.enableQualityLoop !== false;

  if (!enableQualityLoop) {
    const result = runLensCouncil(categoryId, input);
    return {
      lensReviews: result.lensReviews,
      synthesis: result.synthesis,
      council: result.council,
    };
  }

  const loopResult = runCouncilQualityLoop(categoryId, input, {
    maxIterations: options.maxQualityIterations,
    runCouncil: (catId, inp, councilOpts) => runLensCouncil(catId, inp, councilOpts),
  });

  return {
    lensReviews: loopResult.lensReviews,
    synthesis: loopResult.synthesis,
    council: {
      ...loopResult.council,
      qualityGate: loopResult.qualityGate,
      qualityHistory: loopResult.qualityHistory,
      qualityPassed: loopResult.qualityPassed,
      councilIterations: loopResult.councilIterations,
    },
  };
}
