/**
 * 株式会社ワム — 公式ホームページ商品カタログ
 *
 * 参照元: https://wamu-gr.co.jp/product/
 * 画像生成機能のみがこのカタログを参照する。
 * 商品名・説明・画像URLは公式ページの公開情報に基づく（推測・創作なし）。
 */

/** @typedef {Object} WamProduct
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} description
 * @property {string} officialUrl
 * @property {string|null} officialImageUrl
 * @property {boolean} hasOfficialImage
 */

export const WAM_OFFICIAL_SITE = "https://wamu-gr.co.jp/";
export const WAM_PRODUCT_INDEX = "https://wamu-gr.co.jp/product/";

/** @type {WamProduct[]} */
export const WAM_PRODUCTS = [
  {
    id: "hyperknife_ex",
    name: "ハイパーナイフEX2",
    category: "業務用エステ機器",
    description: "ハイパーナイフシリーズ最上位機種。S・H・F潤滑高周波技術とヒト幹細胞培養液配合の専用クリームで、痩身と美肌を同時に実現する業務用エステ機器。",
    officialUrl: "https://wamu-gr.co.jp/product/hyperknife_ex/",
    officialImageUrl: "https://wamu-gr.co.jp/product/hyperknife_ex/images/topimg.jpg",
    hasOfficialImage: true,
  },
  {
    id: "hyperknife",
    name: "ハイパーナイフ7",
    category: "業務用エステ機器",
    description: "1MHzの高周波による温めと特殊ハンドピースによるほぐしで脂肪を撃退する業務用痩身マシン。深部8cmまで加温可能。",
    officialUrl: "https://wamu-gr.co.jp/product/hyperknife/",
    officialImageUrl: "https://wamu-gr.co.jp/product/hyperknife/images/topimg.jpg",
    hasOfficialImage: true,
  },
  {
    id: "hypershape",
    name: "ハイパーシェイプ",
    category: "業務用エステ機器",
    description: "吸引ともみほぐしでセルライトを徹底ケアする業務用痩身マシン。ハイパーナイフとの併用で相乗効果を発揮します。",
    officialUrl: "https://wamu-gr.co.jp/product/hypershape/",
    officialImageUrl: "https://wamu-gr.co.jp/product/hypershape/images/topimg.jpg",
    hasOfficialImage: true,
  },
  {
    id: "hyperwave",
    name: "ハイパーウェーブ",
    category: "業務用エステ機器",
    description: "EMSで筋肉を刺激し基礎代謝を向上させる業務用ボディメイクマシン。",
    officialUrl: "https://wamu-gr.co.jp/product/hyperwave/",
    officialImageUrl: "https://wamu-gr.co.jp/product/hyperwave/images/topimg.jpg",
    hasOfficialImage: true,
  },
  {
    id: "hyperradion",
    name: "ハイパーラディオンプレミアム",
    category: "業務用エステ機器",
    description: "温熱・電位・ホルミシスのトリプル効果で極上の癒しと美容を実現する次世代コンディショニングマシン。",
    officialUrl: "https://wamu-gr.co.jp/product/hyperradion/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "hyperknife_wavehome",
    name: "ハイパーウェーブ・ホーム",
    category: "家庭用美容機器",
    description: "ハイパーナイフシリーズから初のホームケアマシン。インナーマッスルまで鍛えられるサロン仕様のEMS。",
    officialUrl: "https://wamu-gr.co.jp/product/hyperknife_wavehome/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "hypernonfcream",
    name: "ハイパーノンFクリーム",
    category: "業務用エステ化粧品",
    description: "ハイパーナイフ施術用の専用クリーム。イソスリムコンプレックス配合で脂肪燃焼をサポート。",
    officialUrl: "https://wamu-gr.co.jp/product/hypernonfcream/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "medipo_mini",
    name: "メディポレーションミニ",
    category: "業務用エステ機器",
    description: "業務用エレクトロポレーション（メディポレーション）機器。",
    officialUrl: "https://wamu-gr.co.jp/product/medipo_mini/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "medipo_pro",
    name: "メディポレーションPro",
    category: "業務用エステ機器",
    description: "業務用エレクトロポレーション（メディポレーション）Proモデル。",
    officialUrl: "https://wamu-gr.co.jp/product/medipo_pro/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "medipo_head",
    name: "メディポレーションヘッド",
    category: "業務用エステ機器",
    description: "メディポレーション用ヘッド（アタッチメント）。",
    officialUrl: "https://wamu-gr.co.jp/product/medipo_head/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "dmk",
    name: "DMK+",
    category: "インナーケア商品",
    description: "水溶性ケイ素を主成分としたケイ素サプリメント。",
    officialUrl: "https://wamu-gr.co.jp/product/dmk/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "dmk_stick",
    name: "DMK stick",
    category: "インナーケア商品",
    description: "持ち運び便利なスティック型DMK。",
    officialUrl: "https://wamu-gr.co.jp/product/dmk_stick/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "venusjewel",
    name: "ヴィーナスジュエル",
    category: "健康ジュエリー",
    description: "耳つぼジュエリー（VENUS JEWEL）。",
    officialUrl: "https://wamu-gr.co.jp/product/venusjewel/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "mesoserum",
    name: "メソセラム",
    category: "化粧品",
    description: "生コラーゲン美容液。",
    officialUrl: "https://wamu-gr.co.jp/product/mesoserum/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "sparkle_head",
    name: "スパークル1000 ヘッド用",
    category: "業務用エステ機器",
    description: "高濃度炭酸泉スパークル1000 ヘッド用。",
    officialUrl: "https://wamu-gr.co.jp/product/sparkle_head/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "sparkle_face",
    name: "スパークル1000 フェイシャル用",
    category: "業務用エステ機器",
    description: "高濃度炭酸泉スパークル1000 フェイシャル用。",
    officialUrl: "https://wamu-gr.co.jp/product/sparkle_face/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
  {
    id: "eyelash",
    name: "ワミィライズアイラッシュ",
    category: "化粧品",
    description: "まつ毛育毛美容液。",
    officialUrl: "https://wamu-gr.co.jp/product/eyelash/",
    officialImageUrl: null,
    hasOfficialImage: false,
  },
];

/** 商品を使わない画像生成モード */
export const NO_PRODUCT_OPTION = "商品なし（背景・人物・装飾・文字のみ）";

/** @type {WamProduct[]} */
let _products = [...WAM_PRODUCTS];
let productMap = new Map(_products.map((p) => [p.id, p]));
let nameMap = new Map(_products.map((p) => [p.name, p]));

function rebuildMaps(products) {
  _products = products;
  productMap = new Map(products.map((p) => [p.id, p]));
  nameMap = new Map(products.map((p) => [p.name, p]));
}

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category || "",
    description: row.description || "",
    officialUrl: row.official_url || "",
    officialImageUrl: row.official_image_url || null,
    hasOfficialImage: Boolean(row.has_official_image),
  };
}

