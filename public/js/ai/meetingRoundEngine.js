/**
 * AI会議 — 3ラウンド深層議論エンジン
 */

import { getFacilitatorRole } from "../meeting/roles.js";
import {
  formatDiscussionSections,
  ROUND_TYPES,
  MIN_DISCUSSION_ROUNDS,
  pickReferenceMessages,
  pickStance,
  STANCE_LABELS,
} from "./contentFramework.js";
import { createProfiler, yieldToMain } from "./performanceProfiler.js";

const ROLE_EXPERTISE = {
  sales_director: { focus: "営業組織・KPI・再現性", example: "週次パイプライン管理で商談化率15%改善", risk: "属人化" },
  top_sales: { focus: "現場商談・ヒアリング", example: "初回15分ヒアリングで成約率2倍", risk: "商品説明偏重" },
  beauty_consultant: { focus: "サロン経営・メニュー設計", example: "客単価+20%のメニュー再設計", risk: "既存メニュー共存不足" },
  marketer: { focus: "集客ファネル・販促", example: "紹介キャンペーンで新規+30%", risk: "効果測定不足" },
  executive: { focus: "ROI・投資判断", example: "3ヶ月PoC後に全社展開", risk: "短期偏重" },
  sns_manager: { focus: "SNS集客・来店導線", example: "Reels週3本で予約+25%", risk: "来店転換弱い" },
  recruiter: { focus: "採用・定着・育成", example: "30日オンボーディングで定着改善", risk: "実行リソース不足" },
};

function buildRound1(role, topic) {
  const exp = ROLE_EXPERTISE[role.id] || { focus: "専門領域", example: "現場事例", risk: "実行リスク" };
  return formatDiscussionSections([
    { title: "立場・専門性", body: `${role.name}として、${exp.focus}の観点から「${topic}」を分析します。` },
    { title: "理由・ロジック", body: `取引先の経営課題（売上・リピート・客単価・集客・人材）が成功の前提。${exp.focus}は直接インパクトします。` },
    { title: "具体例", body: exp.example },
    { title: "実践方法", body: "①現状把握 → ②仮説 → ③2週間PoC → ④効果測定 → ⑤拡大" },
    { title: "メリット・デメリット", body: "メリット: 再現性 / デメリット: 初期工数" },
    { title: "注意点", body: exp.risk },
    { title: "優先順位", body: "優先度「高」— 90日以内にKPI改善が見込める領域から" },
  ]);
}

function buildRound2(role, topic, refs, stance) {
  const exp = ROLE_EXPERTISE[role.id] || { focus: "専門領域" };
  const refNames = refs.map((m) => m.roleName).join("・") || "他参加者";
  const refSummary = refs.map((m) => `・${m.roleName}: ${m.content.split("\n")[0]?.slice(0, 50)}…`).join("\n");
  const stanceBody = {
    agree: `${refNames}に賛成。${exp.focus}のKPIを週次で測定すべき。`,
    counter: `${refNames}に懸念。${exp.focus}ではPoC後に拡大すべき。`,
    supplement: `${refNames}を補足。取引先フェーズで優先度が変わる。`,
  };
  return formatDiscussionSections([
    { title: `${STANCE_LABELS[stance]} 他AI分析`, body: `${refSummary}\n\n${stanceBody[stance]}` },
    { title: "改善案", body: `「${topic}」を${exp.focus}軸で具体化。` },
    { title: "注意点", body: "反論を恐れずリスクを可視化する。" },
  ]);
}

function buildRound3(role, topic, allMessages) {
  const exp = ROLE_EXPERTISE[role.id] || { focus: "専門領域" };
  return formatDiscussionSections([
    { title: "統合見解", body: `3ラウンドの議論を踏まえ「${topic}」の最終提案。` },
    { title: "実践方法", body: `Week1-2: ヒアリング3社 / Week3-4: PoC / Week5-8: 横展開（${exp.focus}）` },
    { title: "優先順位", body: "1位: Quick Win(2週間) / 2位: 90日KPI / 3位: 仕組み化(180日)" },
    { title: "期待成果", body: "売上・リピート・客単価で+10〜20%改善" },
  ]);
}

