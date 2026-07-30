/**
 * AI Builder v1.0 — プロンプト品質診断 & AI評価システム
 *
 * 回答内容に基づき、ルールベースで品質を評価します。
 * 将来 LLM API 連携に差し替え可能なインターフェース。
 */

import { getQuestions } from "./questions.js";

/** @typedef {{ id: string, label: string, score: number, max: number }} Dimension */

/** @typedef {Object} QualityReport
 * @property {number} score
 * @property {number} stars
 * @property {string} grade
 * @property {string} gradeLabel
 * @property {string[]} missing
 * @property {string[]} strengths
 * @property {Dimension[]} dimensions
 * @property {string} recommendation
 * @property {string} recommendedAi
 */

/** カテゴリ別の推奨 AI */
const RECOMMENDED_AI = {
  sales: "ChatGPT (GPT-4o) — 営業台本・DM",
  proposal: "Claude — 長文提案書・構造化",
  newsletter: "ChatGPT (GPT-4o) — メール文案",
  training: "Claude — ロープレ台本・研修資料",
  sns: "ChatGPT (GPT-4o) — SNS投稿",
  image: "Gemini — 画像生成プロンプト",
  agent: "Claude — システムプロンプト設計",
  analysis: "Claude — 分析・レポート",
  other: "ChatGPT (GPT-4o) — 汎用",
};

/** 重要度の高い回答キー */
const KEY_FIELDS = ["industry", "client_challenge", "goal", "ai_role", "tone", "output_format"];

/** グレード定義 */
const GRADES = [
  { min: 90, grade: "S", label: "最高品質 — そのまま商談で使えます" },
  { min: 80, grade: "A", label: "高品質 — 微調整ですぐ使えます" },
  { min: 70, grade: "B", label: "良好 — 追加情報で更に向上します" },
  { min: 60, grade: "C", label: "標準 — 不足項目を補完してください" },
  { min: 0, grade: "D", label: "要改善 — 質問に戻って回答を追加してください" },
];

/**
 * プロンプト品質を診断
 * @param {string} categoryId
 * @param {Object<string,string>} answers
 * @returns {QualityReport}
 */
export function diagnoseQuality(categoryId, answers) {
  const questions = getQuestions(categoryId);
  const dimensions = computeDimensions(categoryId, answers, questions);
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  );

  const { grade, gradeLabel } = getGrade(overallScore);
  const missing = findMissingInfo(categoryId, answers, questions);
  const strengths = findStrengths(answers, questions);
  const stars = scoreToStars(overallScore);

  return {
    score: overallScore,
    stars,
    grade,
    gradeLabel,
    missing,
    strengths,
    dimensions,
    recommendation: buildRecommendation(overallScore, missing, categoryId),
    recommendedAi: RECOMMENDED_AI[categoryId] || RECOMMENDED_AI.other,
  };
}

/** 4軸評価 */
function computeDimensions(categoryId, answers, questions) {
  const hasIndustry = Boolean(answers.industry);
  const hasChallenge = Boolean(answers.client_challenge);
  const hasExtra = Boolean(answers.extra_info && answers.extra_info.length > 10);
  const requiredFilled = questions
    .filter((q) => !q.optional)
    .every((q) => answers[q.id] && answers[q.id].length > 0);
  const filledCount = Object.values(answers).filter((v) => v && v.length > 0).length;
  const fillRate = questions.length ? filledCount / questions.length : 0;

  return [
    {
      id: "solution",
      label: "ソリューション適合度",
      score: clamp(hasChallenge ? 85 + (hasExtra ? 10 : 0) : hasIndustry ? 60 : 40),
      max: 100,
    },
    {
      id: "specificity",
      label: "具体性",
      score: clamp(50 + (hasIndustry ? 20 : 0) + (hasExtra ? 25 : 0) + fillRate * 10),
      max: 100,
    },
    {
      id: "usability",
      label: "実用性",
      score: clamp(requiredFilled ? 80 + (answers.tone ? 10 : 0) + (answers.output_format ? 10 : 0) : 45),
      max: 100,
    },
    {
      id: "b2b",
      label: "BtoB文脈",
      score: clamp(hasIndustry ? 75 + (hasChallenge ? 20 : 0) : 35),
      max: 100,
    },
  ];
}

/** 不足情報を特定 */
function findMissingInfo(categoryId, answers, questions) {
  const missing = [];

  if (!answers.industry) {
    missing.push("取引先の業種（エステ・美容室・クリニック等）");
  }
  if (!answers.client_challenge) {
    missing.push("お客様の経営課題（売上・集客・リピート等）");
  }
  if (!answers.extra_info || answers.extra_info.length < 5) {
    missing.push("取引先名・具体的状況・競合情報などの追加情報");
  }

  const keyLabels = {
    goal: "営業目的",
    ai_role: "AIの役割",
    tone: "文章トーン",
    output_format: "出力形式",
    sales_type: "営業種別",
    proposal_type: "提案書の種類",
  };

  for (const [key, label] of Object.entries(keyLabels)) {
    const q = questions.find((x) => x.id === key);
    if (q && !q.optional && !answers[key]) {
      missing.push(label);
    }
  }

  if (categoryId === "sales" && !answers.sales_type) {
    missing.push("営業種別（テレアポ・商談・DM等）");
  }

  return missing.slice(0, 4);
}

/** 強みを特定 */
function findStrengths(answers, questions) {
  const strengths = [];

  if (answers.industry) strengths.push(`${answers.industry}向けに最適化`);
  if (answers.client_challenge) strengths.push(`経営課題「${answers.client_challenge}」を起点に設計`);
  if (answers.extra_info && answers.extra_info.length > 10) strengths.push("取引先の具体情報を反映");
  if (answers.tone) strengths.push(`トーン「${answers.tone}」を指定`);
  if (answers.ai_role) strengths.push(`AI役割「${answers.ai_role}」を明確化`);

  const filled = Object.keys(answers).filter((k) => answers[k]).length;
  if (filled >= questions.length - 1) strengths.push("質問への回答が充実");

  return strengths.slice(0, 4);
}

/** 改善提案 */
function buildRecommendation(score, missing, categoryId) {
  if (score >= 90) {
    return "このプロンプトはそのまま ChatGPT / Claude に貼り付けて使用できます。";
  }
  if (score >= 75) {
    return `「追加情報」に取引先名や具体的な数字を加えると、さらに精度が上がります。`;
  }
  if (missing.length > 0) {
    return `「${missing[0]}」を入力して再生成すると、品質スコアが大幅に向上します。`;
  }
  return "質問に戻って、取引先の業種と経営課題を入力してください。";
}

function getGrade(score) {
  const g = GRADES.find((x) => score >= x.min) || GRADES[GRADES.length - 1];
  return { grade: g.grade, gradeLabel: g.label };
}

function scoreToStars(score) {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 45) return 2;
  return 1;
}

function clamp(n) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** @param {number} score @returns {string} */
export function formatStars(score) {
  const stars = scoreToStars(score);
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}
