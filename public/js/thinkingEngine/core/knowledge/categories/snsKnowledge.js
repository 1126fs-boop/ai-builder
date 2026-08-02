/**
 * SNS投稿 — カテゴリ専用 Knowledge Base
 */

export const SNS_CATEGORY_KB = {
  categoryId: "sns",
  label: "SNS投稿（Instagram等）",
  version: "2026-08",
  principles: [
    "Instagram: 保存率・シェア率がリーチ拡大の鍵（いいねより保存）",
    "1行目3秒フック — スクロールを止める課題共感",
    "美容BtoB: サロンオーナーの経営課題（売上・リピート・客単価）",
    "1メッセージ1CTA — プロフィール遷移・DM・資料請求",
    "カルーセル1枚目が離脱率9割 — 最大フックを1枚目に",
    "リール: 発見タブ経由の新規リーチ。15秒以内フック",
  ],
  designTrends: [
    "Instagram風: クリーン・余白・サンセット/パステル",
    "雑誌風: 大胆タイポ・コラージュ・高コントラスト",
    "高級感: ダークトーン・ゴールドアクセント・ミニマル",
    "韓国風: ソフトグラデ・丸み・ポップな配色",
    "代理店風: 非対称構図・大胆な色面分割・ editorial layout",
  ],
  copyFrameworks: {
    PAS: "Problem→Agitation→Solution",
    hook: "【数字】【課題共感】【経営視点】",
  },
  metrics: ["保存率", "シェア率", "プロフィール遷移", "DM問い合わせ"],
  antiPatterns: [
    "公式HPレイアウトの再現",
    "商品のAI生成・改変",
    "施術者向け美容情報（BtoC調）",
    "複数CTA",
  ],
};

export function buildSnsCategoryBlock(context = {}) {
  const lines = [`【SNS専用 KB — ${SNS_CATEGORY_KB.label}】`];
  SNS_CATEGORY_KB.principles.forEach((p) => lines.push(`- ${p}`));
  lines.push("", "■ 美容業界で反応が良いデザイン方向");
  SNS_CATEGORY_KB.designTrends.forEach((d) => lines.push(`- ${d}`));
  if (context.appealAxis) lines.push("", `■ 今回の訴求軸: ${context.appealAxis}`);
  return lines.join("\n");
}
