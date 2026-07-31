/**
 * 提案書 — 成果物プロンプトレンダラー
 *
 * ChatGPT に貼り付けて提案書成果物を得るための完成プロンプト。
 */

/**
 * @param {Object} blueprint
 */
export function renderProposalDeliverablePrompt(blueprint) {
  const measuresBlock = blueprint.measures
    .map((m) => `${m.priority}. ${m.title}\n   ${m.body}`)
    .join("\n");

  const objectionsBlock = blueprint.objections
    .map((o) => `Q: ${o.concern}\nA: ${o.response}`)
    .join("\n\n");

  const chaptersBlock = blueprint.chapters
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  return `# 役割
美容業界BtoB（サロン・クリニック向け）の提案書作成プロフェッショナル。

# 依頼
以下の条件で、取引先に提出できる提案書を作成してください。

【取引先】${blueprint.industry}
【提案種別】${blueprint.proposalScope}
【提案領域】${blueprint.productArea}
【経営課題（表面）】${blueprint.surfaceChallenge}
【根本原因（分析）】${blueprint.rootCause}
【業種特性】${blueprint.industryContext}

# 提案ストーリー
${blueprint.proposalStory}

# Before / After
${blueprint.before}

${blueprint.after}

# 必ず含める構成（${blueprint.chapters.length}章）
${chaptersBlock}

# 売上アップ施策（優先順位付き）
${measuresBlock}

# 導入効果 KPI
${blueprint.kpi}

# 想定懸念と回答
${objectionsBlock}

# 次のアクション（CTA）
${blueprint.cta}

${blueprint.hearingNotes ? `# ヒアリングメモ（反映すること）\n${blueprint.hearingNotes}\n` : ""}
# 制約
- 商品カタログ・スペック一覧ではなく、経営改善提案書として書く
- 冒頭は取引先の課題への共感から入る（商品説明から始めない）
- 架空の店舗名・数字は【】プレースホルダーで明示
- 自然な日本語。AIっぽい表現禁止
- スライド化できる見出し構成にする

# トーン
${blueprint.tone}

# 出力
上記${blueprint.chapters.length}章構成の提案書全文。見出し（##）付き。そのまま取引先提出または社内プレゼンに使える完成度で。`;
}
