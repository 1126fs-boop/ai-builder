/**
 * SNS — Blueprint 品質ルーブリック
 */

export function evaluateSnsBlueprint(blueprint) {
  const checks = [
    {
      id: "product",
      label: "商品指定がある",
      pass: Boolean(blueprint.productAsset || blueprint.product),
      hint: "WAM商品を指定する",
    },
    {
      id: "appeal",
      label: "訴求軸がある",
      pass: Boolean(blueprint.appealAxis),
      hint: "訴求軸（売上アップ等）を設定",
    },
    {
      id: "target",
      label: "ターゲットがある",
      pass: Boolean(blueprint.targetAudience),
      hint: "ターゲット（サロンオーナー等）を明記",
    },
    {
      id: "challenge",
      label: "経営課題が反映されている",
      pass: Boolean(blueprint.challenge?.surfaceChallenge || blueprint.impact),
      hint: "経営課題分析をビジュアルに反映",
    },
    {
      id: "copy",
      label: "コピー案が3つ以上",
      pass: Array.isArray(blueprint.copyPatterns) && blueprint.copyPatterns.length >= 3,
      hint: "キャッチコピー案を3つ以上用意",
    },
    {
      id: "visual",
      label: "ビジュアルコンセプトがある",
      pass: Boolean(blueprint.visualConcept?.trim()),
      hint: "ビジュアルコンセプトを記述",
    },
    {
      id: "lens",
      label: "多視点レビューがある",
      pass: Array.isArray(blueprint.lensReviews) && blueprint.lensReviews.length >= 2,
      hint: "多視点レビューを2件以上含める",
    },
    {
      id: "layout",
      label: "オリジナルクリエイティブ方向がある",
      pass: Boolean(blueprint.creativeBrief || blueprint.layoutSpec?.compositionStyle),
      hint: "毎回異なるオリジナルクリエイティブ方向を定義",
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100) / 100, checks, passed, total: checks.length };
}
