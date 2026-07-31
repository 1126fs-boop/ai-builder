/**
 * API リクエスト → GPT-4o ユーザーメッセージ変換
 */

export type WizardPromptRequest = {
  mode: "wizard";
  categoryId: string;
  categoryLabel: string;
  answers: Record<string, string>;
};

export type MeetingPromptRequest = {
  mode: "meeting";
  topic: string;
  summary?: string;
  conclusion?: string;
  preconditions?: string;
  discussion?: string;
};

export type GeneratePromptRequest = WizardPromptRequest | MeetingPromptRequest;

const MAX_DISCUSSION_CHARS = 8000;

function formatAnswers(answers: Record<string, string>): string {
  const entries = Object.entries(answers).filter(([, v]) => v?.trim());
  if (!entries.length) return "（回答なし）";
  return entries.map(([k, v]) => `- **${k}**: ${v.trim()}`).join("\n");
}

export function buildUserMessage(req: GeneratePromptRequest): string {
  if (req.mode === "wizard") {
    return `## 生成モード
ウィザード（単体利用 — AI会議なし）

## カテゴリ
${req.categoryLabel}（ID: ${req.categoryId}）

## ユーザーの回答
${formatAnswers(req.answers)}

---

上記の情報を分析し、世界トップレベルのプロンプトエンジニアとして、
この営業シーンに最適化された **完成プロンプトを 1 本** 生成してください。
必要なセクションを自律的に選び、深く、実践的に設計してください。`;
  }

  const discussion =
    req.discussion && req.discussion.length > MAX_DISCUSSION_CHARS
      ? req.discussion.slice(0, MAX_DISCUSSION_CHARS) + "\n\n…（以降省略）"
      : req.discussion || "";

  return `## 生成モード
AI会議連携（多角的議論の結果を統合）

## 議題
${req.topic}

## 参加前提
${req.preconditions || "（なし）"}

## AI会議サマリー（再要約不要 — そのまま反映）
${req.summary || "（なし）"}

## ファシリテーター総合結論
${req.conclusion || "（なし）"}

## 議論詳細
${discussion || "（なし）"}

---

AI会議で合意・議論された内容を **再分析せず十分に活かし**、
世界トップレベルのプロンプトエンジニアとして、
営業現場ですぐ使える **完成プロンプトを 1 本** 生成してください。
会議の具体案・優先順位・懸念点を漏れなく統合し、最適な構成を自律的に設計してください。`;
}

export function validateGenerateRequest(body: unknown): GeneratePromptRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  if (b.mode === "wizard") {
    if (typeof b.categoryId !== "string" || !b.categoryId.trim()) return null;
    if (typeof b.categoryLabel !== "string") return null;
    if (!b.answers || typeof b.answers !== "object") return null;
    return {
      mode: "wizard",
      categoryId: b.categoryId.trim(),
      categoryLabel: String(b.categoryLabel),
      answers: b.answers as Record<string, string>,
    };
  }

  if (b.mode === "meeting") {
    if (typeof b.topic !== "string" || !b.topic.trim()) return null;
    return {
      mode: "meeting",
      topic: b.topic.trim(),
      summary: typeof b.summary === "string" ? b.summary : "",
      conclusion: typeof b.conclusion === "string" ? b.conclusion : "",
      preconditions: typeof b.preconditions === "string" ? b.preconditions : "",
      discussion: typeof b.discussion === "string" ? b.discussion : "",
    };
  }

  return null;
}
