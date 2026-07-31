/**
 * 提案書 — 内部品質ルーブリック
 *
 * 15項目商談振り返りプロンプトを「成果物品質基準」に変換。
 * ユーザーには表示しない。
 */

/**
 * @param {Object} blueprint
 * @returns {{ score: number, checks: Object[], passed: number }}
 */
export function evaluateProposalBlueprint(blueprint) {
  const checks = [
    {
      id: "industry_context",
      label: "業種特性が反映されているか",
      pass: Boolean(blueprint.industryContext?.trim()),
    },
    {
      id: "root_cause",
      label: "根本原因まで掘れているか",
      pass: Boolean(blueprint.rootCause?.trim() && blueprint.rootCause !== blueprint.surfaceChallenge),
    },
    {
      id: "before_after",
      label: "Before/After があるか",
      pass: Boolean(blueprint.before?.trim() && blueprint.after?.trim()),
    },
    {
      id: "measures",
      label: "施策に優先順位があるか",
      pass: Array.isArray(blueprint.measures) && blueprint.measures.length >= 2,
    },
    {
      id: "objections",
      label: "想定懸念への回答があるか",
      pass: Array.isArray(blueprint.objections) && blueprint.objections.length >= 1,
    },
    {
      id: "cta",
      label: "次アクションが1つに絞られているか",
      pass: Boolean(blueprint.cta?.trim()),
    },
    {
      id: "kpi",
      label: "KPI・効果指標があるか",
      pass: Boolean(blueprint.kpi?.trim()),
    },
    {
      id: "story",
      label: "提案が課題と直結しているか",
      pass: Boolean(blueprint.proposalStory?.trim()),
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100) / 100;

  return { score, checks, passed };
}
