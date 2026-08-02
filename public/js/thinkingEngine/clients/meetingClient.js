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
} from "../domainKnowledge.js";
import { formatDiscussionSections } from "../sectionBuilder.js";
import { assembleThinkingResult } from "../core/thinkingCore.js";
import {
  buildRoleProposal,
  buildRoleDebate,
  buildRoleRefinement,
  pickRoleDebateTarget,
} from "./meetingRoleDebateEngine.js";

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
  const proposal = buildRoleProposal({ ...role, _exp: exp }, topic);
  return [
    { title: "専門家としての初見", body: proposal.insight },
    { title: "優先アクション", body: proposal.action },
    { title: "具体例", body: exp.example },
    { title: "制約・盲点", body: proposal.risk },
    { title: "測定指標", body: `${exp.focus}に直結するKPIを週次で追う（90日以内に改善が見える数字）` },
  ];
}

function buildRound2Sections(role, topic, refs) {
  const debate = buildRoleDebate(role, topic, refs);
  const refSummary = refs.map((m) => `・${m.roleName}: ${m.content.split("\n")[0]?.slice(0, 80)}…`).join("\n");
  const stanceLabel = debate.stance === "counter" ? "【反論】" : "【補足】";
  return [
    { title: `${stanceLabel} 他AIへの応答`, body: `${refSummary}\n\n${debate.insight}` },
    { title: "改善アクション", body: debate.action },
    { title: "未確定・要検証", body: "反論を恐れず、データ不足の論点を明示する。" },
  ];
}

function buildRound3Sections(role, topic, round1Insight) {
  const refinement = buildRoleRefinement(role, topic, round1Insight);
  return [
    { title: "統合前の最終改善案", body: refinement.insight },
    { title: "実行プラン", body: refinement.action },
    { title: "期待成果", body: "2週間Quick Win → 90日KPI → 180日仕組み化の3段階" },
  ];
}

/** 1発言分の議論思考 */
export function runRound({ role, topic, round, previousMessages }) {
  let sections;
  const round1Msg = previousMessages.find((m) => m.roleId === role.id && m.round === 1);
  const round1Insight = round1Msg?.content?.split("\n")[0] || "";

  if (round === 1) {
    sections = buildRound1Sections(role, topic);
  } else if (round === 2) {
    sections = buildRound2Sections(
      role,
      topic,
      pickRoleDebateTarget(role.id, previousMessages.filter((m) => m.round === 1))
    );
  } else {
    sections = buildRound3Sections(role, topic, round1Insight);
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
