/**
 * メルマガ — カテゴリ専用 Knowledge Base
 */

export const NEWSLETTER_CATEGORY_KB = {
  categoryId: "newsletter",
  label: "メルマガ・LINE",
  version: "2026-08",
  principles: [
    "件名: ターゲット+ベネフィット+具体性（28文字前後）",
    "プレヘッダーで件名を補完 — 3行目まで読ませる",
    "教育型→ソフトセル→1CTA（売り込み前に価値提供）",
    "BtoB: サロンオーナーが「明日使える」ノウハウ",
    "PS（追伸）に最重要メッセージ",
    "LINE: 300字・改行多め・CTA1つ",
  ],
  subjectPatterns: [
    "【課題ワード】+ ベネフィット",
    "【数字・期間】+ 経営改善",
    "質問型（ボトルネックはどこ？）",
    "季節性 + オーナーの悩み",
  ],
  bodyFlow: [
    "挨拶1文",
    "共感フック3行",
    "教育パート（ノウハウ・事例）",
    "橋渡し→ソフトセル",
    "CTA1つ",
    "PS",
  ],
};

export function buildNewsletterCategoryBlock(context = {}) {
  const lines = [`【メルマガ専用 KB — ${NEWSLETTER_CATEGORY_KB.label}】`];
  NEWSLETTER_CATEGORY_KB.principles.forEach((p) => lines.push(`- ${p}`));
  lines.push("", "■ 件名パターン");
  NEWSLETTER_CATEGORY_KB.subjectPatterns.forEach((p) => lines.push(`- ${p}`));
  if (context.seasonalLabel) lines.push("", `■ 季節: ${context.seasonalLabel}`);
  return lines.join("\n");
}
