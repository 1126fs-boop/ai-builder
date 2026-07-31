/**
 * メルマガ・LINE — 成果物プロンプトレンダラー
 */

export function renderNewsletterLineDeliverablePrompt(blueprint) {
  const subjectBlock = blueprint.subjectLines.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const structureBlock = blueprint.bodyStructure.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const sectionsBlock = blueprint.sections.map((s, i) => `${i + 1}. ${s}`).join("\n");

  return `# 役割
美容業界BtoB向けメール・LINE配信のプロフェッショナル。

# 依頼
以下の条件で、${blueprint.channel}の配信文を作成してください。

【配信先】${blueprint.audience}
【目的】${blueprint.purposeLabel}
【提供価値】${blueprint.value}
【トピック】${blueprint.topic}
【トーン】${blueprint.tone}

# 件名案（メールの場合）
${subjectBlock}

# 本文構成
${structureBlock}

# 冒頭フックの方向性
${blueprint.openingHook}

# CTA
${blueprint.cta}

${blueprint.channel.includes("LINE") ? `# LINE版の注意\n${blueprint.lineVersion}\n` : ""}
# 制約
${blueprint.constraintsSummary}
- 押し売り禁止。経営課題起点で書く
- 自然な日本語。AIっぽい表現禁止

# 出力（${sectionsBlock}）
そのまま配信または社内確認に使える完成度で。`;
}
