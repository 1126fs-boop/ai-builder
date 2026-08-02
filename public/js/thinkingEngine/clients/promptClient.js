/**
 * 思考エンジン — プロンプト生成クライアント
 *
 * プロンプト生成機能専用のアダプター。AI会議モジュールには依存しない。
 */

import { getQuestions } from "../../../questions.js";
import {
  BASE_RULES,
  CHALLENGE_IMPACT,
  INDUSTRY_CONTEXT,
  FORMAT_INSTRUCTIONS,
  DEFAULT_THINKING_PROCESS,
  DEFAULT_EVALUATION_CRITERIA,
} from "../domainKnowledge.js";
import { assembleThinkingResult } from "../core/thinkingCore.js";
import { runGapAnalysis } from "../schemas/index.js";
import { runDeliverablePipeline } from "../core/pipeline/deliverablePipeline.js";

/** ギャップ分析（Dynamic 質問決定）— 全 Blueprint カテゴリ対応 */
export function runDeliverableGap({ categoryId, answers }) {
  return runGapAnalysis(categoryId, answers);
}

/** 後方互換 */
export function runProposalGap({ answers }) {
  return runGapAnalysis("proposal", answers);
}

/** 成果物 Blueprint + 完成プロンプト — 全 Blueprint カテゴリ対応 */
export function runDeliverable({ categoryId, answers }) {
  return runDeliverablePipeline(categoryId, answers, {
    wizardQualityCompleted: answers.__wizardQualityCompleted === true,
  });
}

/** 後方互換 */
export function runProposalDeliverable({ answers }) {
  return runDeliverablePipeline("proposal", answers);
}

function extractMissingInfo(categoryId, answers) {
  const questions = getQuestions(categoryId);
  const missing = [];

  for (const q of questions) {
    if (q.optional) continue;
    if (!answers[q.id]?.trim()) missing.push(q.text);
  }
  if (!answers.extra_info?.trim()) {
    missing.push("取引先の具体情報（店舗名・数字・競合など）");
  }
  return [...new Set(missing)];
}

function organizePurpose(categoryId, answers) {
  const challenge = answers.client_challenge;
  const impact = challenge ? CHALLENGE_IMPACT[challenge] : null;
  const goal = answers.goal || answers.purpose || answers.feature;

  if (categoryId === "sales") {
    return `${answers.industry || "美容サロン"}向け${answers.output_format || "営業資料"}を作成し、${challenge || "経営課題"}${impact ? `（期待: ${impact}）` : ""}の解決を支援する`;
  }
  if (categoryId === "proposal") {
    return `${answers.industry || "取引先"}の${answers.client_challenge || "経営課題"}を${answers.proposal_type || "提案"}で解決する`;
  }
  if (goal) return goal;
  return "美容BtoBソリューション営業の現場課題を解決する";
}

function organizeConstraints(categoryId, answers) {
  const lines = [
    "商品スペック押し売り禁止",
    "経営課題解決を最優先",
    "架空の数字・店舗名は【】プレースホルダーで明示",
    "出力は日本語",
  ];
  if (answers.sales_type === "新規開拓") lines.push("初回接触では信頼構築を最優先");
  if (categoryId === "image") lines.push("公式HP記載内容以外の商品創作禁止");
  return lines.map((l) => `- ${l}`).join("\n");
}

function determineOutputFormat(categoryId, answers) {
  const fmt = answers.output_format || answers.output_size;
  if (fmt && FORMAT_INSTRUCTIONS[fmt]) return FORMAT_INSTRUCTIONS[fmt];
  if (fmt) return fmt;
  const defaults = {
    sales: FORMAT_INSTRUCTIONS["営業台本"],
    proposal: FORMAT_INSTRUCTIONS["提案書全文"],
    newsletter: "件名3パターン + 本文",
    agent: "システムプロンプト形式（役割・ルール・出力例）",
  };
  return defaults[categoryId] || "見出し + 箇条書き5〜8項目";
}

function suggestImprovements(categoryId, answers, missingInfo) {
  const improvements = [];
  if (missingInfo.length) {
    improvements.push(`不足情報（${missingInfo.join("、")}）は【】プレースホルダーで明示し、営業担当者が埋められるようにする`);
  }
  if (answers.industry && INDUSTRY_CONTEXT[answers.industry]) {
    improvements.push(`業種特性（${INDUSTRY_CONTEXT[answers.industry]}）を文中に自然に織り込む`);
  }
  if (answers.client_challenge && CHALLENGE_IMPACT[answers.client_challenge]) {
    improvements.push(`「${answers.client_challenge}」の期待インパクト（${CHALLENGE_IMPACT[answers.client_challenge]}）をBefore/Afterで示す`);
  }
  improvements.push("商品説明から始めず、経営課題への共感から入る");
  improvements.push("CTA（次のアクション）を1つに絞り、営業担当者が明日から使える粒度にする");
  return improvements;
}

