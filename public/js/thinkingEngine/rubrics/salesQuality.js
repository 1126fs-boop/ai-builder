/**
 * 営業トーク — Blueprint 品質ルーブリック
 */

export function evaluateSalesBlueprint(blueprint) {
  const checks = [
    {
      id: "goal",
      label: "商談ゴールがある",
      pass: Boolean(blueprint.goal || blueprint.purpose?.primaryGoal),
      hint: "商談ゴールを明確化",
    },
    {
      id: "challenge",
      label: "顧客課題がある",
      pass: Boolean(blueprint.challenge?.surfaceChallenge || blueprint.clientChallenge),
      hint: "顧客の経営課題を設定",
    },
    {
      id: "questions",
      label: "ヒアリング質問がある",
      pass: Array.isArray(blueprint.hearingQuestions) && blueprint.hearingQuestions.length >= 2,
      hint: "ヒアリング質問を2つ以上",
    },
    {
      id: "objections",
      label: "反論処理がある",
      pass: Array.isArray(blueprint.objectionHandlers) && blueprint.objectionHandlers.length >= 1,
      hint: "想定反論への回答を追加",
    },
    {
      id: "closing",
      label: "クロージングがある",
      pass: Boolean(blueprint.closingScript || blueprint.cta),
      hint: "クロージング台本を追加",
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100) / 100, checks, passed, total: checks.length };
}
