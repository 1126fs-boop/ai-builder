/**
 * フェーズ2 — 経営課題分析
 */

import {
  resolveRootCause,
  resolveIndustryContext,
  resolveImpact,
} from "../../blueprints/_shared.js";
import { APPEAL_TO_CHALLENGE, PURPOSE_TO_CHALLENGE } from "../knowledge/knowledgeRegistry.js";

/** ターゲット → 業種推論 */
const AUDIENCE_TO_INDUSTRY = {
  "サロンオーナー": "エステサロン",
  "施術者・スタッフ": "エステサロン",
  "来店客（BtoC風）": "エステサロン",
  "代理店パートナー": "美容サロン",
};

/**
 * @param {string} categoryId
 * @param {Object} answers
 * @param {import("../types/analysisContext.js").PurposeAnalysis} purpose
 * @returns {import("../types/analysisContext.js").ChallengeAnalysis}
 */
export function analyzeChallenge(categoryId, answers, purpose) {
  const resolved = resolveChallengeInputs(categoryId, answers);
  const industry = resolved.industry;
  const surfaceChallenge = resolved.surfaceChallenge;
  const rootCause = resolveRootCause(industry, surfaceChallenge);
  const impact = resolveImpact(surfaceChallenge);
  const industryContext = resolveIndustryContext(industry);

  const beforeHypothesis = buildBeforeHypothesis(categoryId, answers, industry, surfaceChallenge);
  const afterHypothesis = `【理想】${impact}を実現。${rootCause}が解消された状態`;

  let confidence = 0.5;
  if (answers.industry || resolved.industryExplicit) confidence += 0.2;
  if (answers.client_challenge || resolved.challengeExplicit) confidence += 0.2;
  if (answers.client_context?.trim()) confidence += 0.15;
  if (answers.hearing_notes?.trim()) confidence += 0.1;
  if (answers.free_input?.trim()) confidence += 0.12;
  confidence = Math.min(1, Math.round(confidence * 100) / 100);

  return {
    surfaceChallenge,
    rootCause,
    impact,
    industry,
    industryContext,
    beforeHypothesis,
    afterHypothesis,
    kpiCandidates: buildKpiCandidates(surfaceChallenge),
    confidence,
  };
}

function resolveChallengeInputs(categoryId, answers) {
  switch (categoryId) {
    case "proposal":
    case "sales":
      return {
        industry: answers.industry || "美容サロン",
        surfaceChallenge: answers.client_challenge || "売上アップ",
        industryExplicit: Boolean(answers.industry),
        challengeExplicit: Boolean(answers.client_challenge),
      };

    case "sns":
      return {
        industry: AUDIENCE_TO_INDUSTRY[answers.target_audience] || "エステサロン",
        surfaceChallenge: APPEAL_TO_CHALLENGE[answers.appeal_axis] || "売上アップ",
        industryExplicit: Boolean(answers.target_audience),
        challengeExplicit: Boolean(answers.appeal_axis),
      };

    case "newsletter":
      return {
        industry: inferIndustryFromAudience(answers.audience),
        surfaceChallenge:
          PURPOSE_TO_CHALLENGE[answers.purpose] ||
          (answers.value?.includes("売上") ? "売上アップ" : "リピート率向上"),
        industryExplicit: Boolean(answers.audience),
        challengeExplicit: Boolean(answers.purpose || answers.value),
      };

    case "image":
      return {
        industry: inferIndustryFromLocation(answers.display_location),
        surfaceChallenge: APPEAL_TO_CHALLENGE[answers.appeal_point] || "売上アップ",
        industryExplicit: Boolean(answers.display_location),
        challengeExplicit: Boolean(answers.appeal_point),
      };

    default:
      return {
        industry: answers.industry || "美容サロン",
        surfaceChallenge: answers.client_challenge || "売上アップ",
        industryExplicit: false,
        challengeExplicit: false,
      };
  }
}

function inferIndustryFromAudience(audience) {
  if (!audience) return "美容サロン";
  if (audience.includes("VIP") || audience.includes("既存")) return "エステサロン";
  return "美容サロン";
}

function inferIndustryFromLocation(location) {
  if (!location) return "エステサロン";
  if (location.includes("クリニック")) return "クリニック";
  return "エステサロン";
}

function buildBeforeHypothesis(categoryId, answers, industry, challenge) {
  if (answers.client_context?.trim()) {
    return `【現状】${answers.client_context.slice(0, 200)}`;
  }
  return `【現状】${industry}として${challenge}に課題感がある（詳細は【要ヒアリング】）`;
}

function buildKpiCandidates(challenge) {
  const map = {
    売上アップ: ["月商", "客単価", "リピート率"],
    集客改善: ["新規来店数", "予約数", "SNS来店転換"],
    客単価アップ: ["平均単価", "オプション提案率", "店販比率"],
    リピート率向上: ["リピート率", "来店周期", "休眠客復活"],
    業務効率化: ["施術時間", "予約稼働率", "スタッフ残業"],
    "スタッフ育成・採用": ["定着率", "技術差", "採用数"],
  };
  return map[challenge] || ["売上", "リピート率"];
}
