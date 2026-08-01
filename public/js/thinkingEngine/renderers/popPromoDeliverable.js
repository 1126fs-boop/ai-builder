/**
 * POP・販促物 — 成果物プロンプトレンダラー
 */

export function renderPopPromoDeliverablePrompt(blueprint) {
  const layoutBlock = blueprint.layoutInstructions.map((l, i) => `${i + 1}. ${l}`).join("\n");
  const lensBlock = (blueprint.lensReviews || [])
    .map((l) => `- ${l.focus}: ${l.insight}`)
    .join("\n");

  return `# 役割
美容業界BtoB向け販促物（POP・店内掲示）のプロフェッショナル。

# 依頼
以下の条件で、${blueprint.usage}の制作指示書を作成してください。

【商品】${blueprint.product}
【訴求ポイント】${blueprint.appealPoint}
【掲示場所】${blueprint.displayLocation}
【サイズ】${blueprint.sizeFormat}
【トーン】${blueprint.style}

# ヘッドライン
${blueprint.headline}

# サブコピー
${blueprint.subCopy}

# レイアウト指示
${layoutBlock}

# 画像生成プロンプトの方向性（英語）
${blueprint.imagePromptHint}

# 多視点チェック
${lensBlock}

# 制約
${blueprint.constraintsSummary}
- 3秒で訴求が伝わる構成
- 自然な日本語。AIっぽい表現禁止

# 出力
1. ヘッドライン3案
2. サブコピー
3. レイアウト指示（デザイナー向け）
4. 画像生成プロンプト（英語）
5. 印刷・掲示時の注意点
そのまま制作・印刷に使える完成度で。`;
}
