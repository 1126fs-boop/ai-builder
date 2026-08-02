/**
 * フェーズ1 — 目的分析
 */

/** カテゴリ別の成功基準テンプレート */
const SUCCESS_CRITERIA = {
  proposal: [
    "取引先の経営課題に共感から入る",
    "3層分析（表面→根本原因→インパクト）",
    "数字・ROI・回収期間を明示（不明は【】）",
    "導入ストーリー（PoC→標準化）",
    "競合差別化は経営課題解決の切り口",
    "次のアクションが1つに絞られている",
  ],
  sns: [
    "3秒で課題に触れる",
    "経営課題と訴求が結びついている",
    "保存→プロフィール遷移を促すCTAがある",
  ],
  newsletter: [
    "件名で開封したくなる（課題ワード・数字・季節性）",
    "3行以内のフックで最後まで読ませる",
    "教育型コンテンツ（売り込み前に価値提供）",
    "自然なソフトセルで商品提案へ橋渡し",
    "1通1CTA + PS に重要メッセージ",
  ],
  sales: [
    "アイスブレイク→ラポール→SPINヒアリング",
    "深掘り質問で課題の本質を把握",
    "共感→課題整理→提案→反論処理→クロージング",
    "反論処理4パターン以上",
    "ゴールに直結したクロージング（1つ）",
  ],
  image: [
    "3秒で訴求が伝わるヘッドライン",
    "コピー階層（ヘッド→サブ→ボディ→CTA）",
    "掲示場所に合ったレイアウト",
    "公式商品画像ルールを遵守",
    "季節性・経営課題を反映",
  ],
};

const CONSTRAINTS = [
  "商品スペック押し売り禁止",
  "経営課題解決を最優先",
  "自然な日本語（AIっぽい表現禁止）",
];

/**
 * @param {string} categoryId
 * @param {Object} answers
 * @param {import("../../schemas/types.js").UseCaseSchema|null} schema
 * @returns {import("../types/analysisContext.js").PurposeAnalysis}
 */
export function analyzePurpose(categoryId, answers, schema) {
  const useCaseId = schema?.useCaseId ?? categoryId;
  let result;

  switch (categoryId) {
    case "proposal":
      result = analyzeProposalPurpose(answers, useCaseId);
      break;
    case "sns":
      result = analyzeSnsPurpose(answers, useCaseId);
      break;
    case "newsletter":
      result = analyzeNewsletterPurpose(answers, useCaseId);
      break;
    case "sales":
      result = analyzeSalesPurpose(answers, useCaseId);
      break;
    case "image":
      result = analyzePopPurpose(answers, useCaseId);
      break;
    default:
      result = {
        primaryGoal: schema?.label ? `${schema.label}の成果物を作成` : "成果物を作成",
        audience: "美容サロン・クリニック",
        deliverableType: useCaseId,
        successCriteria: ["営業担当者がそのまま使える"],
        tone: answers.tone || "プロフェッショナル",
        constraints: CONSTRAINTS,
      };
  }

  return applyUserFreeInput(result, answers);
}

/** 自由記述を Purpose に反映 */
function applyUserFreeInput(purpose, answers) {
  const free = answers.free_input?.trim();
  if (!free) return purpose;
  return {
    ...purpose,
    userNotes: free,
    constraints: [...(purpose.constraints || CONSTRAINTS), `ユーザー自由記述: ${free.slice(0, 400)}`],
  };
}

function analyzeProposalPurpose(answers, useCaseId) {
  const industry = answers.industry || "取引先";
  const challenge = answers.client_challenge || "経営課題";
  const scope = answers.proposal_scope || "ソリューション提案書（初回）";
  const tone = answers.tone || answers._inferred?.tone ||
    (scope.includes("既存") ? "信頼・継続関係" : "説得力重視");

  return {
    primaryGoal: `${industry}の${challenge}を${scope}で解決する`,
    audience: `${industry}（オーナー・院長）`,
    deliverableType: useCaseId,
    successCriteria: SUCCESS_CRITERIA.proposal,
    tone,
    constraints: [...CONSTRAINTS, "商品カタログではなく経営改善提案書として書く"],
  };
}

function analyzeSnsPurpose(answers, useCaseId) {
  const fmt = answers.sns_format || "Instagram投稿";
  const appeal = answers.appeal_axis || "導入メリット";
  const target = answers.target_audience || "サロンオーナー";
  const product = answers.wam_product || "商品";

  return {
    primaryGoal: `${target}向け${fmt}で${product}の${appeal}を訴求`,
    audience: target,
    deliverableType: useCaseId,
    successCriteria: SUCCESS_CRITERIA.sns,
    tone: answers.tone || answers._inferred?.tone || "高級感・信頼感",
    constraints: [...CONSTRAINTS, "公式HP未掲載の商品創作禁止"],
  };
}

function analyzeNewsletterPurpose(answers, useCaseId) {
  const channel = answers.channel || "メルマガ（メール）";
  const purpose = answers.purpose || "フォロー・関係強化";
  const audience = answers.audience || "既存取引先";

  return {
    primaryGoal: `${audience}向け${channel}で${purpose}を達成`,
    audience,
    deliverableType: useCaseId,
    successCriteria: SUCCESS_CRITERIA.newsletter,
    tone: answers.tone || answers._inferred?.tone || "プロフェッショナル",
    constraints: [...CONSTRAINTS, "押し売り禁止"],
  };
}

function analyzeSalesPurpose(answers, useCaseId) {
  const salesType = answers.sales_type || "商談";
  const goal = answers.goal || "商談成功";
  const industry = answers.industry || "美容サロン";

  return {
    primaryGoal: `${industry}向け${salesType}で${goal}を達成`,
    audience: `${industry}オーナー・担当者`,
    deliverableType: useCaseId,
    successCriteria: SUCCESS_CRITERIA.sales,
    tone: answers.tone || answers._inferred?.tone || "プロフェッショナル",
    constraints: [...CONSTRAINTS, "商品説明から入らない"],
  };
}

function analyzePopPurpose(answers, useCaseId) {
  const usage = answers.usage || "店内POP";
  const product = answers.wam_product || "商品";
  const location = answers.display_location || "サロン店内";

  return {
    primaryGoal: `${location}向け${usage}で${product}を訴求`,
    audience: "来店客・店内スタッフ",
    deliverableType: useCaseId,
    successCriteria: SUCCESS_CRITERIA.image,
    tone: answers.style || answers._inferred?.style || "高級感・信頼感",
    constraints: [...CONSTRAINTS, "公式HP記載以外の商品創作禁止"],
  };
}