/** ウィザード回答の思考分析 */
export function runWizard({ categoryId, answers }) {
  const missingInfo = extractMissingInfo(categoryId, answers);
  return assembleThinkingResult({
    purpose: organizePurpose(categoryId, answers),
    missingInfo,
    constraints: organizeConstraints(categoryId, answers),
    outputFormat: determineOutputFormat(categoryId, answers),
    improvements: suggestImprovements(categoryId, answers, missingInfo),
    notes: missingInfo.length
      ? `以下は未入力のため【】で明示: ${missingInfo.join("、")}`
      : "架空の数字・店舗名は【】で明示する。競合他社名は出さない。",
    meta: { client: "prompt", scenario: "wizard", categoryId },
  });
}

/** 編集済みテキスト入力の思考分析 */
export function runEdits(edits) {
  const { topic = "", summary = "", conclusion = "", preconditions = "", discussion = "" } = edits;
  const missingInfo = [];
  if (!summary.trim()) missingInfo.push("議論サマリー");
  if (!conclusion.trim()) missingInfo.push("最終結論");
  if (!discussion.trim()) missingInfo.push("議論詳細");

  const improvements = [
    "入力内容の具体案を漏れなく反映する",
    "実行ステップを優先順位付きで整理する",
    "KPI・検証方法・注意点を必ず含める",
  ];
  if (missingInfo.length) {
    improvements.push(`不足入力（${missingInfo.join("、")}）は【要追記】として明示`);
  }

  return assembleThinkingResult({
    purpose: topic
      ? `「${topic}」を営業現場ですぐ実行できるプロンプトに変換し、経営課題解決を支援する`
      : "入力内容を営業現場で使えるプロンプトに変換する",
    missingInfo,
    constraints: [
      "商品スペック押し売り禁止",
      "経営課題解決を最優先",
      "入力内容と矛盾する提案を含めない",
      "未確定事項は【要確認】と明示",
      "出力は日本語",
    ].map((l) => `- ${l}`).join("\n"),
    outputFormat: `1. エグゼクティブサマリー（3行）
2. 背景と課題定義
3. 推奨アクションプラン（優先順位付き）
4. 各施策の具体的手順
5. KPI・効果測定方法
6. リスクと注意点
7. 明日からのToDo（チェックリスト）`,
    improvements,
    notes: "入力内容と矛盾する提案は含めない。未確定事項は【要確認】と明示する。",
    background: summary ? `【サマリー】\n${summary}` : "",
    context: conclusion ? `【最終結論】\n${conclusion}` : discussion.slice(0, 4000),
    preconditions: preconditions || "美容BtoBソリューション営業の原則に基づく",
    meta: { client: "prompt", scenario: "edits" },
  });
}

/** 思考結果 → structuredPro 用ペイロード */
export function runToPayload({ thinking, extras = {} }) {
  return {
    role: extras.role || "あなたは美容BtoBメーカーの一流ソリューション営業コンサルタント",
    mission: extras.mission || thinking.purpose,
    purpose: thinking.purpose,
    background: extras.background || thinking.background || "美容BtoBソリューション営業。商品ではなく経営課題解決が主目的。",
    target: extras.target || "美容サロン・クリニック等のBtoBソリューション営業担当者（株式会社ワム）",
    prerequisites: extras.prerequisites || thinking.preconditions || "株式会社ワムのソリューション営業原則に準拠",
    constraints: thinking.constraints,
    context: extras.context || thinking.context || "",
    rules: extras.rules || BASE_RULES,
    thinkingProcess: thinking.thinkingProcess || DEFAULT_THINKING_PROCESS,
    outputFormat: thinking.outputFormat,
    evaluationCriteria: thinking.evaluationCriteria || DEFAULT_EVALUATION_CRITERIA,
    improvementPoints: thinking.improvements.join("\n"),
    notes: thinking.notes,
    examples: extras.examples || "Before/Afterの数字例を1つ以上含める",
    expectedOutput: extras.expectedOutput || "営業担当者がChatGPT等に貼り付けて即使用できる完成プロンプト",
    tone: extras.tone || "プロフェッショナルで現場感のある日本語",
  };
}

