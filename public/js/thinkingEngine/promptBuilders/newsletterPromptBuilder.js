/**
 * メルマガ・LINE — Prompt Builder
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

export function buildNewsletterPrompts(blueprint) {
  const bp = unwrapBlueprint(blueprint);
  const purpose = bp.purpose ?? {};

  const subjectBlock = (bp.subjectLines || []).map((s, i) => `${i + 1}. ${s}`).join("\n");
  const structureBlock = (bp.bodyStructure || []).map((s, i) => `${i + 1}. ${s}`).join("\n");
  const knowledgeBlock = buildKnowledgePromptBlock(bp);
  const categoryId = resolveCategoryFromBlueprint(bp);

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB向けメール・LINE配信のプロフェッショナル（教育型コンテンツ設計）",
    mission: purpose.primaryGoal || `${bp.audience}向け${bp.channel}`,
    constraints: [
      ...DEFAULT_CONSTRAINTS,
      "押し売り禁止",
      "1通1CTA",
      "教育型→ソフトセル→CTAの順",
      "件名・冒頭3行で開封と続読を獲得",
    ],
  });

  const seasonBlock = bp.seasonalContext
    ? `【季節性】${bp.seasonalContext.label} — ${(bp.ownerConcerns || bp.seasonalContext.ownerConcerns || []).slice(0, 2).join("、")}`
    : "";

  const textPrompt = `# 依頼
${bp.channel}の配信文を、美容業界プロが書いたレベルの品質で作成してください。
売り込み感のない教育型コンテンツとして設計し、自然に商品・サービス提案へ繋げてください。

${knowledgeBlock}

${formatQualityRetryHints(bp)}

# thinkingCore 分析結果（戦略設計）
${buildAnalysisReflectionBlock(bp)}

${buildPromptCraftBlock(categoryId)}

${seasonBlock}

【配信先】${bp.audience}
【目的】${bp.purposeLabel}
【提供価値】${bp.value}
【経営課題】${bp.challenge?.surfaceChallenge ?? bp.impact}
【トピック】${bp.topic}
【トーン】${bp.tone}
【読了フロー】${bp.readingFlow || "開封→3行フック→教育→橋渡し→CTA→PS"}

# 件名5案（開封率重視）
${subjectBlock}

# プレヘッダー
${bp.preheader || "件名を補完し、3行目まで読ませる一言"}

# 本文構成（最後まで読ませる）
${structureBlock}

# 教育型コンテンツの切り口
${bp.educationalAngle || "サロン経営KPI・季節性・リピート施策"}

# 商品提案への橋渡し（ソフトセル）
${bp.softSellBridge || "「だからこそ」で自然にソリューションへ"}

# 冒頭フック（3行以内）
${bp.openingHook}

# CTA（1つだけ）
${bp.cta}

# PS（追伸）
${bp.psHint || "最も重要なメッセージを追伸に"}

${bp.channel?.includes("LINE") ? `# LINE版\n${bp.lineVersion || "300字以内"}\n` : ""}
${formatSynthesisHints(bp.synthesis)}

# 出力
${(bp.sections || []).join(" / ")} をそのまま配信可能な完成度で。

${buildSelfReviewInstructionsBlock(categoryId)}`;

  return {
    systemPrompt,
    textPrompt,
    imagePrompt: null,
    negativePrompt: null,
    captionPrompt: null,
  };
}

export function renderNewsletterLineDeliverablePrompt(blueprint) {
  const p = buildNewsletterPrompts(blueprint);
  return `${p.systemPrompt}\n\n${p.textPrompt}`;
}
