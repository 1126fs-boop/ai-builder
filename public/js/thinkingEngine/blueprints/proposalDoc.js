/**
 * 提案書 — 成果物 Blueprint（10章構成）
 */

import {
  CHALLENGE_IMPACT,
  INDUSTRY_CONTEXT,
} from "../domainKnowledge.js";
import { evaluateProposalBlueprint } from "../rubrics/proposalQuality.js";

/** 業種×課題 → 根本原因仮説 */
const ROOT_CAUSE_MATRIX = {
  売上アップ: {
    default: "新規集客不足とリピート率低下の複合",
    エステサロン: "リピート周期の長期化とメニュー単価の停滞",
    美容室: "指名率・カラー比率の低迷",
    ネイルサロン: "来店頻度低下と単価の上限",
    クリニック: "リピート施術と物販の伸び悩み",
  },
  集客改善: {
    default: "集客チャネルの固定化と来店導線の弱さ",
    エステサロン: "紹介依存とSNS来店転換の不足",
    美容室: "新規客のリピート化率が低い",
  },
  客単価アップ: {
    default: "メニュー構成と提案力の不足",
    エステサロン: "オプション提案率と店販比率の低さ",
    美容室: "カラー・トリートメントの提案不足",
  },
  リピート率向上: {
    default: "来店周期管理とフォロー体制の未整備",
  },
  業務効率化: {
    default: "施術オペレーションと予約管理の非効率",
  },
  "スタッフ育成・採用": {
    default: "育成体系と定着施策の不足",
  },
};

function runLensReviews(answers, analysis) {
  const industry = answers.industry || "美容サロン";
  return [
    {
      lensId: "consultant",
      focus: "サロン経営コンサル視点",
      insight: `${industry}では${analysis.industryContext}。${answers.client_challenge}はKPIに直結する。`,
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

function resolveRootCause(industry, challenge) {
  const row = ROOT_CAUSE_MATRIX[challenge] || {};
  return row[industry] || row.default || `${challenge}の構造的要因（推測）`;
}

function buildMeasures(challenge, productArea) {
  const area = productArea || "ソリューション";
  return [
    { priority: 1, title: "Quick Win（2週間）", body: `現状ヒアリング3項目を整理し、${challenge}のボトルネック1つを特定` },
    { priority: 2, title: "90日施策", body: `${area}を活用した${challenge}改善のPoC（小規模検証）` },
    { priority: 3, title: "仕組み化（180日）", body: "成功パターンを標準化し、全スタッフが再現できる運用へ" },
  ];
}

function buildObjections(challenge) {
  return [
    {
      concern: "本当に効果が出るか不安",
      response: `${CHALLENGE_IMPACT[challenge] || "経営改善"}をKPIで測定。2週間のQuick Winで初期効果を確認`,
    },
    {
      concern: "スタッフが使いこなせるか",
      response: "導入初期は伴走支援。操作研修＋週次フォローで定着を支援",
    },
  ];
}

/**
 * 提案書 deliverableBlueprint を組み立て
 * @param {Object} answers
 */
export function buildProposalBlueprint(answers) {
  const industry = answers.industry || "美容サロン";
  const challenge = answers.client_challenge || "売上アップ";
  const scope = answers.proposal_scope || "ソリューション提案書（初回）";
  const productArea = answers.product_area || answers._inferred?.product_area || "複合提案";
  const impact = CHALLENGE_IMPACT[challenge] || "経営課題の改善";
  const industryContext = INDUSTRY_CONTEXT[industry] || `${industry}の経営特性に合わせた提案`;
  const rootCause = resolveRootCause(industry, challenge);

  const before = answers.client_context?.trim()
    ? `【現状】${answers.client_context.slice(0, 200)}`
    : `【現状】${industry}として${challenge}に課題感がある（詳細は【要ヒアリング】）`;

  const after = `【理想】${impact}を実現。${rootCause}が解消された状態`;

  const blueprint = {
    useCaseId: "proposal_doc",
    industry,
    surfaceChallenge: challenge,
    rootCause,
    industryContext,
    proposalScope: scope,
    productArea,
    impact,
    before,
    after,
    proposalStory: `${industry}の${challenge}は、${rootCause}が背景にある。${productArea}による経営改善提案として、Before/Afterを明示する。`,
    measures: buildMeasures(challenge, productArea),
    objections: buildObjections(challenge),
    kpi: impact,
    cta: scope.includes("プレゼン")
      ? "次回商談でデモ・体験日を確定"
      : "2週間PoCの開始日と担当者を確定",
    tone: answers.tone || answers._inferred?.tone || "説得力重視",
    outputFormat: answers.output_format || "提案書全文",
    hearingNotes: answers.hearing_notes || "",
    lensReviews: [],
    chapters: [
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

  blueprint.lensReviews = runLensReviews(answers, blueprint);
  blueprint.quality = evaluateProposalBlueprint(blueprint);

  return blueprint;
}
