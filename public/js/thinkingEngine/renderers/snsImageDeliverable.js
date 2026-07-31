/**
 * SNS投稿画像 — 成果物プロンプトレンダラー
 */

export function renderSnsImageDeliverablePrompt(blueprint) {
  const copyBlock = blueprint.copyPatterns.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const lensBlock = (blueprint.lensReviews || [])
    .map((l) => `- ${l.focus}: ${l.insight}`)
    .join("\n");

  return `# 役割
美容業界BtoB向けSNS販促のプロフェッショナル（デザイン＋コピー）。

# 依頼
以下の条件で、${blueprint.snsFormat}用の投稿素材を作成してください。

【商品】${blueprint.product}
【訴求軸】${blueprint.appealAxis}
【ターゲット】${blueprint.targetAudience}
【フォーマット】${blueprint.snsFormat} / ${blueprint.aspect}
【経営インパクト】${blueprint.impact}

# ビジュアルコンセプト
${blueprint.visualConcept}

# キャッチコピー案
${copyBlock}

# 多視点チェック（反映すること）
${lensBlock}

# キャプション構成
${blueprint.captionStructure}

# ハッシュタグ
${blueprint.hashtags}

# 制約
${blueprint.constraintsSummary}
- 商品写真のみの構成禁止（必ずコピー・訴求を含める）
- 自然な日本語。AIっぽい表現禁止

# 出力
1. キャッチコピー3案（日本語）
2. 画像生成用プロンプト（英語、Midjourney/DALL-E向け）
3. 投稿キャプション全文
4. CTA（1つ）
そのまま投稿または画像生成ツールに使える完成度で。`;
}
