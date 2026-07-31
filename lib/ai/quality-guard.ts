/**
 * 生成プロンプトの最低品質チェック（ローカル・API追加なし）
 */

export type QualityGuardResult = {
  ok: boolean;
  score: number;
  warnings: string[];
};

/** GPT-4o 出力の最低基準を検証 */
export function validateGeneratedPrompt(prompt: string): QualityGuardResult {
  const warnings: string[] = [];
  let score = 0;

  if (prompt.length >= 800) score += 25;
  else warnings.push("プロンプトが短めです（800文字未満）");

  if (prompt.length >= 1500) score += 15;

  const headingCount = (prompt.match(/^#{1,3}\s/mg) || []).length;
  if (headingCount >= 4) score += 25;
  else warnings.push("見出し構造が不足しています");

  const hasPurpose = /目的|Purpose/i.test(prompt);
  const hasTarget = /ターゲット|Target|対象/i.test(prompt);
  const hasFormat = /出力形式|Output Format|出力/i.test(prompt);
  const hasConstraints = /制約|Constraints|守る/i.test(prompt);

  if (hasPurpose) score += 10;
  else warnings.push("「目的」セクションが見当たりません");
  if (hasTarget) score += 10;
  if (hasFormat) score += 10;
  if (hasConstraints) score += 5;

  const hasExample = /具体例|Example|Before|After/i.test(prompt);
  if (hasExample) score += 10;
  else warnings.push("具体例が不足している可能性があります");

  return {
    ok: score >= 60 && prompt.length >= 500,
    score: Math.min(100, score),
    warnings,
  };
}
