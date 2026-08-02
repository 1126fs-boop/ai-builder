/**
 * 提案書 — カテゴリ専用 Knowledge Base
 */

export const PROPOSAL_CATEGORY_KB = {
  categoryId: "proposal",
  label: "提案書",
  version: "2026-08",
  principles: [
    "商品カタログではなく経営改善提案書",
    "3層分析: 表面課題→根本原因→経営インパクト",
    "数字・ROI・回収期間（不明は【】）",
    "導入ストーリー: PoC→標準化→全店展開",
    "競合差別化はスペック比較ではなく経営課題解決の切り口",
    "エグゼクティブサマリーは1ページで決裁者が判断できる",
  ],
  roiItems: [
    "投資額【導入費用】",
    "期待効果: 客単価【○%】/ リピート【○%】/ 稼働率【○%】",
    "回収期間【○ヶ月】",
    "測定KPI 3つ以上",
  ],
  simulationHint: "売上 = 客数 × 客単価 × リピート率 × 稼働率 — 各KPI改善幅でシミュレーション",
};

export function buildProposalCategoryBlock(context = {}) {
  const lines = [`【提案書専用 KB — ${PROPOSAL_CATEGORY_KB.label}】`];
  PROPOSAL_CATEGORY_KB.principles.forEach((p) => lines.push(`- ${p}`));
  lines.push("", "■ ROI・数字");
  PROPOSAL_CATEGORY_KB.roiItems.forEach((r) => lines.push(`- ${r}`));
  lines.push("", `■ 売上シミュレーション: ${PROPOSAL_CATEGORY_KB.simulationHint}`);
  if (context.surfaceChallenge) {
    lines.push("", `■ 今回の課題: ${context.surfaceChallenge}`);
  }
  return lines.join("\n");
}