export function generateRoundOpinion(role, topic, round, previousMessages) {
  let content;
  if (round === 1) content = buildRound1(role, topic);
  else if (round === 2) content = buildRound2(role, topic, pickReferenceMessages(previousMessages, role.id, 3), pickStance(role.id, round));
  else content = buildRound3(role, topic, previousMessages);

  return {
    roleId: role.id,
    roleName: role.name,
    roleIcon: role.icon,
    roleColor: role.color,
    round,
    roundLabel: ROUND_TYPES[round]?.label || `第${round}ラウンド`,
    content,
    order: previousMessages.length + 1,
  };
}

export function generateDeepConclusion(topic, messages) {
  const facilitator = getFacilitatorRole();
  const participants = [...new Set(messages.map((m) => m.roleName))];
  const round3 = messages.filter((m) => m.round === 3);
  const actionItems = round3.map((m, i) => `${i + 1}. ${m.roleName}: Quick Win優先`);

  const content = formatDiscussionSections([
    { title: `総合結論 — ${facilitator?.name ?? "ファシリテーターAI"}`, body: `「${topic}」— ${participants.join("・")}が${MIN_DISCUSSION_ROUNDS}ラウンド議論。` },
    { title: "統合方向性", body: "①経営課題起点 ②小さく検証→拡大 ③KPI測定の3原則で合意。" },
    { title: "90日プラン", body: "Phase1: ヒアリング / Phase2: PoC / Phase3: 標準化・横展開" },
    { title: "優先順位", body: actionItems.join("\n") },
    { title: "注意点", body: "同時多発禁止。1つずつ検証。" },
    { title: "最終メッセージ", body: "「明日から何をするか」を1つに絞り実行へ。" },
  ]);

  return {
    roleId: facilitator?.id ?? "facilitator",
    roleName: facilitator?.name ?? "ファシリテーターAI",
    roleIcon: facilitator?.icon ?? "🎯",
    roleColor: facilitator?.color ?? "#4f46e5",
    round: MIN_DISCUSSION_ROUNDS + 1,
    roundLabel: "総合結論",
    content,
    order: messages.length + 1,
    isConclusion: true,
  };
}

/**
 * 3ラウンド深層議論を実行
 * @param {string} topic
 * @param {object[]} discussionRoles
 * @param {(msg: object) => void} onMessage
 * @param {(status: string) => void} [onProgress]
 * @param {{ onRoleProgress?: (info: { role: object, round: number, phase: string }) => void, yieldPerMessage?: boolean }} [options]
 */
export async function runDeepMeeting(topic, discussionRoles, onMessage, onProgress, options = {}) {
  const { onRoleProgress, yieldPerMessage = true } =
    typeof options === "number" ? { yieldPerMessage: true } : options;

  const profiler = createProfiler("AI会議");
  profiler.mark("開始");

  const messages = [];

  for (let round = 1; round <= MIN_DISCUSSION_ROUNDS; round++) {
    onProgress?.(ROUND_TYPES[round].label);
    profiler.mark(`ラウンド${round} 開始`);

    for (const role of discussionRoles) {
      onRoleProgress?.({ role, round, phase: "analyzing" });
      onProgress?.(`${role.name}が分析中…`);

      const opinion = generateRoundOpinion(role, topic, round, messages);
      messages.push(opinion);

      onRoleProgress?.({ role, round, phase: "displaying" });
      onMessage(opinion);

      if (yieldPerMessage) await yieldToMain();
    }

    profiler.mark(`ラウンド${round} 完了`);
  }

  const facilitator = getFacilitatorRole();
  onRoleProgress?.({ role: facilitator, round: MIN_DISCUSSION_ROUNDS + 1, phase: "integrating" });
  onProgress?.("ファシリテーターが統合中…");

  const conclusion = generateDeepConclusion(topic, messages);
  onMessage(conclusion);

  profiler.mark("ファシリテーター統合完了");
  profiler.report();

  return { messages, conclusion };
}
