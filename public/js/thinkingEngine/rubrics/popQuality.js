/**
 * POP / 販促画像 — Blueprint 品質ルーブリック
 */

export function evaluatePopBlueprint(blueprint) {
  const checks = [
    {
      id: "product",
      label: "商品指定がある",
      pass: Boolean(blueprint.productAsset || blueprint.product),
      hint: "WAM商品を指定",
    },
    {
      id: "headline",
      label: "ヘッドライン方向がある",
      pass: Boolean(blueprint.headlineDirection || blueprint.headline),
      hint: "ヘッドラインの方向性を定義",
    },
    {
      id: "challenge",
      label: "経営課題が反映",
      pass: Boolean(blueprint.challenge?.surfaceChallenge || blueprint.impact),
      hint: "経営課題を訴求に結びつける",
    },
    {
      id: "copy",
      label: "コピー案がある",
      pass: Array.isArray(blueprint.copyPatterns) && blueprint.copyPatterns.length >= 2,
      hint: "サブコピー案を追加",
    },
    {
      id: "layout",
      label: "オリジナルクリエイブ方向",
      pass: Boolean(blueprint.creativeBrief || (blueprint.creativeDirections?.length >= 3)),
      hint: "HP再現禁止のオリジナルクリエイティブ方向を追加",
    },
    {
      id: "lens",
      label: "多視点レビュー",
      pass: Array.isArray(blueprint.lensReviews) && blueprint.lensReviews.length >= 1,
      hint: "多視点レビューを追加",
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100) / 100, checks, passed, total: checks.length };
}
