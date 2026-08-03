/**
 * 提案書 — Prompt Builder
 */

import { unwrapBlueprint } from "../core/types/blueprint.js";
import {
  buildSystemPrompt,
  formatSynthesisHints,
  buildKnowledgePromptBlock,
  buildAnalysisReflectionBlock,
  buildPromptCraftBlock,
  buildSelfReviewInstructionsBlock,
  formatQualityRetryHints,
  DEFAULT_CONSTRAINTS,
  resolveCategoryFromBlueprint,
} from "./_shared.js";

/**
 * @param {Object} blueprint エンベロープまたは payload
 */
export function buildProposalPrompts(blueprint) {
  const bp = unwrapBlueprint(blueprint);
  const purpose = bp.purpose ?? {};
  const challenge = bp.challenge ?? {};
  const knowledge = bp.knowledgeRefs ? {} : {};
  const synthesis = bp.synthesis ?? {};

  const measuresBlock = (bp.measures || [])
    .map((m) => `${m.priority}. ${m.title}\n   ${m.body}`)
    .join("\n");
  const objectionsBlock = (bp.objections || [])
    .map((o) => `Q: ${o.concern}\nA: ${o.response}`)
    .join("\n\n");
  const chaptersBlock = (bp.chapters || []).map((c, i) => `${i + 1}. ${c}`).join("\n");
  const knowledgeBlock = buildKnowledgePromptBlock(bp);
  const categoryId = resolveCategoryFromBlueprint(bp);
  const retryBlock = formatQualityRetryHints(bp);
  const analysisBlock = buildAnalysisReflectionBlock(bp);
  const craftBlock = buildPromptCraftBlock(categoryId);

  const roiBlock = (bp.roiSection || []).map((r) => `- ${r}`).join("\n");
  const implBlock = (bp.implementationPhases || []).map((p) => `- ${p}`).join("\n");
  const kpiBlock = (bp.kpiExamples || []).map((k) => `- ${k}`).join("\n");
  const diffBlock = (bp.differentiationPoints || []).map((d) => `- ${d}`).join("\n");

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB（サロン・クリニック向け）の提案書作成プロフェッショナル",
    mission: purpose.primaryGoal || `${bp.industry}向け提案書を作成`,
    constraints: [
      ...DEFAULT_CONSTRAINTS,
      "商品カタログではなく経営改善提案書として書く",
      "冒頭は取引先の課題への共感から入る",
      "ROI・回収期間・KPIを数字で明示（不明は【】プレースホルダー）",
      "競合差別化は経営課題解決の切り口で",
    ],
    companyRules: bp.constraintsSummary?.split("\n").filter(Boolean) ?? [],
  });

  const textPrompt = `# 依頼
以下の条件で、取引先に提出できる提案書を、美容業界プロが書いたレベルの品質で作成してください。

${knowledgeBlock}

${retryBlock}

# thinkingCore 分析結果（戦略設計）
${analysisBlock}

${craftBlock}

【取引先】${bp.industry}
【提案種別】${bp.proposalScope}
【提案領域】${bp.productArea}
【経営課題（表面）】${bp.surfaceChallenge}
【根本原因（分析）】${bp.rootCause}
【業種特性】${bp.industryContext}
【期待インパクト】${bp.impact}

# 提案ストーリー（Before→Bridge→After）
${bp.proposalStory}

# Before / After
${bp.before}

${bp.after}

# ROI・数字の書き方（必須）
${roiBlock}

# KPI例
${kpiBlock}

# 導入ストーリー（90日〜）
${implBlock}

# 競合との差別化
${bp.competitiveDiff || ""}
${diffBlock}

# 必ず含める構成（${(bp.chapters || []).length}章）
${chaptersBlock}

# 売上アップ施策（優先順位付き）
${measuresBlock}

# 導入効果 KPI
${bp.kpi}

# 想定懸念と回答
${objectionsBlock}

# 次のアクション（CTA）
${bp.cta}

${bp.hearingNotes ? `# ヒアリングメモ（反映すること）\n${bp.hearingNotes}\n` : ""}
${formatSynthesisHints(synthesis)}

# トーン
${bp.tone}

# 出力
上記${(bp.chapters || []).length}章構成の提案書全文。見出し（##）付き。そのまま取引先提出または社内プレゼンに使える完成度で。

${buildSelfReviewInstructionsBlock(categoryId)}`;

  return {
    systemPrompt,
    textPrompt,
    imagePrompt: null,
    negativePrompt: null,
    captionPrompt: null,
  };
}

/** 後方互換 */
export function renderProposalDeliverablePrompt(blueprint) {
  const p = buildProposalPrompts(blueprint);
  return p.systemPrompt ? `${p.systemPrompt}\n\n${p.textPrompt}` : p.textPrompt;
}
