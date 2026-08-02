/**
 * Quality Gate — ウィザード向け品質ステータス表示
 * 「採点AI」ではなく「次に何を入力すれば完成か」を伝える
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
 * @param {import("../analyzers/gapAnalyzer.js").ReturnType<typeof import("../analyzers/gapAnalyzer.js").analyzeGaps>|null} gap
 * @param {string} categoryId
 * @param {import("../../schemas/types.js").SchemaQuestion[]} [supplementQuestions]
 */
export function buildQualityStatus(gap, categoryId, supplementQuestions = []) {
  if (!gap) {
    return {
      score: 0,
      headline: "",
      subline: "",
      missing: [],
      missingCount: 0,
      nextItem: null,
      readyToGenerate: false,
      coveredByFreeInput: [],
    };
  }

  const schema = getSchemaForCategory(categoryId);
  const score = Math.round((gap.qualityScore ?? 0) * 100);
  const fieldIds = gap.missingQualityFieldIds ?? [];
  const missing = fieldIds.map((id) => getShortFieldLabel(id, schema));
  const missingCount = missing.length;
  const readyToGenerate = Boolean(gap.qualitySufficient && gap.canProceedToBlueprint);

  const nextQuestion = supplementQuestions[0] ?? null;
  const nextItem = nextQuestion
    ? getShortFieldLabel(nextQuestion.id, schema)
    : missing[0] ?? null;

  let headline;
  let subline;

  if (readyToGenerate) {
    headline = `現在の品質：${score}点`;
    subline = "生成できます。次へ進んでプロンプトを作成してください。";
  } else if (missingCount === 1) {
    headline = `現在の品質：${score}点`;
    subline = "あと1項目入力すると生成できます。";
  } else if (missingCount > 1) {
    headline = `現在の品質：${score}点`;
    subline = `あと${missingCount}項目入力すると生成できます。`;
  } else {
    headline = `現在の品質：${score}点`;
    subline = "品質基準に届いていません。下記を確認してください。";
  }

  const coveredByFreeInput = [];

  return {
    score,
    headline,
    subline,
    missing,
    missingCount,
    nextItem,
    readyToGenerate,
    coveredByFreeInput,
  };
}

/**
 * ウィザード完了後の結果画面用レポート
 * @param {string} categoryId
 * @param {Object} answers
 */
export function buildWizardQualityReport(categoryId, answers) {
  const wq = answers.__wizardQuality ?? {};
  const score = wq.score ?? Math.round((answers._gapQualityScore ?? 0.7) * 100);
  const missing = wq.missing ?? [];
  const grade =
    score >= 90 ? "S" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D";
  const gradeLabels = {
    S: "最高品質 — そのまま商談で使えます",
    A: "高品質 — 微調整ですぐ使えます",
    B: "良好 — 営業現場で使える品質です",
    C: "標準 — 追加情報で更に向上します",
    D: "要改善 — ウィザードで不足項目を補完してください",
  };

  const strengths = [];
  if (answers.free_input?.trim()) strengths.push("自由記述の指定を反映");
  if (answers.client_challenge) strengths.push(`経営課題「${answers.client_challenge}」を起点に設計`);
  if (answers.wam_product) strengths.push(`商品「${answers.wam_product}」を指定`);
  if (answers.__wizardQualityCompleted) strengths.push("品質ゲート通過済み");

  let recommendation;
  if (score >= 80) {
    recommendation = "このプロンプトは ChatGPT / Claude に貼り付けてそのまま使えます。";
  } else if (missing.length > 0) {
    recommendation = `ウィザードで「${missing[0]}」を補完すると、さらに精度が上がります。`;
  } else {
    recommendation = "自由記述に必須キーワードやNGワードを追記すると、出力が安定します。";
  }

  return {
    score,
    stars: Math.max(1, Math.min(5, Math.round(score / 20))),
    grade,
    gradeLabel: gradeLabels[grade] ?? gradeLabels.B,
    missing: missing.slice(0, 4),
    strengths: strengths.slice(0, 4),
    dimensions: [
      { id: "input", label: "入力の充実度", score, max: 100 },
      { id: "solution", label: "ソリューション適合度", score: Math.min(100, score + 5), max: 100 },
      { id: "specificity", label: "具体性", score: Math.min(100, score + (answers.free_input ? 8 : 0)), max: 100 },
      { id: "usability", label: "営業現場での実用性", score: Math.min(100, score + 3), max: 100 },
    ],
    recommendation,
    recommendedAi: getRecommendedAi(categoryId),
  };
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
