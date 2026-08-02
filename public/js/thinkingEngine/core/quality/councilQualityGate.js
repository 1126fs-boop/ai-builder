/**
 * Lens Council 品質ゲート — thinkingCore 内部
 *
 * AI会議の結果をルーブリックで判定し、基準未満なら
 * 改善フィードバック → 再議論 を内部ループで繰り返す。
 */

import { getCategoryRubricProfile } from "./rubricLearningRegistry.js";
import { measureOpinionDiversity } from "../analyzers/lensPersonas.js";

/** Council 品質合格ライン */
export const COUNCIL_PASS_THRESHOLD = 0.72;

/** 内部改善ループ最大回数 */
export const MAX_COUNCIL_QUALITY_ITERATIONS = 3;

/**
 * Lens Council 出力をルーブリックで評価
 * @param {string} categoryId
 * @param {{ lensReviews: Object[], synthesis: Object, purpose: Object, challenge: Object }} councilOutput
 */
export function evaluateCouncilQuality(categoryId, councilOutput) {
  const { lensReviews = [], synthesis = {}, purpose = {}, challenge = {} } = councilOutput;
  const profile = getCategoryRubricProfile(categoryId);
  const passThreshold = Math.min(profile.passThreshold ?? 0.75, COUNCIL_PASS_THRESHOLD);

  const corpus = buildCorpus(lensReviews, synthesis, purpose, challenge);

  const checks = profile.dimensions.map((dim) => {
    const pass = checkDimension(dim.id, corpus, councilOutput);
    return {
      id: dim.id,
      label: dim.label,
      pass,
      critical: dim.critical,
      hint: dim.hint,
      weight: dim.weight,
    };
  });

  let weightedSum = 0;
  let weightTotal = 0;
  for (const c of checks) {
    weightedSum += (c.pass ? 1 : 0) * c.weight;
    weightTotal += c.weight;
  }

  const score = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) / 100 : 0.5;
  const failedChecks = checks.filter((c) => !c.pass);
  const criticalFailed = failedChecks.filter((c) => c.critical);

  const improvements = failedChecks.map((c) => `[${c.label}] ${c.hint}`);

  // 最低限の構造チェック
  if (!synthesis.finalDirection?.trim()) {
    improvements.unshift("[統合] 設計方向（finalDirection）を明確化する");
  }
  if (lensReviews.length < 2) {
    improvements.unshift("[AI会議] 2 Lens 以上のレビューが必要");
  }

  const structuralOk = synthesis.finalDirection?.trim() && lensReviews.length >= 2;
  const diversity = measureOpinionDiversity(
    lensReviews.filter((r) => r.round === 1 || r.round === 3).slice(0, 6)
  );
  const debateDepth = lensReviews.filter((r) => r.stance === "counter").length >= 2;
  const diversityOk = diversity >= 0.25;

  if (!diversityOk) {
    improvements.unshift(`[AI会議] Lens意見の多様性不足（${Math.round(diversity * 100)}%）— 専門性の違いを明確化`);
  }
  if (!debateDepth) {
    improvements.unshift("[AI会議] 反論・対立が不足 — 各Lensの専門視点で再議論");
  }

  const passed =
    structuralOk &&
    score >= passThreshold &&
    criticalFailed.length === 0 &&
    diversityOk &&
    debateDepth;

  return {
    passed,
    score,
    passThreshold,
    checks,
    failedChecks,
    improvements: [...new Set(improvements)].slice(0, 8),
    rubricLabel: profile.label,
    opinionDiversity: diversity,
    debateDepth,
  };
}

function buildCorpus(lensReviews, synthesis, purpose, challenge) {
  const parts = [
    synthesis.finalDirection,
    synthesis.councilSummary,
    ...(synthesis.agreedPoints ?? []),
    ...(synthesis.promptBuilderHints ?? []),
    purpose.primaryGoal,
    purpose.audience,
    challenge.surfaceChallenge,
    challenge.impact,
    ...lensReviews.map((r) => `${r.insight} ${r.recommendation}`),
  ];
  return parts.filter(Boolean).join(" ");
}

/**
 * ルーブリック次元ごとのヒューリスティック判定
 * @param {string} dimensionId
 * @param {string} corpus
 * @param {Object} councilOutput
 */
