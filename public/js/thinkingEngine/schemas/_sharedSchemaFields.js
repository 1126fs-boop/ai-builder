/**
 * 全カテゴリ共通 — 品質基準・補足入力
 *
 * 方針: 質問数ではなく品質。入力は最小、不足時だけ深掘り。
 * 自由記述は seed の直後（Quality Gate の前）に必ず1回提示する。
 */

/** ウィザード固定 — 自由記述（任意）ステップ */
export const FREE_INPUT_QUESTION = {
  id: "free_input",
  text: "自由記述（任意）— 伝えたいことを入力してください",
  type: "text",
  placeholder: `例：
・必ず入れたい内容：「春の新メニュー」「30%OFF」
・NGワード：「激安」「最安値」
・ブランドトーン：高級感・信頼感
・デザインイメージ：ゴールド基調・ミニマル
・キャッチコピー：「結果が出る、が当たり前。」
・キャンペーン名：Spring Beauty Week
・その他：参考にしたい競合や商談メモなど`,
  optional: true,
  hint: "ここに書いた内容は品質判定とプロンプト生成の両方に反映されます。AIが自動補完する部分と、あなたが指定する部分を組み合わせます。空欄のまま「品質を確認」へ進んでも構いません。",
  qualityImpact: "high",
  _stepType: "free_input",
};

/** デフォルト品質合格ライン */
export const DEFAULT_MINIMUM_QUALITY_SCORE = 0.65;

/** 安全弁: 無限ループ防止（通常は品質達成で先に終了） */
export const ABSOLUTE_MAX_GAP_ROUNDS = 12;

/** 品質補完 — 1ラウンドあたり追加する質問数（不足項目だけ1問ずつ） */
export const SUPPLEMENT_QUESTIONS_PER_ROUND = 1;

/**
 * 品質スコア計算に自由記述ボーナスを加算
 * @param {number} baseScore
 * @param {Object} answers
 * @param {import("../core/analyzers/freeInputParser.js").FreeInputDirectives|null} [directives]
 */
export function applyFreeInputQualityBonus(baseScore, answers, directives = null) {
  const free = answers.free_input?.trim();
  if (!free) return baseScore;
  let bonus = 0.06;
  if (free.length >= 30) bonus += 0.06;
  if (free.length >= 80) bonus += 0.06;
  if (/【必須】|絶対|必ず|入れたい/.test(free)) bonus += 0.04;
  if (directives?.mustIncludeKeywords?.length) bonus += 0.04;
  if (directives?.designDirection) bonus += 0.03;
  if (directives?.ngWords?.length) bonus += 0.02;
  if (directives?.campaignName) bonus += 0.02;
  return Math.min(1, Math.round((baseScore + bonus) * 100) / 100);
}

/**
 * 品質必須フィールドの充足率（0〜1）
 * @param {Object} merged
 * @param {string[]} requiredFields
 * @param {(fieldId: string) => boolean} [isFilled]
 */
export function computeRequiredFieldCoverage(merged, requiredFields = [], isFilled = null) {
  if (!requiredFields.length) return 1;
  const check = isFilled ?? ((f) => Boolean(merged[f]?.trim()));
  const filled = requiredFields.filter((f) => check(f)).length;
  return Math.round((filled / requiredFields.length) * 100) / 100;
}

/**
 * 品質判定 — 生成可能か（満点必須ではない）
 * @param {Object} params
 */
export function evaluateQualitySufficiency({
  qualityScore,
  minimumQualityScore,
  requiredCoverage,
  missingQualityFields,
  highQuality = false,
}) {
  const sufficient =
    qualityScore >= minimumQualityScore &&
    requiredCoverage >= 0.5 &&
    (missingQualityFields.length === 0 || highQuality);
  return { sufficient };
}
