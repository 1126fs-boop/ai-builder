/**
 * 専門 Lens レジストリ — Multi Agent レビュー用
 *
 * カテゴリごとに参加する専門AI（Lens）を定義。
 * 既存 ROLE_EXPERTISE との後方互換マッピングを維持。
 */

/** @type {Record<string, { id: string, label: string, focus: string, example: string, risk: string }>} */
export const LENS_DEFINITIONS = {
  sns: {
    id: "sns",
    label: "SNS運用",
    focus: "SNS全体戦略・投稿設計・来店導線",
    example: "保存率重視の構成でプロフィール遷移+20%",
    risk: "いいね数だけ追い、来店・問い合わせに繋がらない",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    focus: "アルゴリズム・リール・カルーセル・保存率",
    example: "1行目3秒フック+カルーセル1枚目最適化",
    risk: "トレンド追随のみでBtoB訴求が弱くなる",
  },
  beauty: {
    id: "beauty",
    label: "Beauty・美容業界",
    focus: "サロン経営・BtoB美容・業界特性",
    example: "オーナーの経営課題（売上・リピート・客単価）起点",
    risk: "施術者向けBtoC情報になってしまう",
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    focus: "マーケティングファネル・BtoB施策",
    example: "教育型→信頼→リード獲得の導線設計",
    risk: "押し売り・煽りで信頼を損なう",
  },
  copy: {
    id: "copy",
    label: "Copy・コピーライティング",
    focus: "ヘッドライン・CTA・セールスコピー",
    example: "PAS/AIDA/BAB構成で1メッセージ1CTA",
    risk: "情報過多で3秒ルールを破る",
  },
  design: {
    id: "design",
    label: "Design・クリエイティブ",
    focus: "視覚設計・構図・ブランドトーン",
    example: "代理店風オリジナル。HP再現禁止",
    risk: "公式HPの模倣・商品AI生成",
  },
  sales: {
    id: "sales",
    label: "Sales・営業",
    focus: "商談・ヒアリング・クロージング",
    example: "SPIN→深掘り→PoC提案で成約率向上",
    risk: "商品説明から入る押し売り",
  },
  psychology: {
    id: "psychology",
    label: "心理・購買心理",
    focus: "オーナーの不安・決裁心理・信頼構築",
    example: "リスク低減（PoC）で決裁ハードルを下げる",
    risk: "煽り・恐怖訴求の使いすぎ",
  },
  management: {
    id: "management",
    label: "経営・サロン経営",
    focus: "KPI・人材・仕組み・投資判断",
    example: "客数×客単価×リピート×稼働率の改善",
    risk: "現場が回せない理想論",
  },
  roi: {
    id: "roi",
    label: "ROI・投資判断",
    focus: "数字・回収期間・売上シミュレーション",
    example: "保守的ROI試算+2週間Quick Win",
    risk: "根拠のない数字・誇大効果",
  },
};

/** カテゴリ別 — 参加 Lens パネル（Multi Agent） */
export const CATEGORY_LENS_PANELS = {
  sns: ["sns", "instagram", "beauty", "marketing", "copy", "design"],
  sales: ["sales", "psychology", "beauty", "management"],
  proposal: ["management", "roi", "sales", "marketing"],
  newsletter: ["marketing", "beauty", "copy", "management"],
  image: ["design", "marketing", "beauty", "copy"],
};

/** 旧 CATEGORY_LENSES ID → 新 Lens ID（後方互換） */
export const LEGACY_LENS_MAP = {
  marketer: "marketing",
  sns_manager: "sns",
  beauty_consultant: "beauty",
  top_sales: "sales",
  executive: "roi",
  sales_director: "sales",
  recruiter: "management",
};

/** @param {string} lensId */
export function getLensDefinition(lensId) {
  const resolved = LENS_DEFINITIONS[lensId] ?? LENS_DEFINITIONS[LEGACY_LENS_MAP[lensId]];
  if (resolved) return resolved;
  return {
    id: lensId,
    label: lensId,
    focus: "専門レビュー",
    example: "",
    risk: "視点の偏り",
  };
}

/** @param {string} categoryId */
export function getLensPanelForCategory(categoryId) {
  const ids = CATEGORY_LENS_PANELS[categoryId] ?? CATEGORY_LENS_PANELS.proposal;
  return ids.map((id) => getLensDefinition(id));
}
