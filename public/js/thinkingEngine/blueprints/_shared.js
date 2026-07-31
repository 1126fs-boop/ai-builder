/**
 * Blueprint 共通 — 課題分析・多視点レンズ
 */

import { CHALLENGE_IMPACT, INDUSTRY_CONTEXT } from "../domainKnowledge.js";

/** 業種×課題 → 根本原因仮説 */
export const ROOT_CAUSE_MATRIX = {
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

export function resolveRootCause(industry, challenge) {
  const row = ROOT_CAUSE_MATRIX[challenge] || {};
  return row[industry] || row.default || `${challenge || "経営課題"}の構造的要因（推測）`;
}

export function resolveIndustryContext(industry) {
  return INDUSTRY_CONTEXT[industry] || `${industry || "美容サロン"}の経営特性に合わせた訴求`;
}

export function resolveImpact(challenge) {
  return CHALLENGE_IMPACT[challenge] || "経営課題の改善";
}

export function runLensReviews(config) {
  const { lenses, context } = config;
  return lenses.map((l) => ({
    lensId: l.id,
    focus: l.focus,
    insight: typeof l.insight === "function" ? l.insight(context) : l.insight,
  }));
}

export function evaluateDeliverableQuality(checks) {
  const passed = checks.filter((c) => c.pass).length;
  return {
    score: Math.round((passed / checks.length) * 100) / 100,
    checks,
    passed,
  };
}
