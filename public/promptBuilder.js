/**
 * AI Builder v1.0 — プロンプト生成
 *
 * 美容 BtoB ソリューション営業向けの高品質プロンプトを生成。
 * 構造化テンプレート + context.js 前提を適用。
 */

import { wrapPrompt } from "./context.js";
import { diagnoseQuality, formatStars } from "./qualityEngine.js";
import {
  WAM_IMAGE_GENERATION_RULES,
  buildImageGenerationInstructions,
  getImagePromptFooter,
} from "./wamImageContext.js";
import { resolveProductFromAnswers, NO_PRODUCT_OPTION } from "./wamProducts.js";
import {
  structuredPro,
  buildMeetingPromptPayload,
  DEFAULT_THINKING_PROCESS,
  DEFAULT_EVALUATION_CRITERIA,
} from "./js/ai/promptEnhancer.js";
import {
  BASE_RULES,
  CHALLENGE_IMPACT,
  INDUSTRY_CONTEXT,
  FORMAT_INSTRUCTIONS,
} from "./js/thinkingEngine/domainKnowledge.js";

/** 営業種別ごとの出力要件 */
const SALES_TYPE_RULES = {
  "新規開拓": "初回接触。課題への共感→信頼構築→次のアクション提示まで",
  "既存フォロー": "関係性を活かし、前回の課題の進捗確認から入る",
  "テレアポ": "30秒以内に課題共感→アポ打診。断り文句への返し例も含める",
  "商談": "ヒアリング→課題整理→ソリューション→クロージングの流れ",
  "DM": "1行目で課題に触れ、読了30秒以内。押し売り感ゼロ",
  "LINE": "短文・改行多め。既読されやすいトーン。CTAは1つに絞る",
};

/** 思考エンジン結果（buildPrompt 実行中のみ参照） */
let _activeThinking = null;

/**
 * 構造化プロンプトを組み立て（思考エンジン連携）
 */
function structured({ role, mission, context, rules, format, tone, example, purpose, target, prerequisites, notes, thinking }) {
  const t = thinking || _activeThinking;
  const industry = context?.includes("取引先業種") ? context.match(/取引先業種: ([^\n]+)/)?.[1] : null;
  return structuredPro({
    role,
    mission,
    purpose: t?.purpose || purpose || mission,
    background: "美容BtoBソリューション営業。商品ではなく経営課題解決が主目的。",
    target: target || (industry ? `${industry}のオーナー・院長` : "美容サロン・クリニックの経営者"),
    prerequisites: prerequisites || "株式会社ワムのソリューション営業原則に準拠",
    constraints: t?.constraints || "商品スペック押し売り禁止 / 経営課題起点 / 具体数字を【】で明示可",
    context,
    rules,
    thinkingProcess: t?.thinkingProcess || DEFAULT_THINKING_PROCESS,
    outputFormat: t?.outputFormat || format,
    evaluationCriteria: t?.evaluationCriteria || DEFAULT_EVALUATION_CRITERIA,
    improvementPoints: t?.improvements?.join("\n") || "不足情報は【】プレースホルダーで明示し、営業担当者が埋められるようにする",
    notes: [notes, t?.notes].filter(Boolean).join("\n") || "架空の数字・店舗名は【】で明示する。競合他社名は出さない。",
    examples: example || "Before/Afterの数字例を1つ以上含める",
    expectedOutput: "営業担当者がChatGPT等に貼り付けて即使用できる完成プロンプト",
    tone: tone || "プロフェッショナルで現場感のある日本語",
  });
}

function impactLine(challenge) {
  const impact = CHALLENGE_IMPACT[challenge] || "経営課題の解決";
  return `「${challenge}」→ 期待インパクト: ${impact}`;
}

function ctx(answers) {
  const lines = [];
  if (answers.industry) {
    lines.push(`- 取引先業種: ${answers.industry}`);
    const hint = INDUSTRY_CONTEXT[answers.industry];
    if (hint) lines.push(`- 業種特性: ${hint}`);
  }
  if (answers.client_challenge) {
    lines.push(`- 経営課題: ${answers.client_challenge}`);
    lines.push(`- ${impactLine(answers.client_challenge)}`);
  }
  if (answers.goal) lines.push(`- 営業目的: ${answers.goal}`);
  if (answers.sales_type) lines.push(`- 営業種別: ${answers.sales_type}`);
  if (answers.extra_info) lines.push(`- 取引先の具体情報: ${answers.extra_info}`);
  return lines.join("\n");
}

