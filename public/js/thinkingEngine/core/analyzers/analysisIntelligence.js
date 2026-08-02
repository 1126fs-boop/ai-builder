/**
 * Analysis Intelligence — thinkingCore 統合分析レイヤー
 *
 * カテゴリKB + トレンド + 成功事例 + 修正履歴 + ルーブリック を統合。
 */

import { buildTrendsKnowledgeBlock } from "../knowledge/trendsKnowledgeStore.js";
import { buildCategoryKnowledgeBlock } from "../knowledge/categoryKnowledgeRegistry.js";
import { getCategoryRubricProfile, buildRubricQualityBlock } from "./rubricLearningRegistry.js";

/**
 * @param {string} categoryId
 * @param {Object} knowledge
 * @param {Object} challenge
 * @param {Object} purpose
 * @param {Object} [answers]
 */
export function buildAnalysisIntelligence(categoryId, knowledge, challenge, purpose, answers = {}) {
  const learned = knowledge?.learned ?? {};
  const trends = knowledge?.trends ?? [];
  const rubricProfile = getCategoryRubricProfile(categoryId);

  const revisionLessons = (learned.revisions ?? [])
    .map((r) => r.lesson)
    .filter(Boolean)
    .slice(0, 5);

  const successSummaries = (learned.successCases ?? [])
    .map((s) => s.summary || s.title)
    .filter(Boolean)
    .slice(0, 3);

  const highRatedPatterns = (learned.highRatedPrompts ?? [])
    .map((p) => p.pattern || p.hookStyle)
    .filter(Boolean)
    .slice(0, 3);

  const analysisDirectives = [];

  rubricProfile.topFocus.forEach((f) => {
    analysisDirectives.push({
      source: "rubric",
      priority: f.critical ? "high" : "medium",
      text: `${f.label}: ${f.hint}`,
    });
  });

  trends.slice(0, 3).forEach((t) => {
    analysisDirectives.push({
      source: "trend",
      priority: "medium",
      text: typeof t === "string" ? t : t.text,
    });
  });

  successSummaries.forEach((s) => {
    analysisDirectives.push({ source: "success_case", priority: "high", text: `成功事例: ${s}` });
  });

  revisionLessons.forEach((lesson) => {
    analysisDirectives.push({ source: "user_revision", priority: "high", text: `修正傾向: ${lesson}` });
  });

  highRatedPatterns.forEach((p) => {
    analysisDirectives.push({ source: "high_rated", priority: "medium", text: `高評価パターン: ${p}` });
  });

  const qualitySuccessCriteria = rubricProfile.topFocus.map(
    (f) => `${f.label}（${f.hint}）`
  );

  return {
    categoryId,
    rubricProfile,
    trends,
    revisionLessons,
    successSummaries,
    highRatedPatterns,
    analysisDirectives: analysisDirectives.slice(0, 12),
    qualitySuccessCriteria,
    categoryKnowledgeBlock: buildCategoryKnowledgeBlock(categoryId, {
      appealAxis: answers.appeal_axis,
      salesType: answers.sales_type,
      displayLocation: answers.display_location,
      surfaceChallenge: challenge?.surfaceChallenge,
    }),
    trendsBlock: buildTrendsKnowledgeBlock(categoryId),
    rubricBlock: buildRubricQualityBlock(categoryId),
  };
}

/** @param {Object} intelligence */
export function formatAnalysisIntelligenceSummary(intelligence) {
  if (!intelligence) return "";

  const lines = ["【thinkingCore 統合分析】"];

  if (intelligence.successSummaries?.length) {
    lines.push("", "■ 成功事例");
    intelligence.successSummaries.forEach((s) => lines.push(`- ${s}`));
  }

  if (intelligence.revisionLessons?.length) {
    lines.push("", "■ ユーザー修正から学習");
    intelligence.revisionLessons.forEach((l) => lines.push(`- ${l}`));
  }

  if (intelligence.highRatedPatterns?.length) {
    lines.push("", "■ 高評価パターン");
    intelligence.highRatedPatterns.forEach((p) => lines.push(`- ${p}`));
  }

  if (intelligence.rubricProfile?.topFocus?.length) {
    lines.push("", "■ 品質重点（ルーブリック）");
    intelligence.rubricProfile.topFocus.forEach((f) => lines.push(`- ${f.label}: ${f.hint}`));
  }

  return lines.join("\n");
}
