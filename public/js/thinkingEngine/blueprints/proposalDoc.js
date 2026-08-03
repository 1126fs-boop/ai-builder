/**
 * 提案書 — 成果物 Blueprint（10章構成）
 *
 * AnalysisContext のみを参照して設計図を生成する。
 */

import { evaluateProposalBlueprint } from "../rubrics/proposalQuality.js";
import { resolveBlueprintInputs, attachStrategicFields } from "./_context.js";
import { buildProposalEnhancements } from "./categoryEnhancers.js";

function runLensReviews(inputs, blueprint) {
  const { answers, purpose, challenge } = inputs;
  const industry = challenge.industry || answers.industry || "美容サロン";
  return [
    {
      lensId: "consultant",
      focus: "サロン経営コンサル視点",
      insight: `${industry}では${challenge.industryContext}。${challenge.surfaceChallenge}はKPIに直結する。`,
    },
    {
      lensId: "sales",
      focus: "現場営業視点",
      insight: `${answers.proposal_scope || "提案書"}では、共感→課題→Before/After→CTAの順が刺さる。`,
    },
    {
      lensId: "owner",
      focus: "オーナー視点",
      insight: "投資判断は「回収期間」と「スタッフが回せるか」。小さく始めて検証したい。",
    },
  ];
}

function buildMeasures(challenge, productArea) {
  const surface = challenge.surfaceChallenge || challenge;
  const area = productArea || "ソリューション";
  return [
    { priority: 1, title: "Quick Win（2週間）", body: `現状ヒアリング3項目を整理し、${surface}のボトルネック1つを特定` },
    { priority: 2, title: "90日施策", body: `${area}を活用した${surface}改善のPoC（小規模検証）` },
    { priority: 3, title: "仕組み化（180日）", body: "成功パターンを標準化し、全スタッフが再現できる運用へ" },
  ];
}

function buildObjections(challenge) {
  return [
    {
      concern: "本当に効果が出るか不安",
      response: `${challenge.impact}をKPIで測定。2週間のQuick Winで初期効果を確認`,
    },
    {
      concern: "スタッフが使いこなせるか",
      response: "導入初期は伴走支援。操作研修＋週次フォローで定着を支援",
    },
  ];
}

/**
 * @param {Object} ctx AnalysisContext エンベロープ
 */
export function buildProposalBlueprint(ctx) {
  const inputs = resolveBlueprintInputs(ctx);
  const { answers, purpose, challenge, knowledge, structure, lensReviews, synthesis } = inputs;

  const industry = challenge.industry;
  const surfaceChallenge = challenge.surfaceChallenge;
  const scope = answers.proposal_scope || "ソリューション提案書（初回）";
  const productArea = answers.product_area || answers._inferred?.product_area || "複合提案";
  const enhanced = buildProposalEnhancements(challenge, answers, productArea);

  const blueprint = {
    useCaseId: "proposal_doc",
    purpose,
    challenge,
    synthesis,
    knowledgeRefs: knowledge.refs ?? [],
    industry,
    surfaceChallenge,
    rootCause: challenge.rootCause,
    industryContext: challenge.industryContext,
    proposalScope: scope,
    productArea,
    impact: challenge.impact,
    before: challenge.beforeHypothesis,
    after: challenge.afterHypothesis,
    proposalStory: enhanced.proposalStoryEnhanced,
    proposalStorySummary: `${industry}の${surfaceChallenge}は、${challenge.rootCause}が背景にある。${productArea}による経営改善提案として、Before/After・ROI・導入ステップを明示する。`,
    roiSection: enhanced.roiSection,
    implementationPhases: enhanced.implementationPhases,
    differentiationPoints: enhanced.differentiationPoints,
    analysisDepth: enhanced.analysisDepth,
    kpiExamples: enhanced.kpiExamples,
    competitiveDiff: enhanced.competitiveDiff,
    measures: buildMeasures(challenge, productArea),
    objections: buildObjections(challenge),
    kpi: challenge.impact,
    cta: structure.ctaType || (scope.includes("プレゼン")
      ? "次回商談でデモ・体験日を確定"
      : "2週間PoCの開始日と担当者を確定"),
    tone: structure.tone || purpose.tone || "説得力重視",
    outputFormat: structure.outputFormat || answers.output_format || "提案書全文",
    hearingNotes: answers.hearing_notes || "",
    constraintsSummary: purpose.constraints?.map((c) => `- ${c}`).join("\n") ?? "",
    improvementPoints: purpose.successCriteria ?? [],
    narrativeArc: structure.narrativeArc,
    copyStrategy: structure.copyStrategy,
    lensReviews: lensReviews.length ? lensReviews : runLensReviews(inputs, {}),
    chapters: structure.sections?.length ? structure.sections : [
      "エグゼクティブサマリー",
      "取引先の現状分析",
      "課題の深掘り",
      "提案ストーリー",
      "ソリューション提案",
      "売上アップ施策",
      "導入効果（ROI）",
      "90日導入ステップ",
      "想定懸念と回答",
      "次のアクション",
    ],
  };

  blueprint.quality = evaluateProposalBlueprint(blueprint);

  return attachStrategicFields(blueprint, inputs);
}