function salesTypeRule(salesType) {
  return SALES_TYPE_RULES[salesType] || `${salesType}のシーンに最適化する`;
}

const PROMPT_BUILDERS = {

  sales(answers) {
    const fmt = FORMAT_INSTRUCTIONS[answers.output_format] || answers.output_format;
    return wrapPrompt(structured({
      role: `あなたは${answers.ai_role}。美容機器・商材メーカーの BtoB 営業を支援する`,
      mission: `${answers.industry || "美容サロン"}向けの${answers.output_format}を作成。${answers.client_challenge ? impactLine(answers.client_challenge) : "経営課題の解決"}を主軸に`,
      context: ctx(answers),
      rules: [
        ...BASE_RULES,
        salesTypeRule(answers.sales_type),
        `営業目的「${answers.goal}」に直結するCTAで締める`,
        answers.extra_info ? "取引先の具体情報を文中に自然に織り込む" : "取引先名・数字は【】プレースホルダーで明示する",
      ],
      format: fmt,
      tone: `${answers.tone}。自然な日本語`,
      example: "【共感】→【課題】→【提案】→【メリット】→【CTA】",
      notes: "初回接触では信頼構築を最優先。商品名の羅列は避ける。",
    }));
  },

  proposal(answers) {
    return wrapPrompt(structured({
      role: `あなたは${answers.ai_role}。BtoB ソリューション提案の専門家`,
      mission: `${answers.industry}向け${answers.proposal_type}を作成。${answers.product_area}領域で${answers.client_challenge || "経営課題"}を解決`,
      context: ctx(answers),
      rules: [
        ...BASE_RULES,
        "Before（現状）→ After（理想）→ 施策 → 期待効果 → 導入ステップの流れ",
        "商品カタログではなく経営改善提案書として書く",
      ],
      format: FORMAT_INSTRUCTIONS[answers.output_format] || answers.output_format,
      tone: answers.tone,
      example: "1.エグゼクティブサマリー 2.現状と課題 3.提案 4.期待効果 5.導入計画",
    }));
  },

  newsletter(answers) {
    return wrapPrompt(structured({
      role: `あなたは${answers.ai_role}。BtoB メールマーケティングの専門家`,
      mission: `${answers.audience}向けメルマガ。${answers.value}という経営価値を提供`,
      context: ctx(answers) + `\n- 配信目的: ${answers.purpose}\n- 提供価値: ${answers.value}`,
      rules: [...BASE_RULES, "件名3パターン + 本文", "CTAへの自然な誘導"],
      format: FORMAT_INSTRUCTIONS[answers.output_format] || "件名+本文",
      tone: answers.tone,
    }));
  },

  training(answers) {
    return wrapPrompt(structured({
      role: `あなたは${answers.ai_role}。営業研修・ロープレのプロトレーナー`,
      mission: `${answers.training_type}の${answers.output_format}を作成。${answers.skill_focus}を強化`,
      context: ctx(answers) + `\n- シナリオ: ${answers.scenario}`,
      rules: [
        ...BASE_RULES,
        "課題ヒアリング → 提案 → クロージングの流れを含める",
        "お客様役のリアルな反論・質問例を含める",
      ],
      format: answers.output_format,
      tone: answers.tone,
    }));
  },

  sns(answers) {
    return wrapPrompt(structured({
      role: `あなたは${answers.ai_role}。BtoB SNS コンテンツの専門家`,
      mission: `${answers.platform}向け${answers.purpose}。サロン経営者の経営改善に役立つ内容`,
      context: ctx(answers),
      rules: [...BASE_RULES, "商品広告ではなくソリューション提供型"],
      format: answers.output_format,
      tone: answers.tone,
    }));
  },

  image(answers) {
    const product = resolveProductFromAnswers(answers);
    const productLabel = product?.name || NO_PRODUCT_OPTION;

    const body = structured({
      role: `あなたは${answers.ai_role}。株式会社ワム（https://wamu-gr.co.jp/）公式HPの商品情報に準拠した販促ビジュアル設計の専門家`,
      mission: `${answers.usage}用の${answers.output_format}を作成。訴求: 「${answers.message}」。対象商品: ${productLabel}`,
      context: buildImageGenerationInstructions(answers),
      rules: [
        ...BASE_RULES,
        ...WAM_IMAGE_GENERATION_RULES,
        "商品スペックの創作や架空パッケージの描写は禁止。公式HP記載内容のみ使用",
        "出力に「商品画像をAI生成する」指示を含めてはならない",
      ],
      format:
        answers.output_format === "画像生成プロンプト（英語）"
          ? "①レイアウト構成（日本語）②背景・人物・装飾・文字の英語プロンプト ③公式商品画像の配置指示（加工禁止）またはアップロード依頼 ④コピー文案"
          : answers.output_format,
      tone: `${answers.style}。プロフェッショナル`,
      example: product
        ? "背景+人物+装飾+文字を生成 → 公式商品画像を指定位置に無加工で配置"
        : "背景+人物+装飾+文字のみ（商品要素なし）",
    });

    return `${wrapPrompt(body)}\n\n${getImagePromptFooter()}`;
  },

  agent(answers) {
    return wrapPrompt(structured({
      role: `あなたは${answers.ai_role}。AI エージェント設計の専門家`,
      mission: `${answers.role}のシステムプロンプトを設計`,
      context: ctx(answers) + `\n- 利用者: ${answers.user}\n- 機能: ${answers.feature}`,
      rules: [
        ...BASE_RULES,
        "ソリューション営業原則に基づくエージェント",
        "商品押し売り禁止ルールを組み込む",
      ],
      format: answers.output_format,
      tone: answers.tone,
    }));
  },

  analysis(answers) {
    return wrapPrompt(structured({
      role: `あなたは${answers.ai_role}。BtoB 営業分析の専門家`,
      mission: `${answers.purpose}のための${answers.target}分析`,
      context: ctx(answers) + `\n- フレームワーク: ${answers.framework}`,
      rules: [
        ...BASE_RULES,
        "取引先の課題仮説と提案切り口を明確に",
        "商談前リサーチとして使える実用性",
      ],
      format: answers.output_format,
      tone: answers.tone,
    }));
  },

  other(answers) {
    return wrapPrompt(structured({
      role: `あなたは${answers.ai_role}`,
      mission: `${answers.purpose}のコンテンツを作成`,
      context: ctx(answers),
      rules: BASE_RULES,
      format: answers.output_format || answers.output_size,
      tone: answers.tone,
    }));
  },
};

