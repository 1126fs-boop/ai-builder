/**
 * メルマガ・LINE — Prompt Builder
 */

import { unwrapBlueprint } from "../core/types/blueprint.js";
import { buildSystemPrompt, formatSynthesisHints, DEFAULT_CONSTRAINTS } from "./_shared.js";

export function buildNewsletterPrompts(blueprint) {
  const bp = unwrapBlueprint(blueprint);
  const purpose = bp.purpose ?? {};

  const subjectBlock = (bp.subjectLines || []).map((s, i) => `${i + 1}. ${s}`).join("\n");
  const structureBlock = (bp.bodyStructure || []).map((s, i) => `${i + 1}. ${s}`).join("\n");

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB向けメール・LINE配信のプロフェッショナル",
    mission: purpose.primaryGoal || `${bp.audience}向け${bp.channel}`,
    constraints: [...DEFAULT_CONSTRAINTS, "押し売り禁止", "1通1CTA"],
  });

  const textPrompt = `# 依頼
${bp.channel}の配信文を作成してください。

【配信先】${bp.audience}
【目的】${bp.purposeLabel}
【提供価値】${bp.value}
【経営課題】${bp.challenge?.surfaceChallenge ?? bp.impact}
【トピック】${bp.topic}
【トーン】${bp.tone}

# 件名案
${subjectBlock}

# 本文構成
${structureBlock}

# 冒頭フック
${bp.openingHook}

# CTA
${bp.cta}

${bp.channel?.includes("LINE") ? `# LINE版\n${bp.lineVersion || "300字以内"}\n` : ""}
${formatSynthesisHints(bp.synthesis)}

# 出力
${(bp.sections || []).join(" / ")} をそのまま配信可能な完成度で。`;

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
