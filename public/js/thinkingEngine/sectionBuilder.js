/**
 * 思考エンジン — セクション組み立て（議論・プロンプト共通）
 */

/** 議論用（■ 見出し） */
export function formatDiscussionSections(sections) {
  return sections
    .filter((s) => s.body?.trim())
    .map((s) => `■ ${s.title}\n${s.body.trim()}`)
    .join("\n\n");
}

/** プロンプト用（# 見出し） */
export function structuredPro({
  role,
  mission,
  purpose,
  background,
  target,
  prerequisites,
  constraints,
  context,
  rules,
  outputFormat,
  evaluationCriteria,
  thinkingProcess,
  improvementPoints,
  notes,
  examples,
  expectedOutput,
  tone,
}) {
  const sections = [];

  sections.push(`# あなたの役割\n${role}`);
  sections.push(`# ミッション\n${mission}`);

  if (purpose) sections.push(`# 目的\n${purpose}`);
  if (background) sections.push(`# 背景\n${background}`);
  if (target) sections.push(`# ターゲット\n${target}`);
  if (prerequisites) sections.push(`# 前提条件\n${prerequisites}`);
  if (constraints) sections.push(`# 制約条件\n${constraints}`);
  if (context) sections.push(`# 背景・コンテキスト（詳細）\n${context}`);

  if (rules?.length) {
    sections.push(
      `# 作成ルール（必ず守る）\n${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
    );
  }

  if (thinkingProcess) sections.push(`# 思考プロセス\n${thinkingProcess}`);
  if (outputFormat) sections.push(`# 出力形式\n${outputFormat}`);
  if (evaluationCriteria) sections.push(`# 評価基準\n${evaluationCriteria}`);
  if (improvementPoints) sections.push(`# 改善ポイント\n${improvementPoints}`);
  if (notes) sections.push(`# 注意事項\n${notes}`);
  if (examples) sections.push(`# 具体例\n${examples}`);
  if (expectedOutput) sections.push(`# 期待するアウトプット\n${expectedOutput}`);
  if (tone) sections.push(`# 文体・トーン\n${tone}`);

  return sections.join("\n\n");
}

/** 思考結果 → プロンプト構成セクション一覧 */
export function buildStructureFromThinking(thinking) {
  const sections = [
    { key: "role", title: "あなたの役割", required: true },
    { key: "mission", title: "ミッション", required: true },
    { key: "purpose", title: "目的", required: true },
    { key: "constraints", title: "制約条件", required: true },
    { key: "outputFormat", title: "出力形式", required: true },
    { key: "thinkingProcess", title: "思考プロセス", required: false },
    { key: "improvements", title: "改善ポイント", required: false },
    { key: "notes", title: "注意事項", required: false },
  ];
  return sections.filter((s) => s.required || thinking[s.key] || thinking.improvements?.length);
}
