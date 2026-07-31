/**
 * AI会議 — 3ラウンド深層議論エンジン
 * （思考エンジン利用 — プロンプト生成とは独立）
 */

import {
  analyzeForMeetingRound,
  analyzeForMeetingConclusion,
  ROUND_TYPES,
  MIN_DISCUSSION_ROUNDS,
} from "../thinkingEngine/index.js";
import { createProfiler, yieldToMain } from "./performanceProfiler.js";

export function generateRoundOpinion(role, topic, round, previousMessages) {
  const { content, roundLabel } = analyzeForMeetingRound({
    role,
    topic,
    round,
    previousMessages,
  });

  return {
    roleId: role.id,
    roleName: role.name,
    roleIcon: role.icon,
    roleColor: role.color,
    round,
    roundLabel,
    content,
    order: previousMessages.length + 1,
  };
}

export function generateDeepConclusion(topic, messages) {
  const { content, facilitator } = analyzeForMeetingConclusion({ topic, messages });

  return {
    roleId: facilitator?.id ?? "facilitator",
    roleName: facilitator?.name ?? "ファシリテーターAI",
    roleIcon: facilitator?.icon ?? "🎯",
    roleColor: facilitator?.color ?? "#4f46e5",
    round: MIN_DISCUSSION_ROUNDS + 1,
    roundLabel: "総合結論",
    content,
    order: messages.length + 1,
    isConclusion: true,
  };
}

/**
 * 3ラウンド深層議論を実行
 */
export async function runDeepMeeting(topic, discussionRoles, onMessage, onProgress, options = {}) {
  const { onRoleProgress, yieldPerMessage = true } =
    typeof options === "number" ? { yieldPerMessage: true } : options;

  const profiler = createProfiler("AI会議");
  profiler.mark("開始");

  const messages = [];

  for (let round = 1; round <= MIN_DISCUSSION_ROUNDS; round++) {
    onProgress?.(ROUND_TYPES[round].label);
    profiler.mark(`ラウンド${round} 開始`);

    for (const role of discussionRoles) {
      onRoleProgress?.({ role, round, phase: "analyzing" });
      onProgress?.(`${role.name}が分析中…`);

      const opinion = generateRoundOpinion(role, topic, round, messages);
      messages.push(opinion);

      onRoleProgress?.({ role, round, phase: "displaying" });
      onMessage(opinion);

      if (yieldPerMessage) await yieldToMain();
    }

    profiler.mark(`ラウンド${round} 完了`);
  }

  onRoleProgress?.({ role: { name: "ファシリテーターAI" }, round: MIN_DISCUSSION_ROUNDS + 1, phase: "integrating" });
  onProgress?.("ファシリテーターが統合中…");

  const conclusion = generateDeepConclusion(topic, messages);
  onMessage(conclusion);

  profiler.mark("ファシリテーター統合完了");
  profiler.report();

  return { messages, conclusion };
}
