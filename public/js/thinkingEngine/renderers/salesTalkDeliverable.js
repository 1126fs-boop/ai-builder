/**
 * 営業トーク — 成果物プロンプトレンダラー
 */

export function renderSalesTalkDeliverablePrompt(blueprint) {
  const hearingBlock = blueprint.hearingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  const objectionBlock = blueprint.objectionResponses
    .map((o) => `Q: ${o.q}\nA: ${o.a}`)
    .join("\n\n");
  const lensBlock = (blueprint.lensReviews || [])
    .map((l) => `- ${l.focus}: ${l.insight}`)
    .join("\n");

  return `# 役割
美容業界BtoB営業のプロフェッショナル（商談・テレアポ・DM対応）。

# 依頼
以下の条件で、${blueprint.salesType}用の営業トーク台本を作成してください。

【業種】${blueprint.industry}
【課題（表面）】${blueprint.challenge}
【根本原因】${blueprint.rootCause}
【業種特性】${blueprint.industryContext}
【ゴール】${blueprint.goal}

# 提案ストーリー
${blueprint.proposalStory}

# 冒頭（共感）
${blueprint.opening}

# ヒアリング3問
${hearingBlock}

# 反論処理
${objectionBlock}

# クロージング
${blueprint.closing}

${blueprint.clientContext ? `# 取引先状況（反映すること）\n${blueprint.clientContext}\n` : ""}
# 多視点チェック
${lensBlock}

# 制約
${blueprint.constraintsSummary}
- 商品説明から入らない。共感→ヒアリング→提案→CTA
- 自然な日本語。AIっぽい表現禁止

# 出力
そのまま営業現場で使える台本形式（セリフ＋トークポイント）で。`;
}
