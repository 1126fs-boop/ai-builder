/**
 * 学習型 Knowledge — レジストリ（永続化対応）
 *
 * 使えば使うほど品質が上がるプロンプト生成AIの基盤。
 */

import { generatePersistableId } from "../types/persistable.js";
import { LEARNED_KNOWLEDGE_ENABLED, HIGH_RATED_SCORE_THRESHOLD } from "./knowledgeTypes.js";
import { loadLearningRecords, saveLearningRecords, MAX_RECORDS } from "./learningStorage.js";
import { ingestIndustryInsightAsTrend } from "./trendsKnowledgeStore.js";
import {
  learnRubricFromUserEdit,
  learnRubricFromHighRating,
} from "../quality/rubricLearningRegistry.js";

/**
 * @typedef {Object} LearningRecord
 * @property {string} id
 * @property {"success_case"|"user_revision"|"high_rated_prompt"|"industry_insight"|"user_rating"} type
 * @property {string} categoryId
 * @property {Object} payload
 * @property {number} [score]
 * @property {string} createdAt
 */

/** @type {LearningRecord[]} */
let records = [];
let initialized = false;

/** 起動時に localStorage から読み込み */
export function initLearningRegistry() {
  if (initialized) return;
  records = loadLearningRecords();
  initialized = true;
  console.log("[learningRegistry] loaded", records.length, "records");
}

function persist() {
  saveLearningRecords(records.slice(0, MAX_RECORDS));
}

function normalizeRecord(type, entry) {
  return {
    id: entry.id ?? generatePersistableId("lrn"),
    type,
    categoryId: entry.categoryId ?? "general",
    payload: entry.payload ?? entry,
    score: entry.score ?? null,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
}

function pushRecord(record) {
  records.unshift(record);
  records = records.slice(0, MAX_RECORDS);
  persist();
}

export function registerSuccessCase(entry) {
  pushRecord(normalizeRecord("success_case", entry));
}

export function registerUserRevision(entry) {
  pushRecord(
    normalizeRecord("user_revision", {
      ...entry,
      payload: {
        ...entry.payload,
        lesson: entry.lesson ?? entry.payload?.lesson ?? "ユーザー修正を反映",
        originalExcerpt: entry.originalExcerpt?.slice(0, 200),
        revisedExcerpt: entry.revisedExcerpt?.slice(0, 200),
      },
    })
  );
}

export function registerHighRatedPrompt(entry) {
  pushRecord(normalizeRecord("high_rated_prompt", entry));
}

export function registerIndustryInsight(entry) {
  pushRecord(normalizeRecord("industry_insight", entry));
}

/** ユーザー評価（お気に入り・明示評価） */
export function registerUserRating(entry) {
  pushRecord(normalizeRecord("user_rating", entry));
}

/**
 * プロンプト生成完了時 — 品質スコアが高ければ学習
 * @param {Object} event
 */
export function learnFromGeneration(event) {
  if (!LEARNED_KNOWLEDGE_ENABLED) return;

  const { categoryId, prompt, quality, answers, pattern } = event;
  const score = quality?.score ?? 0;

  if (score >= HIGH_RATED_SCORE_THRESHOLD) {
    registerHighRatedPrompt({
      categoryId,
      score: score / 100,
      payload: {
        pattern: pattern ?? extractPattern(prompt),
        hookStyle: detectHookStyle(prompt),
        categoryId,
        qualityScore: score,
        answersSummary: summarizeAnswers(answers),
      },
    });
    learnRubricFromHighRating(categoryId, prompt);
  }
}

/**
 * 保存・お気に入り時 — 評価として学習
 */
export function learnFromSave(item, options = {}) {
  if (!LEARNED_KNOWLEDGE_ENABLED) return;

  const score = item.quality?.score ?? 0;
  const isFavorite = options.isFavorite ?? item.isFavorite;

  if (isFavorite || score >= HIGH_RATED_SCORE_THRESHOLD) {
    registerUserRating({
      categoryId: item.category,
      score: isFavorite ? 1 : score / 100,
      payload: {
        title: item.title,
        categoryId: item.category,
        promptExcerpt: item.prompt?.slice(0, 300),
        qualityScore: score,
        isFavorite,
        pattern: extractPattern(item.prompt),
      },
    });

    if (score >= HIGH_RATED_SCORE_THRESHOLD) {
      registerHighRatedPrompt({
        categoryId: item.category,
        score: score / 100,
        payload: {
          pattern: extractPattern(item.prompt),
          title: item.title,
          qualityScore: score,
        },
      });
      learnRubricFromHighRating(item.category, item.prompt);
    }

    if (isFavorite && item.prompt) {
      learnRubricFromHighRating(item.category, item.prompt);
    }
  }
}

/**
 * ユーザー修正・採用時 — カテゴリ別に学習
 * @param {{ categoryId: string, original: string, revised: string, action?: string }} event
 */
export function learnFromUserEdit(event) {
  if (!LEARNED_KNOWLEDGE_ENABLED) return;

  const { categoryId, original, revised, action = "edit" } = event;
  if (!original || !revised || original.trim() === revised.trim()) return;

  const lesson = inferRevisionLesson(original, revised);
  registerUserRevision({
    categoryId,
    lesson,
    payload: {
      lesson,
      action,
      categoryId,
      hookStyle: detectHookStyle(revised),
      pattern: extractPattern(revised),
      originalExcerpt: original.slice(0, 300),
      revisedExcerpt: revised.slice(0, 300),
    },
  });

  registerHighRatedPrompt({
    categoryId,
    score: 0.85,
    payload: {
      pattern: extractPattern(revised),
      hookStyle: detectHookStyle(revised),
      source: "user_revision",
      qualityScore: 85,
    },
  });

  if (lesson) {
    registerIndustryInsight({
      categoryId,
      payload: { summary: lesson, source: "user_revision" },
    });
    ingestIndustryInsightAsTrend(categoryId, lesson);
    learnRubricFromUserEdit(categoryId, lesson);
  }
}

function inferRevisionLesson(original, revised) {
  const added = [];
  if (revised.length > original.length * 1.1) added.push("詳細化・具体化の傾向");
  if (revised.includes("【") && !original.includes("【")) added.push("括弧強調の追加");
  if (revised.includes("3秒") && !original.includes("3秒")) added.push("3秒フックの重視");
  if (revised.includes("ROI") && !original.includes("ROI")) added.push("ROI・数字訴求の追加");
  if (revised.includes("CTA") && !original.includes("CTA")) added.push("CTA明確化");
  if (added.length) return added.join("、");
  return "ユーザー修正を反映（トーン・構成の調整）";
}

/**
 * カテゴリ別学習統計
 * @param {string} categoryId
 */
export function getCategoryLearningStats(categoryId) {
  initLearningRegistry();
  const relevant = records.filter((r) => r.categoryId === categoryId);
  return {
    categoryId,
    total: relevant.length,
    byType: relevant.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {}),
  };
}

