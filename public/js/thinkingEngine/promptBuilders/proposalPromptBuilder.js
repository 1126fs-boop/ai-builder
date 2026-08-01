/**
 * 提案書 — Prompt Builder
 */

import { unwrapBlueprint } from "../core/types/blueprint.js";
import {
  buildSystemPrompt,
  formatSynthesisHints,
  DEFAULT_CONSTRAINTS,
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

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB（サロン・クリニック向け）の提案書作成プロフェッショナル",
    mission: purpose.primaryGoal || `${bp.industry}向け提案書を作成`,
    constraints: [
      ...DEFAULT_CONSTRAINTS,
      "商品カタログではなく経営改善提案書として書く",
      "冒頭は取引先の課題への共感から入る",
    ],
    companyRules: bp.constraintsSummary?.split("\n").filter(Boolean) ?? [],
  });

  const textPrompt = `# 依頼
以下の条件で、取引先に提出できる提案書を作成してください。

【取引先】${bp.industry}
【提案種別】${bp.proposalScope}
【提案領域】${bp.productArea}
【経営課題（表面）】${bp.surfaceChallenge}
【根本原因（分析）】${bp.rootCause}
【業種特性】${bp.industryContext}
【期待インパクト】${bp.impact}

# 提案ストーリー
${bp.proposalStory}

# Before / After
${bp.before}

${bp.after}

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
上記${(bp.chapters || []).length}章構成の提案書全文。見出し（##）付き。そのまま取引先提出または社内プレゼンに使える完成度で。`;

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
