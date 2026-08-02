/**
 * 美容業界ドメイン Knowledge Base
 *
 * マーケティング・SNS・営業・サロン経営・機器メーカー知識など
 * AnalysisContext / Blueprint / Prompt Builder へ反映する静的ナレッジ。
 */

/** 美容業界マーケティング */
export const BEAUTY_MARKETING = {
  id: "beauty_marketing",
  label: "美容業界マーケティング",
  principles: [
    "ターゲットは「サロンオーナーの経営課題」— 施術者個人の美容情報ではない",
    "Before/After は数字・KPI・経営改善で語る",
    "競合比較より「経営課題解決ストーリー」を優先",
    "BtoBは信頼構築が最優先 — 押し売り・煽りは逆効果",
    "季節・トレンドより「経営サイクル（繁忙期・閑散期）」に合わせた訴求",
  ],
  hooks: [
    "【数字】売上○%改善を実現したサロンの共通点",
    "【課題共感】スタッフ定着率、客単価、リピート — どれがボトルネック？",
    "【経営視点】施術技術ではなく「仕組み」で差別化",
  ],
};

/** Instagram アルゴリズム・SNS運用 */
export const INSTAGRAM_ALGORITHM = {
  id: "instagram_algorithm",
  label: "Instagram アルゴリズム",
  principles: [
    "最初の3秒（1行目）でスクロールを止める — 課題共感フック必須",
    "保存率・シェア率がリーチ拡大の鍵（いいねより保存を意識）",
    "カルーセルは1枚目で離脱される — 1枚目に最大のフック",
    "ストーリーは24時間で消える — 限定感・今すぐ感を活用",
    "リールは発見タブ経由の新規リーチ獲得に有効",
    "ハッシュタグは3〜5個のニッチ+汎用の組み合わせ",
    "投稿時間: サロンオーナーが見る朝7-9時、夜21-23時を意識",
  ],
  metrics: ["保存率", "プロフィール遷移", "DM問い合わせ", "リーチ"],
};

/** 売れるクリエイティブの法則 */
export const CREATIVE_SELLING = {
  id: "creative_selling",
  label: "売れるクリエイティブの法則",
  principles: [
    "1メッセージ1CTA — 複数訴求は分散して伝わらない",
    "視線の流れ: フック → 共感 → 価値 → 証拠 → CTA",
    "数字は具体的に（「売上アップ」→「客単価15%改善」等、不明は【】）",
    "Before/After の「After」は経営者が想像できる具体像",
    "高級感と親しみやすさのバランス — BtoBは信頼感が最優先",
    "3秒ルール: 遠目でも意味が伝わるコピー量",
  ],
  formats: {
    AIDA: "Attention（注意）→ Interest（関心）→ Desire（欲求）→ Action（行動）",
    PAS: "Problem（課題）→ Agitation（深刻化）→ Solution（解決）",
    BAB: "Before（現状）→ After（理想）→ Bridge（架け橋）",
  },
};

/** Meta 広告の考え方 */
export const META_ADS = {
  id: "meta_ads",
  label: "Meta広告",
  principles: [
    "BtoB美容機器: リード獲得（資料請求・セミナー申込）が主ゴール",
    "カスタムオーディエンス: 既存顧客・類似オーディエンスで効率化",
    "クリエイティブ疲弊対策: 2週間ごとにバリエーション更新",
    "LP（ランディングページ）と広告コピーの一貫性がCVRを左右",
    "動画15秒以内でフック → サロンオーナーの課題に触れる",
    "A/Bテスト: ヘッドライン1変数ずつ。同時多変数は避ける",
  ],
  objectives: ["リード獲得", "トラフィック", "エンゲージメント", "認知拡大"],
};

/** セールスライティング */
export const SALES_COPYWRITING = {
  id: "sales_copywriting",
  label: "セールスライティング",
  principles: [
    "ヘッドラインは「ターゲット+ベネフィット+具体性」",
    "箇条書きは3〜5点。7点以上は読まれない",
    "「あなた」を主語に — 「当社は」から入らない",
    "反論処理を先回り: 価格・導入ハードル・競合比較",
    "CTAは動詞+具体行動（「資料請求する」「無料相談を予約する」）",
    "PS（追伸）に最も重要なメッセージを置く（メルマガ）",
  ],
  powerWords: ["実証済み", "導入サロン数", "ROI", "90日で", "PoC", "伴走支援"],
};

/** BtoB 営業 */
export const B2B_SALES = {
  id: "b2b_sales",
  label: "BtoB営業",
  principles: [
    "SPIN: Situation→Problem→Implication→Need-payoff の順でヒアリング",
    "決裁者（オーナー）と現場（施術者）の両方の課題を把握",
    "PoC（小規模実証）でリスクを下げる提案",
    "競合比較表より「経営課題解決ストーリー」",
    "導入後フォロー・成功事例の共有でリピート受注",
    "商談ゴールは1つに絞る（デモ・見積・PoC開始日）",
  ],
  objections: [
    { concern: "価格が高い", response: "ROI・回収期間・導入サロンの事例で説明" },
    { concern: "スタッフが使いこなせるか", response: "研修・サポート体制・段階導入" },
    { concern: "今は忙しい", response: "PoC・小さく始めるステップ提案" },
  ],
};