function extractPattern(prompt) {
  if (!prompt) return "不明";
  if (prompt.includes("経営課題")) return "経営課題起点";
  if (prompt.includes("Before/After") || prompt.includes("Before")) return "Before/After型";
  if (prompt.includes("数字") || prompt.includes("○%")) return "数字訴求型";
  if (prompt.includes("共感")) return "課題共感型";
  return "標準構成";
}

function detectHookStyle(prompt) {
  if (!prompt) return "標準";
  if (prompt.includes("3秒")) return "3秒フック";
  if (prompt.includes("【")) return "括弧強調";
  return "叙述型";
}

function summarizeAnswers(answers) {
  if (!answers) return "";
  return Object.entries(answers)
    .filter(([k]) => !k.startsWith("__"))
    .slice(0, 4)
    .map(([k, v]) => `${k}:${String(v).slice(0, 30)}`)
    .join(", ");
}

export function getLearnedInsightsForAnalysis(categoryId) {
  initLearningRegistry();

  if (!LEARNED_KNOWLEDGE_ENABLED) {
    return emptyLearned();
  }

  const categoryRecords = records.filter((r) => r.categoryId === categoryId);
  const generalRecords = records.filter((r) => r.categoryId === "general").slice(0, 3);
  const relevant = [...categoryRecords, ...generalRecords];

  const successCases = relevant
    .filter((r) => r.type === "success_case")
    .slice(0, 5)
    .map((r) => r.payload);

  const highRatedPrompts = relevant
    .filter(
      (r) =>
        (r.type === "high_rated_prompt" || r.type === "user_rating") &&
        (r.score ?? 0) >= 0.75
    )
    .slice(0, 5)
    .map((r) => r.payload);

  const revisions = relevant
    .filter((r) => r.type === "user_revision")
    .slice(0, 5)
    .map((r) => r.payload);

  const industryInsights = relevant
    .filter((r) => r.type === "industry_insight")
    .slice(0, 5)
    .map((r) => r.payload);

  const hints = [];
  if (successCases.length) hints.push("過去の成功事例パターンを Blueprint に反映");
  if (highRatedPrompts.length) hints.push("高評価プロンプトの構成・フック型を参考にする");
  if (revisions.length) hints.push("ユーザー修正傾向（トーン・構成・CTA）を品質改善に活用");

  return {
    enabled: true,
    successCases,
    highRatedPrompts,
    revisions,
    industryInsights,
    hints,
    recordCount: relevant.length,
  };
}

function emptyLearned() {
  return {
    enabled: false,
    successCases: [],
    highRatedPrompts: [],
    revisions: [],
    industryInsights: [],
    hints: [],
    recordCount: 0,
  };
}

export function listLearningRecords() {
  initLearningRegistry();
  return [...records];
}

export function getLearningStats() {
  initLearningRegistry();
  return {
    total: records.length,
    byType: records.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {}),
  };
}
