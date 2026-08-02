/**
 * Lens Council — thinkingCore 内部 Multi Agent 議論
 *
 * 専門 Lens が複数ラウンドでレビュー・反論・改善し、
 * 1つの synthesis（統合結論）を生成する。外部UIは変更しない。
 */

import { getLensPanelForCategory, getLensDefinition } from "./lensRegistry.js";
import {
  buildLensProposal,
  buildLensDebate,
  buildLensRefinement,
  pickDebateTarget,
} from "./lensDebateEngine.js";

const ROUND_LABELS = {
  1: { id: "proposal", label: "第1ラウンド：専門意見" },
  2: { id: "debate", label: "第2ラウンド：反論・補足" },
  3: { id: "refinement", label: "第3ラウンド：改善・統合" },
};

/**
 * Multi Agent Lens 議論を実行
 * @param {string} categoryId
 * @param {{ purpose: Object, challenge: Object, knowledge: Object }} input
 * @param {{ qualityFeedback?: string[], iteration?: number, isRetry?: boolean }} [options]
 */
export function runLensCouncil(categoryId, input, options = {}) {
  const { purpose, challenge, knowledge } = input;
  const { qualityFeedback = null, iteration = 0, isRetry = false } = options;
  const panel = getLensPanelForCategory(categoryId);
  const rounds = [];

  const round1 = panel.map((lens) => buildRoundOpinion(lens, 1, categoryId, input, null, panel, null));
  rounds.push({ round: 1, ...ROUND_LABELS[1], opinions: round1 });

  const round2 = panel.map((lens) => {
    const target = pickDebateTarget(lens.id, panel, round1);
    return buildRoundOpinion(lens, 2, categoryId, input, target, panel, round1);
  });
  rounds.push({ round: 2, ...ROUND_LABELS[2], opinions: round2 });

  const round3 = panel.map((lens, i) =>
    buildRoundOpinion(lens, 3, categoryId, input, { round1: round1[i], round2: round2[i] }, panel, round1)
  );
  rounds.push({ round: 3, ...ROUND_LABELS[3], opinions: round3 });

  let lensReviews = round3.map((op) => toLensReview(op));

  // 品質未達時: ルーブリックフィードバックに基づく追加改善ラウンド
  if (isRetry && qualityFeedback?.length) {
    const refinementOps = panel.map((lens, i) =>
      buildQualityRefinementOpinion(lens, input, qualityFeedback[i % qualityFeedback.length])
    );
    rounds.push({ round: 4, id: "quality_refine", label: "品質改善ラウンド", opinions: refinementOps });
    lensReviews = [
      ...round3.map((op) => toLensReview(op)),
      ...refinementOps.map((op) => toLensReview(op)),
    ];
  }

  const synthesis = synthesizeCouncil({
    categoryId,
    panel,
    rounds,
    purpose,
    challenge,
    knowledge,
    lensReviews,
    qualityFeedback,
    iteration,
  });

  return {
    lensReviews,
    synthesis,
    council: {
      panelIds: panel.map((l) => l.id),
      panelLabels: panel.map((l) => l.label),
      roundCount: rounds.length,
      rounds: rounds.map((r) => ({
        round: r.round,
        label: r.label,
        opinionCount: r.opinions.length,
      })),
      qualityIteration: iteration + 1,
      hadQualityRetry: isRetry,
    },
  };
}

/**
 * @param {Object} lens
 * @param {number} roundNum
 * @param {string} categoryId
 * @param {Object} input
 * @param {Object|null} context
 * @param {Object[]} panel
 * @param {Object[]|null} round1Ops
 */
function buildRoundOpinion(lens, roundNum, categoryId, input, context, panel, round1Ops) {
  const ctx = { ...input, categoryId };

  if (roundNum === 1) {
    const proposal = buildLensProposal(lens, ctx);
    return {
      lensId: lens.id,
      lensLabel: lens.label,
      round: roundNum,
      stance: "proposal",
      insight: proposal.insight,
      recommendation: proposal.recommendation,
      counterpoint: proposal.critique,
    };
  }

  if (roundNum === 2 && context) {
    const debate = buildLensDebate(lens, ctx, context);
    return {
      lensId: lens.id,
      lensLabel: lens.label,
      round: roundNum,
      stance: debate.stance,
      insight: debate.insight,
      recommendation: debate.recommendation,
      counterpoint: debate.counterpoint,
    };
  }

  if (roundNum === 3 && context?.round1) {
    const refinement = buildLensRefinement(lens, ctx, context.round1, context.round2);
    return {
      lensId: lens.id,
      lensLabel: lens.label,
      round: roundNum,
      stance: refinement.stance,
      insight: refinement.insight,
      recommendation: refinement.recommendation,
      counterpoint: null,
    };
  }

  const proposal = buildLensProposal(lens, ctx);
  return {
    lensId: lens.id,
    lensLabel: lens.label,
    round: 1,
    stance: "proposal",
    insight: proposal.insight,
    recommendation: proposal.recommendation,
    counterpoint: proposal.critique,
  };
}

