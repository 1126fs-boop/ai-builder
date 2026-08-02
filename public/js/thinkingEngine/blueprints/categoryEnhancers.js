/**
 * カテゴリ別 Blueprint 強化 — Playbook から設計要素を生成
 */

import {
  getSeasonalContext,
  NEWSLETTER_PLAYBOOK,
  PROPOSAL_PLAYBOOK,
  SALES_PLAYBOOK,
  POP_PLAYBOOK,
} from "../core/knowledge/categoryPlaybooks.js";

/**
 * メルマガ Blueprint 用 — 件名・構成・季節性を強化
 */
export function buildNewsletterEnhancements(answers, challenge, purpose) {
  const season = getSeasonalContext();
  const surface = challenge.surfaceChallenge || answers.value || "経営課題";
  const topic = answers.product_topic || answers.purpose || "経営ノウハウ";
  const audience = answers.audience || purpose.audience || "サロンオーナー";

  const subjectLines = [
    `【${surface}】${season.topics[0]}のヒント｜${audience}様`,
    `${season.label}に差がつく${topic} — ${surface}改善`,
    `【${season.ownerConcerns[0]}】${audience}向け｜売り込みなしで役立つ情報`,
    `${surface}、原因は"仕組み"かもしれません｜${topic}`,
    `質問: ${season.ownerConcerns[1]}、どこから手を付けますか？`,
  ];

  return {
    seasonalContext: season,
    subjectLines,
    preheader: `${surface}の改善に直結する${season.label}の経営ノウハウを、押し売りなくお届けします`,
    bodyStructure: NEWSLETTER_PLAYBOOK.bodyFlow,
    educationalAngle: NEWSLETTER_PLAYBOOK.educationalAngles.find((a) =>
      a.includes(surface.slice(0, 2))
    ) || NEWSLETTER_PLAYBOOK.educationalAngles[0],
    softSellBridge: NEWSLETTER_PLAYBOOK.softSellBridge[0],
    psHint: "PS: 最も読んでほしいメッセージ（限定情報・次の一手・相談窓口）",
    ownerInfoTopics: season.topics,
    ownerConcerns: season.ownerConcerns,
    readingFlow: "開封→3行フック→教育→橋渡し→CTA→PS",
  };
}

/**
 * 提案書 Blueprint 用 — ROI・差別化・導入ストーリー
 */
export function buildProposalEnhancements(challenge, answers, productArea) {
  const surface = challenge.surfaceChallenge || "経営課題";
  const impact = challenge.impact || "経営改善";

  return {
    roiSection: PROPOSAL_PLAYBOOK.roiFramework.map((line) =>
      line
        .replace("{impact}", impact)
        .replace("【導入費用】", "【導入費用】")
    ),
    implementationPhases: PROPOSAL_PLAYBOOK.implementationStory,
    differentiationPoints: PROPOSAL_PLAYBOOK.differentiationAngles,
    analysisDepth: PROPOSAL_PLAYBOOK.analysisFramework,
    kpiExamples: [
      `客単価: Before【○円】→ After【○円】（${surface}改善）`,
      `リピート率: Before【○%】→ After【○%】`,
      `稼働率: Before【○%】→ After【○%】`,
      `回収期間: 【○ヶ月】（保守的試算）`,
    ],
    competitiveDiff: `${productArea || "本提案"}は、スペック比較ではなく「${surface}→${impact}」の経営課題解決で差別化`,
    proposalStoryEnhanced: [
      `Before: ${challenge.beforeHypothesis || surface}（${challenge.rootCause}）`,
      `Bridge: ${productArea || "ソリューション"}によるPoC→標準化`,
      `After: ${challenge.afterHypothesis || impact}`,
    ].join("\n"),
  };
}

/**
 * 営業トーク Blueprint 用 — SPIN・深掘り・反論・クロージング
 */
export function buildSalesEnhancements(answers, challenge, purpose) {
  const salesType = answers.sales_type || "商談";
  const goal = answers.goal || "商談成功";
  const industry = challenge.industry || answers.industry || "美容サロン";
  const surface = challenge.surfaceChallenge || "経営課題";
  const impact = challenge.impact || "経営改善";

  const fill = (template) =>
    template
      .replace(/\{industry\}/g, industry)
      .replace(/\{challenge\}/g, surface)
      .replace(/\{impact\}/g, impact);

  const icebreakers = (SALES_PLAYBOOK.icebreakers[salesType] || SALES_PLAYBOOK.icebreakers.商談).map(fill);

  const spinHearing = [
    ...SALES_PLAYBOOK.spinQuestions.situation.map(fill),
    ...SALES_PLAYBOOK.spinQuestions.problem.map(fill),
    ...SALES_PLAYBOOK.spinQuestions.implication.map(fill),
    ...SALES_PLAYBOOK.spinQuestions.needPayoff.map(fill),
  ];

  const objectionResponses = SALES_PLAYBOOK.objectionMatrix.map((o) => ({
    q: o.concern,
    a: fill(o.response),
  }));

  const closingKey = goal.includes("アポ")
    ? "アポ獲得"
    : goal.includes("受注")
      ? "受注"
      : goal.includes("資料")
        ? "資料送付"
        : "商談成功";

  return {
    icebreakers,
    rapportNote: "アイスブレイク後、相手の話を最優先。商品説明は課題整理後",
    spinHearing,
    deepDiveQuestions: SALES_PLAYBOOK.deepDiveQuestions.map(fill),
    hearingQuestions: spinHearing.slice(0, 6),
    objectionResponses,
    salesPhases: SALES_PLAYBOOK.phases,
    closingVariants: SALES_PLAYBOOK.closingByGoal,
    closing: fill(
      SALES_PLAYBOOK.closingByGoal[closingKey] || SALES_PLAYBOOK.closingByGoal.商談成功
    ),
    opening: icebreakers[0],
  };
}

/**
 * POP Blueprint 用 — ヘッドライン・コピー階層
 */
export function buildPopEnhancements(answers, challenge, purpose) {
  const season = getSeasonalContext();
  const appeal = answers.appeal_point || "導入メリット";
  const product = answers.wam_product || "【商品名】";
  const location = answers.display_location || "店内";
  const usage = answers.usage || "店内POP";

  const locationKey = Object.keys(POP_PLAYBOOK.layoutByLocation).find((k) =>
    location.includes(k)
  );

  return {
    seasonalHook: `${season.label}: ${season.topics[0]}`,
    headlineVariants: POP_PLAYBOOK.headlineFormulas.map((f) =>
      `${f.replace("商品名", product).replace("経営改善", appeal)}`
    ),
    copyHierarchy: POP_PLAYBOOK.copyHierarchy,
    layoutHint: locationKey
      ? POP_PLAYBOOK.layoutByLocation[locationKey]
      : POP_PLAYBOOK.promoTypes[usage] || POP_PLAYBOOK.promoTypes.店内POP,
    subCopyVariants: [
      `${challenge.surfaceChallenge}（${challenge.impact}）の課題解決を支援`,
      `${season.label}の${appeal} — ${product}`,
      `サロン経営者向け｜${appeal}`,
    ],
  };
}
