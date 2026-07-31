/**
 * 思考エンジン — AI会議クライアント
 *
 * AI会議機能専用のアダプター。プロンプト生成モジュールには依存しない。
 */

import { getFacilitatorRole } from "../../meeting/roles.js";
import {
  ROLE_EXPERTISE,
  ROUND_TYPES,
  MIN_DISCUSSION_ROUNDS,
  STANCE_LABELS,
} from "../domainKnowledge.js";
import { formatDiscussionSections } from "../sectionBuilder.js";
import { assembleThinkingResult } from "../core/thinkingCore.js";

export function pickReferenceMessages(messages, excludeRoleId, count = 2) {
  return messages
    .filter((m) => m.roleId !== excludeRoleId && !m.isConclusion)
    .slice(-count);
}

export function pickStance(roleId, round) {
  if (round !== 2) return null;
  const stances = ["agree", "counter", "supplement"];
  const hash = roleId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return stances[hash % stances.length];
}

export function summarizeDiscussion(messages, maxLen = 2000) {
  const text = messages
    .filter((m) => !m.isConclusion)
    .map((m) => `[R${m.round} ${m.roleName}] ${m.content.slice(0, 200)}`)
    .join("\n");
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

function buildRound1Sections(role, topic) {
  const exp = ROLE_EXPERTISE[role.id] || { focus: "専門領域", example: "現場事例", risk: "実行リスク" };
  return [
    { title: "立場・専門性", body: `${role.name}として、${exp.focus}の観点から「${topic}」を分析します。` },
    { title: "目的整理", body: `取引先の経営課題（売上・リピート・客単価・集客・人材）が成功の前提。${exp.focus}は直接インパクトします。` },
    { title: "具体例", body: exp.example },
    { title: "実践方法", body: "①現状把握 → ②仮説 → ③2週間PoC → ④効果測定 → ⑤拡大" },
    { title: "制約・注意点", body: exp.risk },
    { title: "優先順位", body: "優先度「高」— 90日以内にKPI改善が見込める領域から" },
  ];
}

function buildRound2Sections(role, topic, refs, stance) {
  const exp = ROLE_EXPERTISE[role.id] || { focus: "専門領域" };
  const refNames = refs.map((m) => m.roleName).join("・") || "他参加者";
  const refSummary = refs.map((m) => `・${m.roleName}: ${m.content.split("\n")[0]?.slice(0, 50)}…`).join("\n");
  const stanceBody = {
    agree: `${refNames}に賛成。${exp.focus}のKPIを週次で測定すべき。`,
    counter: `${refNames}に懸念。${exp.focus}ではPoC後に拡大すべき。`,
    supplement: `${refNames}を補足。取引先フェーズで優先度が変わる。`,
  };
  return [
    { title: `${STANCE_LABELS[stance]} 他AI分析`, body: `${refSummary}\n\n${stanceBody[stance]}` },
    { title: "改善案", body: `「${topic}」を${exp.focus}軸で具体化。` },
    { title: "不足情報", body: "反論を恐れずリスクと未確定事項を可視化する。" },
  ];
}

function buildRound3Sections(role, topic) {
  const exp = ROLE_EXPERTISE[role.id] || { focus: "専門領域" };
  return [
    { title: "統合見解", body: `3ラウンドの議論を踏まえ「${topic}」の最終提案。` },
    { title: "出力形式", body: "Quick Win(2週間) → 90日KPI → 180日仕組み化の3段階で整理" },
    { title: "実践方法", body: `Week1-2: ヒアリング3社 / Week3-4: PoC / Week5-8: 横展開（${exp.focus}）` },
    { title: "期待成果", body: "売上・リピート・客単価で+10〜20%改善" },
  ];
}

/** 1発言分の議論思考 */
export function runRound({ role, topic, round, previousMessages }) {
  let sections;
  if (round === 1) {
    sections = buildRound1Sections(role, topic);
  } else if (round === 2) {
    sections = buildRound2Sections(
      role,
      topic,
      pickReferenceMessages(previousMessages, role.id, 3),
      pickStance(role.id, round)
    );
  } else {
    sections = buildRound3Sections(role, topic);
  }

  const content = formatDiscussionSections(sections);
  const roundLabel = ROUND_TYPES[round]?.label || `第${round}ラウンド`;

  return assembleThinkingResult({
    purpose: `「${topic}」について${role.name}の視点で第${round}ラウンドの意見を整理する`,
    missingInfo: round === 2 ? ["他参加者の反論に対する検証データ"] : [],
    constraints: "- 経営課題起点\n- 具体例必須\n- 実行可能な粒度",
    outputFormat: "■ 見出し + 本文（議論用フォーマット）",
    improvements: [`${role.name}の専門性を活かした具体案を提示`],
    output: { sections, content, roundLabel },
    meta: { client: "meeting", scenario: "round", roleId: role.id, round },
  });
}

/** 総合結論の思考 */
export function runConclusion({ topic, messages }) {
  const facilitator = getFacilitatorRole();
  const participants = [...new Set(messages.map((m) => m.roleName))];
  const round3 = messages.filter((m) => m.round === 3);
  const actionItems = round3.map((m, i) => `${i + 1}. ${m.roleName}: Quick Win優先`);

  const sections = [
    { title: `総合結論 — ${facilitator?.name ?? "ファシリテーターAI"}`, body: `「${topic}」— ${participants.join("・")}が${MIN_DISCUSSION_ROUNDS}ラウンド議論。` },
    { title: "統合方向性", body: "①経営課題起点 ②小さく検証→拡大 ③KPI測定の3原則で合意。" },
    { title: "90日プラン", body: "Phase1: ヒアリング / Phase2: PoC / Phase3: 標準化・横展開" },
    { title: "優先順位", body: actionItems.join("\n") },
    { title: "注意点", body: "同時多発禁止。1つずつ検証。" },
    { title: "最終メッセージ", body: "「明日から何をするか」を1つに絞り実行へ。" },
  ];

  const content = formatDiscussionSections(sections);

  return assembleThinkingResult({
    purpose: `「${topic}」の議論を統合し、実行可能な結論にまとめる`,
    missingInfo: [],
    constraints: "- 3原則（経営課題起点・小さく検証・KPI測定）に沿う",
    outputFormat: "総合結論 + 90日プラン + 優先順位",
    improvements: ["Quick Win を1つに絞る", "KPI測定方法を明示"],
    output: { sections, content, facilitator },
    meta: { client: "meeting", scenario: "conclusion" },
  });
}

/** データ引き継ぎ用ペイロード（sessionStorage 転送のみ） */
export function runTransfer(meetingResult) {
  const messages = meetingResult.messages || [];
  const conclusion = meetingResult.conclusion?.content || "";

  const payload = {
    topic: meetingResult.title || "",
    summary: summarizeDiscussion(messages, 3000),
    conclusion,
    preconditions: `テーマ: ${meetingResult.title}\n参加AI: ${(meetingResult.selectedRoleNames || []).join("、")}\n議論ラウンド数: ${MIN_DISCUSSION_ROUNDS}`,
    discussion: messages
      .map((m) => `--- ${m.roundLabel || `R${m.round}`} / ${m.roleName} ---\n${m.content}`)
      .join("\n\n"),
  };

  return assembleThinkingResult({
    purpose: `「${meetingResult.title || ""}」の議論結果を他機能へ引き継ぐ`,
    missingInfo: [],
    constraints: "- データ転送のみ（他機能への直接依存なし）",
    outputFormat: "topic / summary / conclusion / discussion",
    improvements: [],
    output: payload,
    meta: { client: "meeting", scenario: "transfer" },
  });
}