/** 品質ルーブリック未達時の改善意見 */
function buildQualityRefinementOpinion(lens, input, feedbackItem) {
  const { purpose, challenge } = input;
  const feedback = feedbackItem || "品質基準を満たす具体性を追加";
  return {
    lensId: lens.id,
    lensLabel: lens.label,
    round: 4,
    stance: "quality_refine",
    insight: `【品質改善】${feedback} → ${lens.focus}の視点で: ${lens.example}`,
    recommendation: `${challenge.surfaceChallenge || "経営課題"}と${purpose.primaryGoal}を${feedback.replace(/^\[[^\]]+\]\s*/, "")}で強化`,
    counterpoint: null,
  };
}

function toLensReview(opinion) {
  const lens = getLensDefinition(opinion.lensId);
  return {
    lensId: opinion.lensId,
    focus: lens.label,
    insight: opinion.insight,
    recommendation: opinion.recommendation,
    counterpoint: opinion.counterpoint,
    round: opinion.round,
    stance: opinion.stance,
  };
}

function synthesizeCouncil({ categoryId, panel, rounds, purpose, challenge, knowledge, lensReviews, qualityFeedback, iteration }) {
  const agreedPoints = [
    "経営課題起点で訴求する（商品スペックから入らない）",
    `Before/After で${challenge.impact}を示す`,
    purpose.constraints?.[0] || "自然な日本語",
  ];

  if (qualityFeedback?.length) {
    agreedPoints.push(
      ...qualityFeedback.slice(0, 3).map((f) => `【品質改善】${f}`)
    );
  }

  panel.slice(0, 3).forEach((lens) => {
    const review = lensReviews.find((r) => r.lensId === lens.id);
    if (review?.recommendation) agreedPoints.push(`[${lens.label}] ${review.recommendation}`);
  });

  if (knowledge?.appliedKnowledge?.directives?.length) {
    agreedPoints.push(
      ...knowledge.appliedKnowledge.directives.slice(0, 2).map((d) => d.text)
    );
  }

  if (knowledge?.analysisIntelligence?.analysisDirectives?.length) {
    agreedPoints.push(
      ...knowledge.analysisIntelligence.analysisDirectives
        .filter((d) => d.priority === "high")
        .slice(0, 2)
        .map((d) => d.text)
    );
  }

  const round2Ops = rounds[1]?.opinions ?? [];
  const tensions = [
    ...round2Ops.filter((o) => o.stance === "counter").map((o) => `${o.lensLabel}: ${o.insight}`),
    ...lensReviews.filter((l) => l.counterpoint).map((l) => l.counterpoint),
    ...round2Ops.filter((o) => o.stance === "supplement").map((o) => `${o.lensLabel}（補足）: ${truncate(o.insight, 100)}`),
  ];

  const leadLens = panel.find((l) => l.id === "beauty" || l.id === "management") || panel[0];
  const leadReview = lensReviews.find((r) => r.lensId === leadLens?.id);

  const finalDirection = [
    leadReview?.recommendation,
    `トーン: ${purpose.tone}`,
    `CTA: ${purpose.audience}向けに1つ`,
  ]
    .filter(Boolean)
    .join(" / ");

  const councilSummary = [
    `【AI会議（${panel.length} Lens × ${rounds.length}ラウンド${iteration > 0 ? ` / 品質改善${iteration + 1}回目` : ""}）】`,
    `参加: ${panel.map((l) => l.label).join("、")}`,
    `統合: ${finalDirection}`,
    qualityFeedback?.length ? `品質改善: ${qualityFeedback.slice(0, 2).join(" / ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    agreedPoints,
    tensions: [...new Set(tensions)].slice(0, 5),
    finalDirection,
    promptBuilderHints: lensReviews.map((l) => l.recommendation).filter(Boolean),
    councilSummary,
    deliberationRounds: rounds.length,
    categoryId,
  };
}

function truncate(str, len) {
  if (!str) return "";
  return str.length <= len ? str : `${str.slice(0, len)}…`;
}
