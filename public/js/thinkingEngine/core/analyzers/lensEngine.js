/**
 * フェーズ5 — 多視点レビュー → 統合
 *
 * AI会議の思考型（多視点→反証→統合）を thinkingCore 内部で再現。
 * 目的: Prompt Builder に渡す設計判断を強化する。
 */

import { ROLE_EXPERTISE } from "../../domainKnowledge.js";
import { CATEGORY_LENSES } from "../categoryConfig.js";

/**
 * @param {string} categoryId
 * @param {Object} input
 * @param {Object} input.purpose
 * @param {Object} input.challenge
 * @param {Object} input.knowledge
 */
export function runLensEngine(categoryId, input) {
  const { purpose, challenge, knowledge } = input;
  const roleIds = CATEGORY_LENSES[categoryId] || CATEGORY_LENSES.proposal;

  const lensReviews = roleIds.map((roleId) => {
    const role = ROLE_EXPERTISE[roleId] || { focus: roleId, example: "", risk: "" };
    return {
      lensId: roleId,
      focus: role.focus,
      insight: buildInsight(roleId, role, purpose, challenge, knowledge),
      recommendation: buildRecommendation(roleId, purpose, challenge),
      counterpoint: role.risk ? `${role.focus}の盲点: ${role.risk}` : null,
    };
  });

  const synthesis = synthesizeReviews(lensReviews, purpose, challenge);

  return { lensReviews, synthesis };
}

function buildInsight(roleId, role, purpose, challenge, knowledge) {
  const industry = challenge.industry || "美容サロン";
  const sc = challenge.surfaceChallenge || "経営課題";

  const templates = {
    beauty_consultant: `${industry}では${challenge.industryContext}。${sc}はKPIに直結。`,
    top_sales: `${purpose.primaryGoal}には共感→課題→Before/After→CTAの順が有効。`,
    executive: `投資判断は回収期間とスタッフ定着。${challenge.impact}を数字で示す。`,
    marketer: `開封・保存・来店転換。1行目で${sc}に触れる。`,
    sns_manager: `3秒ルール。${purpose.audience}が「自分ごと化」できる訴求が必要。`,
  };

  return templates[roleId] || `${role.focus}: ${role.example || sc}に関連する視点`;
}

function buildRecommendation(roleId, purpose, challenge) {
  if (roleId === "executive") return "ROI・PoC・小さく始めるステップを明示";
  if (roleId === "top_sales") return "CTAは1つ。明日から使える粒度";
  if (roleId === "marketer" || roleId === "sns_manager") return "課題共感フック→価値→CTA";
  return `${challenge.surfaceChallenge}と${purpose.primaryGoal}を一貫させる`;
}

function synthesizeReviews(lensReviews, purpose, challenge) {
  const agreedPoints = [
    "経営課題起点で訴求する（商品スペックから入らない）",
    `Before/After で${challenge.impact}を示す`,
    purpose.constraints?.[0] || "自然な日本語",
  ];

  const tensions = lensReviews
    .filter((l) => l.counterpoint)
    .map((l) => l.counterpoint);

  const finalDirection = [
    lensReviews.find((l) => l.lensId === "beauty_consultant" || l.lensId === "top_sales")?.recommendation,
    `トーン: ${purpose.tone}`,
    `CTA: ${purpose.audience}向けに1つに絞る`,
  ].filter(Boolean).join(" / ");

  return {
    agreedPoints,
    tensions,
    finalDirection,
    promptBuilderHints: lensReviews.map((l) => l.recommendation).filter(Boolean),
  };
}
