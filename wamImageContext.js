/**
 * 画像生成専用 — 株式会社ワム公式HP参照ルール
 *
 * 営業・メルマガ・SNS・提案書等の他カテゴリでは使用しない。
 */

import {
  WAM_OFFICIAL_SITE,
  WAM_PRODUCT_INDEX,
  resolveProductFromAnswers,
  getProductImageMode,
} from "./wamProducts.js";

/** 画像生成の絶対ルール（全画像プロンプトに適用） */
export const WAM_IMAGE_GENERATION_RULES = [
  "【最重要】商品画像はAIで新規生成・再デザイン・改変しない",
  "公式ホームページ（https://wamu-gr.co.jp/product/）に掲載されている商品情報のみを参照する。推測・創作・近似デザインは禁止",
  "商品名・ロゴ・パッケージデザイン・色・形状・ラベルは公式情報と完全一致させる",
  "AIが生成してよい要素: 背景・人物・装飾・文字・レイアウト・余白・コピー配置のみ",
  "商品画像は公式URLまたはユーザーアップロード画像を「そのまま配置」する指示に留める",
  "公式に存在しない商品ビジュアルを創作しない。不明な属性は出力に含めない",
];

/** @param {Object<string,string>} answers */
export function buildWamProductBlock(answers) {
  const product = resolveProductFromAnswers(answers);
  const mode = getProductImageMode(product);

  const lines = [
    "【公式HP参照 — 株式会社ワム】",
    `- 公式サイト: ${WAM_OFFICIAL_SITE}`,
    `- 製品一覧: ${WAM_PRODUCT_INDEX}`,
    `- 参照範囲: 画像生成時のみ。他機能は公式HPに依存しない`,
  ];

  if (!product) {
    lines.push(
      "",
      "【商品画像の扱い — 商品なしモード】",
      "- 商品画像は一切生成・配置しない",
      "- 背景・人物・装飾・文字・レイアウトのみを生成する",
      "- 架空の商品・パッケージ・ロゴを創作しない"
    );
    return lines.join("\n");
  }

  lines.push(
    "",
    "【対象商品 — 公式掲載情報】",
    `- 商品名: ${product.name}`,
    `- カテゴリ: ${product.category}`,
    `- 公式説明: ${product.description}`,
    `- 公式ページ: ${product.officialUrl}`
  );

  if (mode === "official") {
    lines.push(
      "",
      "【商品画像 — 公式画像をそのまま使用】",
      `- 公式商品画像URL: ${product.officialImageUrl}`,
      "- このURLの商品画像をダウンロードし、加工・再生成せずそのままレイアウトに配置する",
      "- 商品本体の形状・色・ロゴ・ラベル・パッケージは1ピクセルも変更しない",
      "- 背景・人物・装飾・文字・レイアウトのみAI生成またはデザインする",
      "- 商品画像のリサイズはアスペクト比を維持し、歪めない"
    );
  } else {
    lines.push(
      "",
      "【商品画像 — 公式HPに掲載画像なし / 取得不可】",
      `- ${product.name} の公式商品画像は、現時点でアプリから参照可能なURLがありません`,
      "- 商品画像をAIで生成してはならない",
      "- ユーザーに公式商品画像または正規パッケージ写真のアップロードを依頼する",
      "- アップロード画像が提供されるまで: 背景・人物・装飾・文字・レイアウトのみ生成",
      "- アップロード画像提供後: その画像を加工せず配置し、背景・装飾・文字のみ生成"
    );
  }

  if (answers.product_image_upload) {
    lines.push("", "【ユーザー提供画像】", `- ${answers.product_image_upload}`);
  }

  return lines.join("\n");
}

/** @param {Object<string,string>} answers */
export function buildImageGenerationInstructions(answers) {
  const product = resolveProductFromAnswers(answers);
  const mode = getProductImageMode(product);

  const sections = [
    buildWamProductBlock(answers),
    "",
    "【生成指示の構造】",
    "以下の順で出力すること:",
    "1. レイアウト構成（背景・人物・装飾・文字の配置）",
    "2. 背景・人物・装飾・タイポグラフィの生成プロンプト（英語）",
  ];

  if (mode === "official") {
    sections.push(
      "3. 公式商品画像の配置指示（URL指定・配置位置・サイズ比率・加工禁止の明記）",
      "4. コピー文案（日本語）"
    );
  } else if (mode === "upload_required") {
    sections.push(
      "3. 【必須】ユーザーへの商品画像アップロード依頼文",
      "4. 商品画像なし状態での背景・人物・装飾・文字のみの生成プロンプト（英語）",
      "5. コピー文案（日本語）— 商品名は公式表記のみ使用"
    );
  } else {
    sections.push(
      "3. 背景・人物・装飾・文字のみの生成プロンプト（英語）— 商品要素は含めない",
      "4. コピー文案（日本語）"
    );
  }

  sections.push(
    "",
    `【用途】${answers.usage || ""}`,
    `【サイズ・比率】${answers.aspect || ""}`,
    `【訴求】${answers.message || ""}`,
    `【掲示場所】${answers.target || ""}`,
    `【スタイル】${answers.style || ""}`
  );

  if (answers.extra_info) {
    sections.push(`【補足（ユーザー入力）】${answers.extra_info}`);
  }

  return sections.join("\n");
}

/** 画像プロンプト専用フッター */
export function getImagePromptFooter() {
  return `【画像生成 最終チェック】
- 商品画像をAIで新規生成・改変していないか
- 公式HPにない商品名・ロゴ・パッケージを創作していないか
- 公式商品画像は加工せず配置する指示になっているか
- 公式画像がない場合、アップロード依頼が含まれているか
- 生成対象は背景・人物・装飾・文字・レイアウトのみに限定されているか`;
}
