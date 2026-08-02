/**
 * ルーブリック学習レジストリ — 品質判断基準をカテゴリ別に育てる
 */

import { getBaseRubricProfile } from "./categoryRubricProfiles.js";
import { getRubricAdjustments, upsertRubricAdjustment } from "./rubricLearningStore.js";
import { LEARNED_KNOWLEDGE_ENABLED } from "../knowledge/knowledgeTypes.js";

const REVISION_TO_CRITERION = {
  "3秒フック": ["hook_3sec", "headline_3sec"],
  ROI: ["numbers_roi", "revenue_sim"],
  CTA: ["cta_single", "cta_action", "closing"],
  括弧強調: ["subject_open", "copy_quality", "hook_3sec"],
  詳細化: ["challenge_analysis", "education", "read_through"],
  数字: ["numbers_roi", "revenue_sim", "copy_quality"],
};

const CHECK_TO_CRITERION = {
  product: "product_image",
  appeal: "challenge_link",
  copy: "copy_quality",
  subject: "subject_open",
  education: "education",
  hearing: "hearing_spin",
  icebreak: "icebreak",
  objection: "objection",
  headline: "headline_3sec",
  layout: "creative_original",
  kpi: "numbers_roi",
  story: "story",
  numbers_roi: "numbers_roi",
  revenue_sim: "revenue_sim",
};

/** @param {string} categoryId */
export function getCategoryRubricProfile(categoryId) {
  const base = getBaseRubricProfile(categoryId);
  const adjustments = LEARNED_KNOWLEDGE_ENABLED ? getRubricAdjustments(categoryId) : [];

  const dimensions = base.dimensions.map((dim) => {
    const adj = adjustments.find((a) => a.criterionId === dim.id);
    return {
      ...dim,
      effectiveWeight: Math.min(0.3, dim.weight + (adj?.boost ?? 0)),
      learnedHint: adj?.hint ?? null,
      learnCount: adj?.count ?? 0,
    };
  });

  dimensions.sort((a, b) => b.effectiveWeight - a.effectiveWeight);

  const topFocus = dimensions.slice(0, 4).map((d) => ({
    id: d.id,
    label: d.label,
    hint: d.learnedHint || d.hint,
    weight: d.effectiveWeight,
    critical: d.critical,
  }));

  return {
    categoryId,
    label: base.label,
    passThreshold: base.passThreshold,
    dimensions,
    topFocus,
    adjustmentCount: adjustments.length,
    learnedCriteria: adjustments.slice(0, 5),
  };
}

/** @param {string} categoryId @param {Object} qualityGate */
export function learnRubricFromQualityGate(categoryId, qualityGate) {
  if (!LEARNED_KNOWLEDGE_ENABLED || !qualityGate?.failedChecks?.length) return;

  for (const check of qualityGate.failedChecks) {
    const criterionId = CHECK_TO_CRITERION[check.id] ?? inferCriterionFromLabel(check.label);
    if (!criterionId) continue;
    upsertRubricAdjustment(categoryId, criterionId, {
      hint: check.hint || `品質不足: ${check.label}`,
      source: "quality_gate",
      boostDelta: 0.025,
    });
  }
}

/** @param {string} categoryId @param {string} lesson */
export function learnRubricFromUserEdit(categoryId, lesson) {
  if (!LEARNED_KNOWLEDGE_ENABLED || !lesson) return;

  for (const [keyword, criterionIds] of Object.entries(REVISION_TO_CRITERION)) {
    if (!lesson.includes(keyword)) continue;
    for (const criterionId of criterionIds) {
      upsertRubricAdjustment(categoryId, criterionId, {
        hint: `ユーザー修正傾向: ${lesson}`,
        source: "user_revision",
        boostDelta: 0.03,
      });
    }
  }
}

/** @param {string} categoryId @param {string} prompt */
export function learnRubricFromHighRating(categoryId, prompt) {
  if (!LEARNED_KNOWLEDGE_ENABLED || !prompt) return;

  const profile = getBaseRubricProfile(categoryId);
  for (const dim of profile.dimensions) {
    if (dim.critical && promptIncludesCriterion(prompt, dim.id)) {
      upsertRubricAdjustment(categoryId, dim.id, {
        hint: `高評価パターン: ${dim.label}が良好`,
        source: "high_rating",
        boostDelta: 0.015,
      });
    }
  }
}

function promptIncludesCriterion(prompt, criterionId) {
  const keywords = {
    hook_3sec: ["3秒", "フック", "1行目"],
    save_design: ["保存", "シェア"],
    subject_open: ["件名", "開封"],
    numbers_roi: ["ROI", "回収", "○%"],
    hearing_spin: ["SPIN", "ヒアリング"],
    product_image: ["公式画像", "AI生成禁止"],
    headline_3sec: ["ヘッドライン", "3秒"],
  };
  const keys = keywords[criterionId];
  if (!keys) return false;
  return keys.some((k) => prompt.includes(k));
}

function inferCriterionFromLabel(label) {
  if (!label) return null;
  if (label.includes("件名")) return "subject_open";
  if (label.includes("フック") || label.includes("3秒")) return "hook_3sec";
  if (label.includes("ROI") || label.includes("KPI")) return "numbers_roi";
  if (label.includes("ヒアリング")) return "hearing_spin";
  if (label.includes("CTA")) return "cta_single";
  if (label.includes("商品")) return "product_image";
  return null;
}

/** @param {string} categoryId */
export function buildRubricQualityBlock(categoryId) {
  const profile = getCategoryRubricProfile(categoryId);
  const lines = [
    `【品質ルーブリック — ${profile.label}（合格ライン ${Math.round(profile.passThreshold * 100)}%）】`,
    "以下の基準でアウトプット品質を判断し、プロンプトに反映してください。",
    "",
  ];

  profile.topFocus.forEach((d, i) => {
    const critical = d.critical ? " ★重要" : "";
    lines.push(`${i + 1}. ${d.label}${critical} — ${d.hint}`);
  });

  if (profile.learnedCriteria.length) {
    lines.push("", "【学習済み品質重点（このカテゴリで過去に不足が多かった項目）】");
    profile.learnedCriteria.forEach((a) => {
      lines.push(`- ${a.criterionId}: ${a.hint}（学習${a.count}回）`);
    });
  }

  return lines.join("\n");
}
