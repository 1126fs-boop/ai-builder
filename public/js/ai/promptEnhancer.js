/**
 * AI Builder — 高品質プロンプト構築（共通）
 */

/** 拡張構造化プロンプト（3〜5倍の詳細度） */
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

/** カテゴリ共通の思考プロセス */
export const DEFAULT_THINKING_PROCESS = `1. 取引先の経営課題を特定する（売上・集客・リピート・客単価・人材）
2. 課題の根本原因を仮説立てする
3. ソリューション（商品ではなく経営改善）を設計する
4. Before/After の数字イメージを具体化する
5. 営業担当者がそのまま使える完成度に落とし込む`;

/** カテゴリ共通の評価基準 */
export const DEFAULT_EVALUATION_CRITERIA = `- 経営課題への共感から始まっているか（商品説明から始まっていないか）
- 具体的な数字・施策・Before/After が含まれているか
- 取引先（サロンオーナー・院長）の立場に立った言葉遣いか
- 営業担当者がそのまま使える実用レベルか
- AIっぽい表現を避け、自然な日本語か`;

/** AI会議連携用プロンプト */
export function buildMeetingPromptPayload(edits) {
  const {
    topic = "",
    summary = "",
    conclusion = "",
    preconditions = "",
    discussion = "",
  } = edits;

  return {
    role: "あなたは美容BtoBメーカーの一流ソリューション営業コンサルタント。AI会議の結論を実務プロンプトに変換する専門家",
    mission: `AI会議の議論結果をもとに、営業現場ですぐ使える最高品質のプロンプト設計書を作成する。テーマ: 「${topic}」`,
    purpose: `AI会議で合意した方向性を、ChatGPT/Claude等に貼り付けて即実行できるプロンプトに変換し、${topic}の実現を支援する`,
    background: `【AI会議サマリー】\n${summary}\n\n【議論詳細】\n${discussion.slice(0, 4000)}`,
    target: "美容サロン・クリニック等のBtoBソリューション営業担当者（株式会社ワム）",
    prerequisites: preconditions || "美容BtoBソリューション営業の原則に基づく",
    constraints: `- 商品スペック押し売り禁止\n- 経営課題解決を最優先\n- 架空の数字は【】プレースホルダーで明示\n- 出力は日本語`,
    context: `【AI会議 最終結論】\n${conclusion}`,
    rules: [
      "AI会議の結論と矛盾しない",
      "議論で出た具体案を漏れなく反映する",
      "実行ステップを優先順位付きで整理する",
      "営業担当者が明日から使える粒度で書く",
      "KPI・検証方法・注意点を必ず含める",
    ],
    thinkingProcess: DEFAULT_THINKING_PROCESS,
    outputFormat: `1. エグゼクティブサマリー（3行）\n2. 背景と課題定義\n3. 推奨アクションプラン（優先順位付き）\n4. 各施策の具体的手順\n5. KPI・効果測定方法\n6. リスクと注意点\n7. 明日からのToDo（チェックリスト）`,
    evaluationCriteria: DEFAULT_EVALUATION_CRITERIA,
    improvementPoints: "会議で言及された弱点・懸念点を必ず「注意点」セクションに反映する",
    notes: "会議の結論と矛盾する提案は含めない。未確定事項は【要確認】と明示する。",
    examples: "各施策に「具体例（サロン/クリニックのシーン）」を1つ以上付ける",
    expectedOutput: "営業担当者がコピーしてAIチャットに貼り付け、追加指示なしで実務に使える完成プロンプト",
    tone: "プロフェッショナルかつ現場感のある日本語。箇条書きと見出しを活用",
  };
}