function checkDimension(dimensionId, corpus, councilOutput) {
  const { synthesis, lensReviews, purpose, challenge } = councilOutput;
  const c = corpus;

  const has = (...words) => words.some((w) => c.includes(w));

  switch (dimensionId) {
    case "hook_3sec":
    case "headline_3sec":
      return has("3秒", "フック", "1行目", "ヘッド", "スクロール");
    case "save_design":
      return has("保存", "カルーセル", "リール", "シェア");
    case "challenge_link":
      return has("経営課題", "KPI", challenge.surfaceChallenge || "課題", "Before/After");
    case "copy_quality":
      return has("コピー", "PAS", "AIDA", "CTA", "キャッチ");
    case "creative_original":
      return has("オリジナル", "HP再現", "新規", "デザイン") && !c.includes("HP模倣");
    case "product_image":
      return has("公式", "商品画像", "AI生成禁止", "upload");
    case "cta_single":
    case "cta_action":
      return has("CTA", "1つ", "プロフィール", "DM", "問い合わせ", "資料");
    case "b2b_tone":
      return has("サロンオーナー", "BtoB", "押し売り禁止", purpose.audience || "オーナー");
    case "lens_review":
      return lensReviews.length >= 3;
    case "subject_open":
      return has("件名", "開封", "課題", "数字");
    case "read_through":
      return has("構成", "教育", "PS", "CTA");
    case "education":
      return has("教育", "価値提供", "ノウハウ");
    case "soft_sell":
      return has("ソフト", "自然", "橋渡し");
    case "seasonality":
      return has("季節", "繁忙", "閑散") || true; // 任意次元
    case "b2b_value":
      return has("オーナー", "明日", "現場", "経営");
    case "tone_trust":
      return has("信頼", "押し売り禁止", "自然");
    case "challenge_analysis":
      return has("根本原因", "インパクト", challenge.surfaceChallenge || "課題");
    case "numbers_roi":
    case "revenue_sim":
      return has("ROI", "数字", "回収", "【】", "KPI", "試算");
    case "implementation":
      return has("PoC", "導入", "標準化", "展開");
    case "differentiation":
      return has("差別化", "競合", "独自");
    case "before_after":
      return has("Before", "After", "改善");
    case "objections":
      return has("懸念", "反論", "リスク");
    case "icebreak":
      return has("アイスブレイク", "共感", "冒頭");
    case "hearing_spin":
      return has("SPIN", "ヒアリング", "深掘り");
    case "deep_dive":
      return has("深掘り", "KPI", "決裁");
    case "objection":
      return has("反論", "切り返し", "懸念");
    case "closing":
      return has("クロージング", "CTA", "次のステップ");
    case "type_fit":
      return has("商談", "テレアポ", "DM", "LINE");
    case "no_pitch_first":
      return has("共感", "ヒアリング", "商品説明から入らない", "経営課題起点");
    case "story":
      return has("ストーリー", "Before", "Bridge", "After");
    case "appeal_order":
      return has("訴求", "フック", "価値");
    case "store_visibility":
      return has("視認", "店頭", "文字");
    case "salon_promo":
      return has("サロン", "高級", "信頼");
    case "copy_hierarchy":
      return has("ヘッド", "サブ", "階層", "コピー");
    default:
      return synthesis.agreedPoints?.length >= 2;
  }
}

/**
 * 品質ループ付き Lens Council 実行
 * @param {string} categoryId
 * @param {Object} input
 * @param {{ runCouncil: Function, maxIterations?: number }} deps
 */
export function runCouncilQualityLoop(categoryId, input, deps) {
  const maxIterations = deps.maxIterations ?? MAX_COUNCIL_QUALITY_ITERATIONS;
  /** @type {Object[]} */
  const qualityHistory = [];
  let qualityFeedback = null;
  let lastResult = null;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const result = deps.runCouncil(categoryId, input, {
      qualityFeedback,
      iteration,
      isRetry: iteration > 0,
    });

    const quality = evaluateCouncilQuality(categoryId, {
      lensReviews: result.lensReviews,
      synthesis: result.synthesis,
      purpose: input.purpose,
      challenge: input.challenge,
    });

    qualityHistory.push({
      iteration: iteration + 1,
      passed: quality.passed,
      score: quality.score,
      improvements: quality.improvements,
    });

    lastResult = { ...result, qualityGate: quality };

    if (quality.passed) {
      return {
        ...lastResult,
        qualityHistory,
        councilIterations: iteration + 1,
        qualityPassed: true,
      };
    }

    qualityFeedback = quality.improvements;
  }

  return {
    ...lastResult,
    qualityHistory,
    councilIterations: maxIterations,
    qualityPassed: false,
  };
}