/**
 * 完成プロンプトを生成
 * @param {string} categoryId
 * @param {Object<string,string>} answers
 * @param {Object} [thinking] — 思考エンジン結果
 */
export function buildPrompt(categoryId, answers, thinking = null) {
  const builder = PROMPT_BUILDERS[categoryId];
  if (!builder) return wrapPrompt("プロンプトを生成できませんでした。");
  _activeThinking = thinking;
  try {
    return builder(answers);
  } finally {
    _activeThinking = null;
  }
}

/**
 * 保存用タイトルを生成
 */
export function generateTitle(categoryLabel, answers) {
  const parts = [categoryLabel];
  if (answers.wam_product) parts.push(answers.wam_product);
  else if (answers.industry) parts.push(answers.industry);
  if (answers.client_challenge) parts.push(answers.client_challenge);
  else if (answers.goal) parts.push(answers.goal);
  else if (answers.sales_type) parts.push(answers.sales_type);
  else if (answers.usage) parts.push(answers.usage);
  return parts.join(" — ");
}

/** 品質診断（qualityEngine に委譲） */
export function evaluatePrompt(categoryId, answers) {
  return diagnoseQuality(categoryId, answers);
}

/** AI会議連携 — 会議内容からプロンプト生成 */
export function buildPromptFromMeeting(edits) {
  const payload = buildMeetingPromptPayload(edits);
  return wrapPrompt(structuredPro(payload));
}

/** AI会議連携 — タイトル生成 */
export function generateMeetingTitle(topic) {
  return `AI会議 — ${topic}`.slice(0, 80);
}

/** AI会議連携 — 品質評価 */
export function evaluateMeetingPrompt(edits) {
  return diagnoseQuality("agent", {
    purpose: edits.topic,
    feature: "AI会議連携プロンプト",
    role: "ソリューション営業",
  });
}

/** @deprecated getQualityCheck → evaluatePrompt */
export function getQualityCheck(categoryId, answers = {}) {
  return diagnoseQuality(categoryId, answers);
}

export { formatStars };
