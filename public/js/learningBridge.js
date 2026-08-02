/**
 * 学習ブリッジ — アプリイベント → Learning Registry（カテゴリ別）
 */

import {
  initLearningRegistry,
  learnFromGeneration,
  learnFromSave,
  learnFromUserEdit,
} from "./thinkingEngine/core/knowledge/learningRegistry.js";
import { initTrendsKnowledge } from "./thinkingEngine/core/knowledge/trendsKnowledgeStore.js";

let ready = false;

/** アプリ起動時に呼ぶ */
export function initLearning() {
  if (ready) return;
  initLearningRegistry();
  initTrendsKnowledge();
  ready = true;
}

/** プロンプト生成完了時 */
export function onPromptGenerated(result) {
  initLearning();
  if (!result) return;

  learnFromGeneration({
    categoryId: result.category,
    prompt: result.prompt,
    quality: result.quality,
    answers: result.answers,
    pattern: null,
  });
}

/** AI 保存完了時 */
export function onPromptSaved(item, options = {}) {
  initLearning();
  if (!item) return;
  learnFromSave(item, options);
}

/** お気に入り切替時 */
export function onFavoriteChanged(item, isFavorite) {
  initLearning();
  if (!item || !isFavorite) return;
  learnFromSave({ ...item, isFavorite: true }, { isFavorite: true });
}

/**
 * ユーザーが修正・採用したプロンプトを学習（カテゴリ別）
 * @param {{ categoryId: string, original: string, revised: string, action?: string }} event
 */
export function onPromptAdopted(event) {
  initLearning();
  if (!event?.categoryId || !event?.revised) return;
  learnFromUserEdit(event);
}
