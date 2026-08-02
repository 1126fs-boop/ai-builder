/**
 * カテゴリ別品質ルーブリック — 基準プロファイル
 *
 * 「知識」ではなく「アウトプット品質を判断する基準」。
 * 学習により重み・ヒントがカテゴリごとに更新される。
 */

/** @type {Record<string, { label: string, passThreshold: number, dimensions: Object[] }>} */
export const CATEGORY_RUBRIC_PROFILES = {
  sns: {
    label: "SNS投稿",
    passThreshold: 0.75,
    dimensions: [
      { id: "hook_3sec", label: "3秒フック", weight: 0.15, critical: true, hint: "1行目で課題共感。スクロールを止める" },
      { id: "save_design", label: "保存率設計", weight: 0.12, hint: "保存→後で見る価値。シェアも意識" },
      { id: "challenge_link", label: "経営課題との結びつき", weight: 0.12, critical: true, hint: "訴求と経営課題が直結" },
      { id: "copy_quality", label: "売れるコピー", weight: 0.12, hint: "PAS構成・数字・共感" },
      { id: "creative_original", label: "オリジナルクリエイティブ", weight: 0.12, hint: "HP再現禁止・毎回新規デザイン" },
      { id: "product_image", label: "公式商品画像ルール", weight: 0.1, critical: true, hint: "商品AI生成禁止・公式画像のみ" },
      { id: "cta_single", label: "CTA1つ", weight: 0.1, hint: "プロフィール/DM/資料 — 1つに絞る" },
      { id: "b2b_tone", label: "BtoBトーン", weight: 0.09, hint: "サロンオーナー向け・押し売り禁止" },
      { id: "lens_review", label: "多視点レビュー", weight: 0.08, hint: "デザイナー/SNS/オーナー視点" },
    ],
  },
  newsletter: {
    label: "メルマガ・LINE",
    passThreshold: 0.75,
    dimensions: [
      { id: "subject_open", label: "開封率の件名", weight: 0.18, critical: true, hint: "課題ワード・数字・季節性" },
      { id: "read_through", label: "最後まで読まれる構成", weight: 0.15, hint: "3行フック→教育→CTA→PS" },
      { id: "education", label: "教育型コンテンツ", weight: 0.14, hint: "売り込み前に価値提供" },
      { id: "soft_sell", label: "自然な商品提案", weight: 0.12, hint: "橋渡し→ソフトセル" },
      { id: "seasonality", label: "季節性", weight: 0.1, hint: "繁忙期・閑散期の経営サイクル" },
      { id: "b2b_value", label: "BtoB情報提供", weight: 0.12, hint: "オーナーが明日使えるノウハウ" },
      { id: "cta_single", label: "1通1CTA", weight: 0.1, critical: true, hint: "CTAは1つ。PSに重要メッセージ" },
      { id: "tone_trust", label: "信頼感・押し売り禁止", weight: 0.09, hint: "コンサル調すぎず現場感" },
    ],
  },
  proposal: {
    label: "提案書",
    passThreshold: 0.75,
    dimensions: [
      { id: "challenge_analysis", label: "経営課題分析", weight: 0.16, critical: true, hint: "表面→根本原因→インパクト" },
      { id: "numbers_roi", label: "数字・ROI", weight: 0.15, critical: true, hint: "回収期間・KPI【】プレースホルダー" },
      { id: "revenue_sim", label: "売上シミュレーション", weight: 0.12, hint: "客数×客単価×リピート×稼働率" },
      { id: "implementation", label: "導入ストーリー", weight: 0.12, hint: "PoC→標準化→全店展開" },
      { id: "differentiation", label: "競合差別化", weight: 0.11, hint: "経営課題解決の切り口" },
      { id: "before_after", label: "Before/After", weight: 0.11, hint: "具体像が想像できるAfter" },
      { id: "objections", label: "想定懸念", weight: 0.1, hint: "価格・定着・タイミングへの回答" },
      { id: "cta_single", label: "次アクション1つ", weight: 0.13, critical: true, hint: "PoC開始日・デモ日程" },
    ],
  },
  sales: {
    label: "営業トーク",
    passThreshold: 0.75,
    dimensions: [
      { id: "icebreak", label: "アイスブレイク", weight: 0.1, hint: "タイプ別冒頭（商談/テレアポ/DM）" },
      { id: "hearing_spin", label: "SPINヒアリング", weight: 0.16, critical: true, hint: "S→P→I→N の4段階" },
      { id: "deep_dive", label: "深掘り質問", weight: 0.12, hint: "KPI・決裁者・予算感" },
      { id: "objection", label: "切り返し", weight: 0.14, hint: "4パターン以上の反論処理" },
      { id: "closing", label: "クロージング", weight: 0.14, critical: true, hint: "ゴールに直結した1CTA" },
      { id: "type_fit", label: "タイプ別対応", weight: 0.12, hint: "商談/テレアポ/DM/LINE別設計" },
      { id: "no_pitch_first", label: "商品説明から入らない", weight: 0.12, critical: true, hint: "共感→ヒアリング→提案" },
      { id: "story", label: "提案ストーリー", weight: 0.1, hint: "Before→Bridge→After" },
    ],
  },
  image: {
    label: "POP・販促物",
    passThreshold: 0.75,
    dimensions: [
      { id: "headline_3sec", label: "3秒ヘッドライン", weight: 0.16, critical: true, hint: "遠目でも意味が伝わる" },
      { id: "appeal_order", label: "訴求順", weight: 0.12, hint: "フック→共感→価値→CTA" },
      { id: "store_visibility", label: "店頭視認性", weight: 0.14, hint: "掲示場所に合った文字量・コントラスト" },
      { id: "cta_action", label: "行動喚起", weight: 0.12, hint: "QR・問い合わせ・予約1つ" },
      { id: "salon_promo", label: "美容サロン向け販促", weight: 0.11, hint: "高級感・信頼感" },
      { id: "creative_original", label: "オリジナルデザイン", weight: 0.13, hint: "HP再現禁止・毎回新規" },
      { id: "product_image", label: "公式商品画像", weight: 0.12, critical: true, hint: "AI生成・改変禁止" },
      { id: "copy_hierarchy", label: "コピー階層", weight: 0.1, hint: "ヘッド→サブ→ボディ" },
    ],
  },
};

/** @param {string} categoryId */
export function getBaseRubricProfile(categoryId) {
  return CATEGORY_RUBRIC_PROFILES[categoryId] ?? CATEGORY_RUBRIC_PROFILES.proposal;
}
