/**
 * プロ視点インサイト — カテゴリ×課題に応じた「プロが考えるポイント」
 *
 * 知識量ではなく、実務で効く要点だけを返す。
 */

import { SNS_CATEGORY_KB } from "./categories/snsKnowledge.js";
import { NEWSLETTER_CATEGORY_KB } from "./categories/newsletterKnowledge.js";
import { PROPOSAL_CATEGORY_KB } from "./categories/proposalKnowledge.js";
import { SALES_CATEGORY_KB } from "./categories/salesKnowledge.js";
import { IMAGE_CATEGORY_KB } from "./categories/imageKnowledge.js";

const PRO_INSIGHTS = {
  sns: [
    "Instagram: 保存率・シェア率がリーチ拡大の鍵（いいねより保存）",
    "1行目3秒フック — スクロールを止める課題共感",
    "カルーセル1枚目が離脱率9割 — 最大フックを1枚目に",
    "リール: 発見タブ経由の新規リーチ。15秒以内フック",
    "美容BtoB: サロンオーナーの経営課題（売上・リピート・客単価）",
    ...SNS_CATEGORY_KB.metrics.map((m) => `KPI: ${m}`),
  ],
  newsletter: [
    "件名28文字前後 — ターゲット+ベネフィット+具体性",
    "プレヘッダーで件名を補完 — 3行目まで読ませる",
    "教育型→ソフトセル→1CTA（売り込み前に価値提供）",
    "PS（追伸）に最重要メッセージ",
    "季節性 × オーナーの悩みで開封率UP",
    "BtoB: サロンオーナーが「明日使える」ノウハウ",
  ],
  proposal: [
    "3層分析: 表面課題→根本原因→経営インパクト",
    PROPOSAL_CATEGORY_KB.simulationHint,
    "ROI・回収期間・KPIを数字で（不明は【】）",
    "PoC→標準化→全店展開の導入ストーリー",
    "競合差別化はスペック比較ではなく経営課題解決の切り口",
    "エグゼクティブサマリーは1ページで決裁者が判断できる",
  ],
  sales: [
    "商品説明から入らない — 共感→ヒアリング→提案",
    "SPIN: Situation→Problem→Implication→Need-payoff",
    "深掘り質問で課題の本質を把握してから提案",
    "反論6パターン以上を先回り",
    "商談ゴールは1つ（デモ・PoC・見積）",
    "アイスブレイク→ラポール→深掘り→提案→反論→クロージング",
  ],
  image: [
    "3秒ヘッドライン — 遠くからでも訴求が伝わる",
    "コピー階層: ヘッド→サブ→ボディ→CTA",
    "掲示場所に合ったレイアウト（店内/窓/受付）",
    "季節性・経営課題をビジュアルに反映",
    "美容業界で反応が良い: 高級感・余白・ミニマル",
    ...IMAGE_CATEGORY_KB.metrics.map((m) => `KPI: ${m}`),
  ],
};

const CHALLENGE_INSIGHTS = {
  売上アップ: "客数×客単価×リピート率×稼働率 — どのレバーが効くか特定",
  リピート率向上: "再来店トリガー・フォロー設計・会員特典",
  新規集客: "フック→信頼→行動の3段階。ハードルの低いCTA",
  客単価向上: "アップセル・クロスセルの自然な提案タイミング",
  ブランド力強化: "一貫した世界観・選ばれる理由の言語化",
};

/**
 * @param {string} categoryId
 * @param {Object} challenge
 * @param {Object} purpose
 * @returns {string[]}
 */
export function getProInsightsForCategory(categoryId, challenge, purpose) {
  const base = [...(PRO_INSIGHTS[categoryId] ?? PRO_INSIGHTS.proposal)].slice(0, 4);
  const surface = challenge?.surfaceChallenge;
  if (surface && CHALLENGE_INSIGHTS[surface]) {
    base.unshift(`【課題別】${CHALLENGE_INSIGHTS[surface]}`);
  }
  const intent = purpose?.strategicIntent?.primaryLabel;
  if (intent) {
    base.push(`今回の主目的: ${intent}`);
  }
  return [...new Set(base)].slice(0, 6);
}
