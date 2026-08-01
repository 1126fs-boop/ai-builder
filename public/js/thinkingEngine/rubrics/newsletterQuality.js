/**
 * メルマガ / LINE — Blueprint 品質ルーブリック
 */

export function evaluateNewsletterBlueprint(blueprint) {
  const checks = [
    {
      id: "purpose",
      label: "配信目的がある",
      pass: Boolean(blueprint.purpose?.primaryGoal || blueprint.deliveryPurpose),
      hint: "配信目的を明確化",
    },
    {
      id: "subject",
      label: "件名方向がある",
      pass: Boolean(blueprint.subjectDirections?.length || blueprint.subjectHints?.length),
      hint: "件名案の方向性を追加",
    },
    {
      id: "challenge",
      label: "経営課題が反映",
      pass: Boolean(blueprint.challenge?.surfaceChallenge),
      hint: "読者の経営課題に共感",
    },
    {
      id: "cta",
      label: "CTAがある",
      pass: Boolean(blueprint.cta || blueprint.ctaType),
      hint: "CTAを1つに絞る",
    },
    {
      id: "tone",
      label: "トーン指定",
      pass: Boolean(blueprint.purpose?.tone || blueprint.tone),
      hint: "文体・トーンを指定",
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100) / 100, checks, passed, total: checks.length };
}
