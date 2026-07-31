/**
 * AI Builder — 共通コンテンツフレームワーク
 */

export function formatDiscussionSections(sections) {
  return sections
    .filter((s) => s.body?.trim())
    .map((s) => `■ ${s.title}\n${s.body.trim()}`)
    .join("\n\n");
}

export const ROUND_TYPES = {
  1: { label: "第1ラウンド：初見の専門意見", stance: "proposal" },
  2: { label: "第2ラウンド：分析・賛否・補足", stance: "debate" },
  3: { label: "第3ラウンド：改善案・優先順位", stance: "refinement" },
};

export const MIN_DISCUSSION_ROUNDS = 3;

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

export const STANCE_LABELS = {
  agree: "【賛成・強化】",
  counter: "【反論・懸念】",
  supplement: "【補足・改善】",
};

export function summarizeDiscussion(messages, maxLen = 2000) {
  const text = messages
    .filter((m) => !m.isConclusion)
    .map((m) => `[R${m.round} ${m.roleName}] ${m.content.slice(0, 200)}`)
    .join("\n");
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

export function buildMeetingTransferPayload(meetingResult) {
  const messages = meetingResult.messages || [];
  const conclusion = meetingResult.conclusion?.content || "";

  return {
    topic: meetingResult.title || "",
    summary: summarizeDiscussion(messages, 3000),
    conclusion,
    preconditions: `テーマ: ${meetingResult.title}\n参加AI: ${(meetingResult.selectedRoleNames || []).join("、")}\n議論ラウンド数: ${MIN_DISCUSSION_ROUNDS}`,
    discussion: messages
      .map((m) => `--- ${m.roundLabel || `R${m.round}`} / ${m.roleName} ---\n${m.content}`)
      .join("\n\n"),
  };
}
