/**
 * メルマガ / LINE — Blueprint 品質ルーブリック
 */

export function evaluateNewsletterBlueprint(blueprint) {
  const checks = [
    {
      id: "purpose",
      label: "配信目的がある",
      pass: Boolean(blueprint.purpose?.primaryGoal || blueprint.purposeLabel),
      hint: "配信目的を明確化",
    },
    {
      id: "subject",
      label: "件名案が5つ以上",
      pass: Array.isArray(blueprint.subjectLines) && blueprint.subjectLines.length >= 5,
      hint: "開封率重視の件名5案を用意",
    },
    {
      id: "education",
      label: "教育型切り口がある",
      pass: Boolean(blueprint.educationalAngle),
      hint: "教育型コンテンツの切り口を設定",
    },
    {
      id: "soft_sell",
      label: "ソフトセル橋渡しがある",
      pass: Boolean(blueprint.softSellBridge),
      hint: "自然な商品提案への橋渡し",
    },
    {
      id: "challenge",
      label: "経営課題が反映",
      pass: Boolean(blueprint.challenge?.surfaceChallenge),
      hint: "読者の経営課題に共感",
    },
    {
      id: "season",
      label: "季節性がある",
      pass: Boolean(blueprint.seasonalContext),
      hint: "美容業界の季節性を反映",
    },
    {
      id: "cta",
      label: "CTAがある",
      pass: Boolean(blueprint.cta),
      hint: "CTAを1つに絞る",
    },
    {
      id: "ps",
      label: "PS指示がある",
      pass: Boolean(blueprint.psHint),
      hint: "追伸に重要メッセージ",
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100) / 100, checks, passed, total: checks.length };
}
