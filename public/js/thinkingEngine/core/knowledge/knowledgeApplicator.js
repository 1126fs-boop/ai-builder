/**
 * Knowledge Applicator — AnalysisContext / Blueprint へのナレッジ反映
 */

import {
  getDomainKnowledgeForCategory,
  buildDomainHints,
  CREATIVE_SELLING,
  INSTAGRAM_ALGORITHM,
  SALES_COPYWRITING,
  B2B_SALES,
} from "./industryKnowledgeBase.js";
import { getSeasonalContext } from "./categoryPlaybooks.js";
import { getProInsightsForCategory } from "./proInsightsRegistry.js";

/**
 * カテゴリ別 — Blueprint 設計ヒントを生成
 * @param {string} categoryId
 * @param {Object} knowledgeSnapshot
 * @param {Object} challenge
 * @param {Object} purpose
 */
export function applyKnowledgeToBlueprint(categoryId, knowledgeSnapshot, challenge, purpose) {
  const learned = knowledgeSnapshot?.learned;
  const hints = buildDomainHints(categoryId, learned);
  const directives = [];

  if (categoryId === "sns" || categoryId === "image") {
    directives.push({
      source: "instagram_algorithm",
      text: "1行目3秒フック — 保存率を意識した構成",
    });
    directives.push({
      source: "creative_selling",
      text: `構成: ${CREATIVE_SELLING.formats.PAS}`,
    });
  }

  if (categoryId === "newsletter") {
    const season = getSeasonalContext();
    directives.push({
      source: "sales_copywriting",
      text: "件名5案 + プレヘッダー + PS — 開封率・続読率を最優先",
    });
    directives.push({
      source: "newsletter_playbook",
      text: "教育型→ソフトセル→1CTA。売り込み前に経営ノウハウを提供",
    });
    directives.push({
      source: "seasonality",
      text: `${season.label}: ${season.ownerConcerns[0]}に触れる季節性`,
    });
  }

  if (categoryId === "proposal") {
    directives.push({
      source: "b2b_sales",
      text: "SPIN → 3層課題分析 → PoC提案 → ROI明示",
    });
    directives.push({
      source: "proposal_playbook",
      text: "数字・回収期間・導入ステップ・競合差別化（経営課題切り口）",
    });
  }

  if (categoryId === "sales") {
    directives.push({
      source: "b2b_sales",
      text: "アイスブレイク → SPIN 4段階 → 深掘り → 反論4パターン → クロージング",
    });
  }

  if (categoryId === "image") {
    directives.push({
      source: "creative_selling",
      text: "3秒ヘッドライン + コピー階層 + 掲示場所に合ったレイアウト",
    });
  }

  if (categoryId === "proposal" || categoryId === "sales") {
    if (!directives.some((d) => d.source === "b2b_sales")) {
      directives.push({
        source: "b2b_sales",
        text: "SPIN ヒアリング → 経営課題 → PoC 提案",
      });
    }
  }

  if (learned?.highRatedPrompts?.length) {
    const top = learned.highRatedPrompts[0];
    if (top?.pattern) {
      directives.push({ source: "learned", text: `高評価パターン: ${top.pattern}` });
    }
  }

  if (learned?.revisions?.length) {
    const rev = learned.revisions[0];
    if (rev?.lesson) {
      directives.push({ source: "user_revision", text: rev.lesson });
    }
  }

  return {
    hints,
    directives,
    copyFramework: pickCopyFramework(categoryId),
    successCriteriaBoost: buildSuccessCriteriaBoost(categoryId, challenge, purpose),
    proInsights: getProInsightsForCategory(categoryId, challenge, purpose),
  };
}

function pickCopyFramework(categoryId) {
  if (categoryId === "sns") return CREATIVE_SELLING.formats.PAS;
  if (categoryId === "newsletter") return CREATIVE_SELLING.formats.AIDA;
  if (categoryId === "proposal" || categoryId === "sales") return CREATIVE_SELLING.formats.BAB;
  return CREATIVE_SELLING.formats.AIDA;
}

function buildSuccessCriteriaBoost(categoryId, challenge, purpose) {
  const boosts = [];
  if (categoryId === "sns" || categoryId === "image") {
    boosts.push(INSTAGRAM_ALGORITHM.principles[0]);
    if (categoryId === "image") {
      boosts.push("ヘッドライン3秒ルール + コピー階層");
    } else {
      boosts.push("保存→プロフィール遷移を促すCTA");
    }
  }
  if (categoryId === "newsletter") {
    boosts.push(SALES_COPYWRITING.principles[0]);
    boosts.push("教育型コンテンツ→自然なソフトセル");
    boosts.push(`季節性: ${getSeasonalContext().label}`);
  }
  if (categoryId === "proposal") {
    boosts.push("ROI・回収期間・KPIを数字で明示（不明は【】）");
    boosts.push(B2B_SALES.principles[2]);
    boosts.push("競合差別化は経営課題解決の切り口");
  }
  if (categoryId === "sales") {
    boosts.push("SPIN 4段階ヒアリング");
    boosts.push("反論処理4パターン以上");
    boosts.push(B2B_SALES.principles[5]);
  }
  if (challenge?.impact) {
    boosts.push(`期待インパクト「${challenge.impact}」を明示`);
  }
  if (purpose?.audience) {
    boosts.push(`ターゲット「${purpose.audience}」が自分ごと化できる訴求`);
  }
  return boosts;
}

/**
 * Prompt Builder 向け — 適用ヒントをテキスト化
 * @param {Object} applied
 */
export function formatAppliedHintsForPrompt(applied) {
  if (!applied) return "";
  const lines = [];

  if (applied.copyFramework) {
    lines.push(`【推奨コピー構成】${applied.copyFramework}`);
  }

  if (applied.directives?.length) {
    lines.push("【ナレッジ適用指示】");
    applied.directives.forEach((d) => lines.push(`- [${d.source}] ${d.text}`));
  }

  if (applied.successCriteriaBoost?.length) {
    lines.push("【品質基準（KB反映）】");
    applied.successCriteriaBoost.forEach((b) => lines.push(`- ${b}`));
  }

  if (applied.proInsights?.length) {
    lines.push("【プロが考えるポイント（KB）】");
    applied.proInsights.forEach((p) => lines.push(`- ${p}`));
  }

  return lines.join("\n");
}

/**
 * Blueprint にナレッジスナップショットを付与（deliverablePipeline から一括適用）
 * @param {Object} blueprint
 * @param {string} categoryId
 * @param {Object} knowledge
 */
export function enrichBlueprintWithKnowledge(blueprint, categoryId, knowledge) {
  const applied = knowledge?.appliedKnowledge ?? null;
  const boost = applied?.successCriteriaBoost ?? [];

  return {
    ...blueprint,
    categoryId,
    knowledgeSnapshot: knowledge ?? {},
    appliedKnowledge: applied,
    knowledgeHints: applied?.hints ?? knowledge?.appliedHints ?? [],
    analysisIntelligence: knowledge?.analysisIntelligence ?? null,
    improvementPoints: [...(blueprint.improvementPoints ?? []), ...boost.slice(0, 3)],
  };
}

export { getDomainKnowledgeForCategory, buildDomainHints };