/** Supabase から商品マスタを読み込む（失敗時は静的データ） */
export async function initProducts() {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) return;
    const { supabaseUrl, supabaseAnonKey } = await res.json();
    if (!supabaseUrl) return;

    const { createBrowserClient } = await import("https://esm.sh/@supabase/ssr@0.5.2");
    const sb = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { data } = await sb
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (data?.length) {
      rebuildMaps(data.map(rowToProduct));
    }
  } catch {
    /* 静的 WAM_PRODUCTS を使用 */
  }
}

/** @returns {WamProduct[]} */
export function getActiveProducts() {
  return _products;
}

/** @returns {string[]} 質問選択肢用 */
export function getProductChoiceOptions() {
  return [..._products.map((p) => p.name), NO_PRODUCT_OPTION];
}

/** @param {string} id @returns {WamProduct|undefined} */
export function getProductById(id) {
  return productMap.get(id);
}

/** @param {string} nameOrLabel @returns {WamProduct|undefined} */
export function getProductByName(nameOrLabel) {
  if (nameOrLabel === NO_PRODUCT_OPTION) return undefined;
  return nameMap.get(nameOrLabel);
}

/** @param {Object<string,string>} answers @returns {WamProduct|undefined} */
export function resolveProductFromAnswers(answers) {
  if (answers.wam_product === NO_PRODUCT_OPTION) return undefined;
  if (answers.wam_product) return getProductByName(answers.wam_product);
  return undefined;
}

/** @param {WamProduct|undefined} product @returns {"none"|"official"|"upload_required"} */
export function getProductImageMode(product) {
  if (!product) return "none";
  return product.hasOfficialImage ? "official" : "upload_required";
}
