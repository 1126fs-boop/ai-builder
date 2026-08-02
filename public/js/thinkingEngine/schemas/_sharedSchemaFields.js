/**
 * 全カテゴリ共通 — 品質基準・補足入力
 *
 * 方針: 質問数ではなく品質。入力は最小、不足時だけ深掘り。
 */

/** 品質不足時のみ出す補足入力（seed には含めない） */
export const FREE_INPUT_QUESTION = {
  id: "free_input",
  text: "品質向上のため — 補足があれば教えてください",
  type: "text",
  placeholder:
    "例: 絶対に入れたい文言 / デザインのイメージ / 商談で聞いたこと など（空欄のまま次へ進めます）",
  optional: true,
  hint: "AIが品質を上げるために必要な情報があれば入力してください。なくても構いません。",
  qualityImpact: "high",
};

/** デフォルト品質合格ライン */
export const DEFAULT_MINIMUM_QUALITY_SCORE = 0.65;

/** 安全弁: 無限ループ防止（通常は品質達成で先に終了） */
export const ABSOLUTE_MAX_GAP_ROUNDS = 10;

/** 1ラウンドあたりの追問上限（品質不足時のみ緩和） */
export const DEFAULT_MAX_DYNAMIC_PER_ROUND = 3;
export const EXPANDED_MAX_DYNAMIC_PER_ROUND = 6;

/**
 * 品質スコア計算に自由記述ボーナスを加算
 * @param {number} baseScore
 * @param {Object} answers
 */
export function applyFreeInputQualityBonus(baseScore, answers) {
  const free = answers.free_input?.trim();
  if (!free) return baseScore;
  let bonus = 0.06;
  if (free.length >= 30) bonus += 0.06;
  if (free.length >= 80) bonus += 0.06;
  if (/【必須】|絶対|必ず|入れたい/.test(free)) bonus += 0.04;
  return Math.min(1, Math.round((baseScore + bonus) * 100) / 100);
}

/**
 * 品質必須フィールドの充足率（0〜1）
 * @param {Object} merged
 * @param {string[]} requiredFields
 */
export function computeRequiredFieldCoverage(merged, requiredFields = []) {
  if (!requiredFields.length) return 1;
  const filled = requiredFields.filter((f) => Boolean(merged[f]?.trim())).length;
  return Math.round((filled / requiredFields.length) * 100) / 100;
}

/**
 * 品質判定 — 単一の真実
 * @param {Object} params
 */
export function evaluateQualitySufficiency({
  qualityScore,
  minimumQualityScore,
  requiredCoverage,
  missingQualityFields,
}) {
  const sufficient =
    qualityScore >= minimumQualityScore &&
    requiredCoverage >= 0.75 &&
    missingQualityFields.length === 0;
  return { sufficient };
}
