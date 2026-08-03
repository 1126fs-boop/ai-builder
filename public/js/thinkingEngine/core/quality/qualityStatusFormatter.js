/**
 * Quality Gate — ウィザード向け品質ステータス表示
 * 点数は正直な評価。100点は「改善点なし」の場合のみ。
 */

import { getSchemaForCategory } from "../../schemas/index.js";

/** フィールドID → 短い表示名（営業向け） */
const SHORT_FIELD_LABELS = {
  sns_format: "SNSの形式",
  appeal_axis: "訴求したいこと",
  wam_product: "訴求する商品",
  target_audience: "ターゲット",
  catch_direction: "キャッチの方向性",
  channel: "配信チャネル",
  purpose: "配信目的",
  audience: "読者・配信先",
  value: "提供する価値",
  industry: "取引先の業種",
  client_challenge: "経営課題",
  proposal_scope: "提案書の種類",
  product_area: "商品・サービス領域",
  client_context: "取引先の状況",
  hearing_notes: "商談メモ",
  sales_type: "営業種別",
  goal: "営業目的",
  usage: "用途",
  appeal_point: "訴求ポイント",
  display_location: "掲示場所",
  size_format: "サイズ・形式",
  tone: "文章トーン",
  ai_role: "AIの役割",
  output_format: "出力形式",
  free_input: "自由記述",
};

/**
 * @param {string} fieldId
 * @param {import("../../schemas/types.js").UseCaseSchema|null} schema
 */
export function getShortFieldLabel(fieldId, schema = null) {
  if (SHORT_FIELD_LABELS[fieldId]) return SHORT_FIELD_LABELS[fieldId];
  const q =
    schema?.dynamicQuestions?.[fieldId] ??
    schema?.seedQuestions?.find((item) => item.id === fieldId);
  if (q?.text) {
    return q.text.replace(/[？?].*$/, "").trim();
  }
  return fieldId;
}

/**
 * @param {Object|null} gap
 * @param {string} categoryId
 * @param {import("../../schemas/types.js").SchemaQuestion[]} [supplementQuestions]
 */
export function buildQualityStatus(gap, categoryId, supplementQuestions = []) {
  if (!gap) {
    return emptyStatus();
  }

  const schema = getSchemaForCategory(categoryId);
  const score = gap.overallScore ?? Math.round((gap.qualityScore ?? 0) * 100);
  const dimensions = gap.qualityDimensions ?? [];
  const strengths = gap.qualityStrengths ?? [];
  const improvements = gap.qualityImprovements ?? [];
  const isPerfect = gap.isPerfectQuality ?? false;

  const missingUserIds = gap.missingUserCriticalIds ?? gap.missingQualityFieldIds ?? [];
  const missing = missingUserIds.map((id) => getShortFieldLabel(id, schema));
  const missingCount = missing.length;
  const readyToGenerate = Boolean(gap.qualitySufficient && gap.canProceedToBlueprint);

  const nextQuestion = supplementQuestions[0] ?? null;
  const nextItem = nextQuestion
    ? getShortFieldLabel(nextQuestion.id, schema)
    : missing[0] ?? null;

  let headline = `現在の品質：${score}点`;
  let subline;

  if (isPerfect) {
    subline = "十分な品質です。改善点は見当たりません。このまま生成できます。";
  } else if (readyToGenerate && score >= 88) {
    subline = "十分な高品質です。下記の改善提案は任意です。このまま生成できます。";
  } else if (readyToGenerate) {
    subline = "生成可能な品質です。さらに良くするポイントがあれば参考にしてください。";
  } else if (missingCount === 1) {
    subline = "あと1項目入力すると、より確実に生成できます。";
  } else if (missingCount > 1) {
    subline = `あと${missingCount}項目で品質が大きく向上します。`;
  } else {
    subline = "品質基準に届いていません。下記をご確認ください。";
  }

  return {
    score,
    headline,
    subline,
    missing,
    missingCount,
    nextItem,
    readyToGenerate,
    isPerfect,
    dimensions,
    strengths,
    improvements,
    coveredByFreeInput: [],
  };
}

function emptyStatus() {
  return {
    score: 0,
    headline: "",
    subline: "",
    missing: [],
    missingCount: 0,
    nextItem: null,
    readyToGenerate: false,
    isPerfect: false,
    dimensions: [],
    strengths: [],
    improvements: [],
    coveredByFreeInput: [],
  };
}

/**
 * ウィザード完了後の結果画面用レポート — 点数の水増しなし
 * @param {string} categoryId
 * @param {Object} answers
 */
export function buildWizardQualityReport(categoryId, answers) {
  const wq = answers.__wizardQuality ?? {};
  const score = wq.score ?? 70;
  const dimensions = wq.dimensions ?? defaultDimensions(score);
  const strengths = wq.strengths ?? [];
  const improvements = wq.improvements ?? [];
  const isPerfect = wq.isPerfect ?? false;

  const grade =
    score >= 95 && isPerfect ? "S" : score >= 85 ? "A" : score >= 75 ? "B" : score >= 65 ? "C" : "D";
  const gradeLabels = {
    S: "最高品質 — 改善点なし（満点評価）",
    A: "高品質 — そのまま商談で使えます",
    B: "良好 — 営業現場で使える品質です",
    C: "標準 — 追加情報で更に向上します",
    D: "要改善 — ウィザードで不足項目を補完してください",
  };

  let recommendation;
  if (isPerfect) {
    recommendation = "品質ゲート上、これ以上の改善点はありません。そのままお使いください。";
  } else if (score >= 85) {
    recommendation = "十分な高品質です。改善提案は任意 — 必要に応じて自由記述や追加入力で調整できます。";
  } else if (improvements.length > 0) {
    recommendation = `任意の改善: ${improvements[0]}`;
  } else {
    recommendation = "このプロンプトは ChatGPT / Claude に貼り付けて使用できます。";
  }

  return {
    score,
    stars: Math.max(1, Math.min(5, Math.round(score / 20))),
    grade,
    gradeLabel: gradeLabels[grade] ?? gradeLabels.B,
    missing: improvements.slice(0, 4),
    strengths: strengths.slice(0, 4),
    dimensions: dimensions.map((d) => ({ ...d, max: 100 })),
    recommendation,
    recommendedAi: getRecommendedAi(categoryId),
    isPerfect,
  };
}

function defaultDimensions(score) {
  return [
    { id: "information", label: "情報量", score },
    { id: "target", label: "ターゲットの明確さ", score },
    { id: "appeal", label: "訴求力", score },
    { id: "category_fit", label: "カテゴリ適合性", score },
    { id: "context", label: "AnalysisContext完成度", score },
  ];
}

function getRecommendedAi(categoryId) {
  const map = {
    sales: "ChatGPT (GPT-4o) — 営業台本・DM",
    proposal: "Claude — 長文提案書・構造化",
    newsletter: "ChatGPT (GPT-4o) — メール文案",
    sns: "ChatGPT (GPT-4o) — SNS投稿",
    image: "ChatGPT — 画像生成プロンプト",
  };
  return map[categoryId] ?? "ChatGPT (GPT-4o) — 汎用";
}