/** 美容サロン経営 */
export const SALON_MANAGEMENT = {
  id: "salon_management",
  label: "美容サロン経営",
  principles: [
    "KPI: 売上=客数×客単価×リピート率×稼働率",
    "スタッフ定着率がサービス品質とリピートに直結",
    "新規集客よりリピート・客単価アップの方がROI高い",
    "繁忙期（12-2月、7-8月）と閑散期で施策を変える",
    "メニュー構成: 入口→主力→アップセルの3層",
    "オーナーの悩み: 人材・売上・差別化・将来不安",
  ],
  challenges: {
    売上アップ: "客単価向上・新メニュー・稼働率改善",
    リピート率向上: "再来店理由・会員制度・フォロー体制",
    人材定着: "教育・評価・キャリアパス",
    集客: "SNS・紹介・地域マーケ",
  },
};

/** 美容機器メーカー知識 */
export const EQUIPMENT_MANUFACTURER = {
  id: "equipment_manufacturer",
  label: "美容機器メーカー",
  principles: [
    "BtoB販売: 機器スペックより「サロン経営への貢献」で語る",
    "導入メリット=施術効果×リピート率×客単価×差別化",
    "競合機器との差別化は「経営課題解決の切り口」で",
    "アフターサポート・研修・消耗品でLTVを設計",
    "展示会・セミナー・デモが商談化率を上げる",
    "リース・分割で導入ハードルを下げる",
  ],
  buyerPersona: ["サロンオーナー（決裁）", "店長（運用）", "施術者（現場）"],
};

/** カテゴリ別 — 適用するドメインナレッジ ID */
export const CATEGORY_DOMAIN_MAP = {
  proposal: ["b2b_sales", "salon_management", "sales_copywriting", "beauty_marketing", "equipment_manufacturer"],
  sns: ["instagram_algorithm", "creative_selling", "beauty_marketing", "meta_ads", "equipment_manufacturer"],
  newsletter: ["sales_copywriting", "beauty_marketing", "b2b_sales", "salon_management"],
  sales: ["b2b_sales", "sales_copywriting", "salon_management", "equipment_manufacturer"],
  image: ["creative_selling", "beauty_marketing", "meta_ads", "equipment_manufacturer"],
};

/** 全ドメインナレッジレジストリ */
export const DOMAIN_REGISTRY = {
  beauty_marketing: BEAUTY_MARKETING,
  instagram_algorithm: INSTAGRAM_ALGORITHM,
  creative_selling: CREATIVE_SELLING,
  meta_ads: META_ADS,
  sales_copywriting: SALES_COPYWRITING,
  b2b_sales: B2B_SALES,
  salon_management: SALON_MANAGEMENT,
  equipment_manufacturer: EQUIPMENT_MANUFACTURER,
};

/**
 * カテゴリに適用するドメインナレッジを取得
 * @param {string} categoryId
 */
export function getDomainKnowledgeForCategory(categoryId) {
  const ids = CATEGORY_DOMAIN_MAP[categoryId] || CATEGORY_DOMAIN_MAP.proposal;
  return ids.map((id) => DOMAIN_REGISTRY[id]).filter(Boolean);
}

/**
 * Blueprint / Prompt Builder 向けヒントを生成
 * @param {string} categoryId
 * @param {Object} [learned]
 */
export function buildDomainHints(categoryId, learned = null) {
  const domains = getDomainKnowledgeForCategory(categoryId);
  const hints = [];

  for (const domain of domains) {
    hints.push(`【${domain.label}】`);
    hints.push(...domain.principles.slice(0, 3).map((p) => `- ${p}`));
  }

  if (learned?.enabled) {
    if (learned.highRatedPrompts?.length) {
      hints.push("【高評価プロンプトから学習】");
      learned.highRatedPrompts.slice(0, 2).forEach((p) => {
        if (p.pattern) hints.push(`- 成功パターン: ${p.pattern}`);
        if (p.hookStyle) hints.push(`- フック型: ${p.hookStyle}`);
      });
    }
    if (learned.revisions?.length) {
      hints.push("【ユーザー修正傾向】");
      learned.revisions.slice(0, 2).forEach((r) => {
        if (r.lesson) hints.push(`- ${r.lesson}`);
      });
    }
    if (learned.successCases?.length) {
      hints.push("【成功事例】");
      learned.successCases.slice(0, 2).forEach((s) => {
        if (s.summary) hints.push(`- ${s.summary}`);
      });
    }
  }

  return hints;
}

/**
 * Prompt Builder 用 — ドメインナレッジブロック（日本語）
 * @param {string} categoryId
 * @param {Object} knowledgeSnapshot
 */
export function buildDomainKnowledgeBlock(categoryId, knowledgeSnapshot = {}) {
  const domains = knowledgeSnapshot.domainKnowledge || getDomainKnowledgeForCategory(categoryId);
  const learned = knowledgeSnapshot.learned;
  const lines = ["【ドメイン Knowledge Base — プロンプト品質向上】"];

  for (const domain of domains) {
    lines.push("", `■ ${domain.label}`);
    domain.principles.slice(0, 4).forEach((p) => lines.push(`- ${p}`));
    if (domain.hooks) {
      lines.push("- フック例:", ...domain.hooks.slice(0, 2).map((h) => `  · ${h}`));
    }
    if (domain.formats) {
      lines.push(`- 構成: ${Object.values(domain.formats).join(" / ")}`);
    }
  }

  if (learned?.enabled && learned.hints?.length) {
    lines.push("", "【学習ナレッジ — 過去の成功・修正から】");
    learned.hints.forEach((h) => lines.push(`- ${h}`));
  }

  if (knowledgeSnapshot.appliedHints?.length) {
    lines.push("", "【今回の分析への適用ヒント】");
    knowledgeSnapshot.appliedHints.slice(0, 6).forEach((h) => lines.push(typeof h === "string" ? `- ${h}` : `- ${h.text || h}`));
  }

  return lines.join("\n");
}
