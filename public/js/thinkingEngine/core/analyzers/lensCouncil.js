/**
 * Lens Council — thinkingCore 内部 Multi Agent 議論
 *
 * 専門 Lens が複数ラウンドでレビュー・反論・改善し、
 * 1つの synthesis（統合結論）を生成する。外部UIは変更しない。
 */

import { getLensPanelForCategory, getLensDefinition } from "./lensRegistry.js";

const ROUND_LABELS = {
  1: { id: "proposal", label: "第1ラウンド：専門意見" },
  2: { id: "debate", label: "第2ラウンド：反論・補足" },
  3: { id: "refinement", label: "第3ラウンド：改善・統合" },
};

/**
 * Multi Agent Lens 議論を実行
 * @param {string} categoryId
 * @param {{ purpose: Object, challenge: Object, knowledge: Object }} input
 */
export function runLensCouncil(categoryId, input) {
  const { purpose, challenge, knowledge } = input;
  const panel = getLensPanelForCategory(categoryId);
  const rounds = [];

  const round1 = panel.map((lens) => buildRoundOpinion(lens, 1, input, null));
  rounds.push({ round: 1, ...ROUND_LABELS[1], opinions: round1 });

  const round2 = panel.map((lens, i) => {
    const counterTarget = round1[(i + 1) % round1.length];
    return buildRoundOpinion(lens, 2, input, counterTarget);
  });
  rounds.push({ round: 2, ...ROUND_LABELS[2], opinions: round2 });

  const round3 = panel.map((lens, i) =>
    buildRoundOpinion(lens, 3, input, { round1: round1[i], round2: round2[i] })
  );
  rounds.push({ round: 3, ...ROUND_LABELS[3], opinions: round3 });

  const lensReviews = round3.map((op) => toLensReview(op));

  const synthesis = synthesizeCouncil({
    categoryId,
    panel,
    rounds,
    purpose,
    challenge,
    knowledge,
    lensReviews,
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
    },
  };
}

/**
 * @param {Object} lens
 * @param {number} roundNum
 * @param {Object} input
 * @param {Object|null} context
 */
function buildRoundOpinion(lens, roundNum, input, context) {
  const { purpose, challenge, knowledge } = input;
  const sc = challenge.surfaceChallenge || "経営課題";
  const audience = purpose.audience || "サロンオーナー";
  const intel = knowledge?.analysisIntelligence;

  if (roundNum === 1) {
    return {
      lensId: lens.id,
      lensLabel: lens.label,
      round: roundNum,
      stance: "proposal",
      insight: buildLensInsight(lens, purpose, challenge, knowledge),
      recommendation: buildLensRecommendation(lens, purpose, challenge),
      counterpoint: lens.risk ? `${lens.label}の盲点: ${lens.risk}` : null,
    };
  }

  if (roundNum === 2 && context) {
    const agreeOrCounter = lens.id === "psychology" || lens.id === "roi" ? "counter" : "supplement";
    return {
      lensId: lens.id,
      lensLabel: lens.label,
      round: roundNum,
      stance: agreeOrCounter,
      insight:
        agreeOrCounter === "counter"
          ? `【反論】${context.lensLabel}の意見「${truncate(context.insight, 60)}」に対し、${lens.risk}に注意`
          : `【補足】${context.lensLabel}の視点に加え、${lens.focus}では${sc}を${audience}の決裁心理に結びつける`,
      recommendation: buildLensRecommendation(lens, purpose, challenge),
      counterpoint: null,
    };
  }

  if (roundNum === 3 && context?.round1) {
    const rubricHint = intel?.rubricProfile?.topFocus?.[0];
    return {
      lensId: lens.id,
      lensLabel: lens.label,
      round: roundNum,
      stance: "refinement",
      insight: `【改善案】${truncate(context.round1.insight, 80)} → ${lens.example}${rubricHint ? `（品質: ${rubricHint.label}）` : ""}`,
      recommendation: context.round2?.recommendation || context.round1.recommendation,
      counterpoint: null,
    };
  }

  return buildRoundOpinion(lens, 1, input, null);
}

function buildLensInsight(lens, purpose, challenge, knowledge) {
  const sc = challenge.surfaceChallenge || "経営課題";
  const industry = challenge.industry || "美容サロン";
  const templates = {
    sns: `SNS全体: ${purpose.primaryGoal}。${sc}を${purpose.audience}が保存したくなる構成`,
    instagram: `Instagram: 1行目3秒+保存率設計。${sc}フック必須`,
    beauty: `${industry}の${challenge.industryContext || "業界特性"}。${sc}はKPI直結`,
    marketing: `BtoBマーケ: 教育型→信頼→${sc}改善の導線`,
    copy: `コピー: ${sc}→${challenge.impact}を1メッセージ1CTAで`,
    design: `デザイン: オリジナルクリエイティブ。HP再現・商品AI生成禁止`,
    sales: `営業: 共感→SPINヒアリング→${sc}のPoC提案`,
    psychology: `心理: ${purpose.audience}の不安（効果・定着・投資）を先回り`,
    management: `経営: ${sc}を客数×客単価×リピートで改善`,
    roi: `ROI: ${challenge.impact}を数字・回収期間で明示（【】可）`,
  };

  let insight = templates[lens.id] || `${lens.label}: ${lens.example || sc}`;

  if (knowledge?.analysisIntelligence?.revisionLessons?.[0]) {
    insight += `。修正学習: ${knowledge.analysisIntelligence.revisionLessons[0]}`;
  }

  return insight;
}

function buildLensRecommendation(lens, purpose, challenge) {
  const recs = {
    sns: "保存→プロフィール/DM。1CTA",
    instagram: "3秒フック→PAS構成→CTA1つ",
    beauty: "経営課題起点。商品スペックから入らない",
    marketing: "Before/After + 信頼構築",
    copy: "括弧強調フック+自然な日本語",
    design: "毎回新規デザイン。公式商品のみ配置",
    sales: "アイスブレイク→深掘り→クロージング1つ",
    psychology: "PoCでリスク低減。押し売り禁止",
    management: "小さく始めて検証→仕組み化",
    roi: "保守的試算+Quick Win 2週間",
  };
  return recs[lens.id] || `${challenge.surfaceChallenge}と${purpose.primaryGoal}を一貫`;
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

function synthesizeCouncil({ categoryId, panel, rounds, purpose, challenge, knowledge, lensReviews }) {
  const agreedPoints = [
    "経営課題起点で訴求する（商品スペックから入らない）",
    `Before/After で${challenge.impact}を示す`,
    purpose.constraints?.[0] || "自然な日本語",
  ];

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
  const tensions = round2Ops
    .filter((o) => o.stance === "counter")
    .map((o) => o.insight)
    .concat(lensReviews.filter((l) => l.counterpoint).map((l) => l.counterpoint));

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
    `【AI会議（${panel.length} Lens × ${rounds.length}ラウンド）】`,
    `参加: ${panel.map((l) => l.label).join("、")}`,
    `統合: ${finalDirection}`,
  ].join("\n");

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
