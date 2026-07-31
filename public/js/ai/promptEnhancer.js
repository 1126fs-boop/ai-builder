/**
 * AI Builder — 高品質プロンプト構築（思考エンジン連携）
 */

import {
  structuredPro,
  DEFAULT_THINKING_PROCESS,
  DEFAULT_EVALUATION_CRITERIA,
  analyzeForPromptEdits,
  thinkingToPromptPayload,
} from "../thinkingEngine/index.js";

export { structuredPro, DEFAULT_THINKING_PROCESS, DEFAULT_EVALUATION_CRITERIA };

/** 編集済み入力からプロンプトペイロードを構築（AI会議モジュール非依存） */
export function buildMeetingPromptPayload(edits) {
  const thinking = analyzeForPromptEdits(edits);
  return thinkingToPromptPayload(thinking, {
    role: "あなたは美容BtoBメーカーの一流ソリューション営業コンサルタント。議論内容を実務プロンプトに変換する専門家",
    mission: `入力内容をもとに、営業現場ですぐ使える最高品質のプロンプト設計書を作成する。テーマ: 「${edits.topic || ""}」`,
    background: thinking.background
      ? `${thinking.background}\n\n【議論詳細】\n${(edits.discussion || "").slice(0, 4000)}`
      : `【議論詳細】\n${(edits.discussion || "").slice(0, 4000)}`,
    context: thinking.context,
    prerequisites: edits.preconditions || thinking.preconditions,
    rules: [
      "入力内容と矛盾しない",
      "具体案を漏れなく反映する",
      "実行ステップを優先順位付きで整理する",
      "営業担当者が明日から使える粒度で書く",
      "KPI・検証方法・注意点を必ず含める",
    ],
    tone: "プロフェッショナルかつ現場感のある日本語。箇条書きと見出しを活用",
  });
}
