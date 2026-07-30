/**
 * AI Builder — プロンプト生成
 *
 * 美容業界 BtoB メーカー営業向け。
 * すべてのプロンプトに context.js のソリューション営業前提を適用。
 */

import { wrapPrompt } from "./context.js";

/** @typedef {{ score: number, stars: number, missing: string[] }} QualityResult */

/** 追加情報行を生成 */
function extraLine(answers, key = "extra_info") {
  return answers[key] ? `- 追加情報: ${answers[key]}` : "";
}

/** 業種行を生成 */
function industryLine(answers) {
  return answers.industry ? `- 取引先業種: ${answers.industry}` : "";
}

/** 経営課題行を生成 */
function challengeLine(answers) {
  return answers.client_challenge ? `- 経営課題: ${answers.client_challenge}` : "";
}

/**
 * カテゴリ別プロンプトビルダー
 * @type {Record<string, (answers: Object<string,string>) => string>}
 */
const PROMPT_BUILDERS = {

  sales(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、美容機器・美容商材メーカーの BtoB 営業コンテンツを作成してください。

【営業シーン】
- 営業種別: ${answers.sales_type}
${industryLine(answers)}
${challengeLine(answers)}
- 営業目的: ${answers.goal}
- 文章トーン: ${answers.tone}
- 出力形式: ${answers.output_format}
${extraLine(answers)}

【作成指示】
- 取引先の経営課題（${answers.client_challenge || "売上・集客・リピート等"}）を解決するソリューション提案として構成する
- 商品のスペック説明ではなく、「導入後の売上・利益・リピート率へのインパクト」を訴求する
- ${answers.output_format}形式で、営業担当者がそのまま使える完成度で出力する
- 共感 → 課題の深掘り → ソリューション → 具体的メリット → CTA の流れを意識する`);
  },

  proposal(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、BtoB ソリューション提案書を作成してください。

【提案概要】
${industryLine(answers)}
${challengeLine(answers)}
- 提案書の種類: ${answers.proposal_type}
- 提案領域: ${answers.product_area}
- 文体: ${answers.tone}
- 出力形式: ${answers.output_format}
${extraLine(answers)}

【作成指示】
- 「${answers.client_challenge}」という経営課題を起点に、ソリューション提案として構成する
- 現状（Before）→ 理想（After）→ 施策 → 期待効果 → 導入ステップ の流れを含める
- 商品カタログではなく、経営改善の提案書として書く
- ${answers.output_format}形式で出力する`);
  },

  newsletter(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、取引先サロン・クリニック向けの BtoB メールを作成してください。

【配信条件】
${industryLine(answers)}
- 配信目的: ${answers.purpose}
- 配信先: ${answers.audience}
- 提供価値: ${answers.value}
- トーン: ${answers.tone}
- 出力形式: ${answers.output_format}
${extraLine(answers)}

【作成指示】
- 商品の押し売りではなく、「${answers.value}」という経営価値を提供する内容にする
- 取引先オーナー・院長が読んで経営に役立つと感じる内容にする
- 件名案3パターン + 本文を出力する`);
  },

  training(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、美容機器メーカー営業向けの研修・ロープレ資料を作成してください。

【研修条件】
- 資料種類: ${answers.training_type}
${industryLine(answers)}
- シナリオ: ${answers.scenario}
- 鍛えるスキル: ${answers.skill_focus}
- トーン: ${answers.tone}
- 出力形式: ${answers.output_format}
${extraLine(answers)}

【作成指示】
- ソリューション営業の考え方（課題ヒアリング → 提案 → クロージング）を反映する
- 取引先の経営課題を引き出すヒアリング例を含める
- 商品説明ではなく、課題解決提案のロープレとして設計する
- ${answers.output_format}形式で出力する`);
  },

  sns(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、美容 BtoB メーカーの SNS コンテンツを作成してください。

【条件】
- 用途: ${answers.purpose}
- プラットフォーム: ${answers.platform}
- 目的: ${answers.goal}
- トーン: ${answers.tone}
- 出力形式: ${answers.output_format}
- ボリューム: ${answers.frequency}
${extraLine(answers)}

【作成指示】
- サロン・クリニックの経営者向けに、経営改善のヒントや導入事例を発信する内容にする
- 商品広告ではなく、ソリューション提供型のコンテンツにする`);
  },

  image(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、美容 BtoB 販促・POP 用のコンテンツを作成してください。

【条件】
- 用途: ${answers.usage}
- 掲示場所: ${answers.target}
- 訴求メッセージ: ${answers.message}
- スタイル: ${answers.style}
- 出力形式: ${answers.output_format}
- サイズ: ${answers.aspect}
${extraLine(answers)}

【作成指示】
- 「${answers.message}」を経営課題解決の視点で訴求する
- 商品写真の説明ではなく、導入メリットが伝わるビジュアル・コピーにする
- ${answers.output_format === "画像生成プロンプト（英語）" ? "英語の画像生成プロンプト + 日本語コピー案" : "コピー + 構成案"}を出力する`);
  },

  agent(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、美容 BtoB 営業支援 AI エージェントのシステムプロンプトを設計してください。

【エージェント仕様】
- 用途: ${answers.role}
${industryLine(answers)}
- 利用者: ${answers.user}
- 主要機能: ${answers.feature}
- 応答トーン: ${answers.tone}
- 出力形式: ${answers.output_format}
${extraLine(answers)}

【設計指示】
- ソリューション営業の原則に基づくエージェントにする
- 商品押し売りではなく、経営課題のヒアリングと提案支援を行う
- ${answers.role === "商談ロープレ相手" ? "お客様（サロンオーナー）としてリアルな反論・課題を出す" : "営業担当者の提案力を高める"}
- システムプロンプトとしてそのまま使える形式で出力する`);
  },

  analysis(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、BtoB 営業の提案準備・分析を支援してください。

【分析条件】
- 分析対象: ${answers.target}
- 分析目的: ${answers.purpose}
${industryLine(answers)}
- フレームワーク: ${answers.framework}
- 出力形式: ${answers.output_format}
- 深さ: ${answers.depth}
${extraLine(answers)}

【作成指示】
- 取引先の経営課題を仮説立てし、ソリューション提案につなげる分析にする
- 商談前のリサーチ・ヒアリング設計として使える実用的な出力にする
- 商品の強みではなく、取引先の課題と提案の切り口を明確にする`);
  },

  other(answers) {
    return wrapPrompt(`あなたは${answers.ai_role}として、美容 BtoB 営業向けのコンテンツを作成してください。

【条件】
- 用途: ${answers.purpose}
${industryLine(answers)}
${challengeLine(answers)}
- 出力サイズ: ${answers.output_size}
- トーン: ${answers.tone}
- 出力形式: ${answers.output_format}
${extraLine(answers)}

【作成指示】
- ソリューション営業の視点を維持し、経営課題解決を主軸にする
- 営業担当者が ChatGPT でそのまま使える品質で出力する`);
  },
};

/** 品質チェックダミーデータ */
const QUALITY_DATA = {
  sales: {
    score: 92,
    stars: 5,
    missing: ["取引先の具体的な売上規模・スタッフ数", "競合他社の導入状況"],
  },
  proposal: {
    score: 90,
    stars: 5,
    missing: ["導入後のROI試算根拠", "取引先の経営数字（客単価・リピート率）"],
  },
  newsletter: {
    score: 88,
    stars: 5,
    missing: ["過去の配信反応データ", "取引先の最新の経営課題"],
  },
  training: {
    score: 89,
    stars: 5,
    missing: ["想定される反論パターンの詳細", "提案商品の導入事例"],
  },
  sns: { score: 85, stars: 4, missing: ["ブランドトーンの詳細", "過去の反応の良かった投稿例"] },
  image: { score: 84, stars: 4, missing: ["ブランドカラー・ロゴ規定", "店内掲示のサイズ制約"] },
  agent: { score: 87, stars: 4, missing: ["ロープレの難易度設定", "評価基準の詳細"] },
  analysis: { score: 86, stars: 4, missing: ["取引先の公開情報・口コミ", "エリアの市場データ"] },
  other: { score: 80, stars: 4, missing: ["具体的なユースケース", "期待する成果物のサンプル"] },
};

const DEFAULT_QUALITY = {
  score: 75,
  stars: 4,
  missing: ["取引先の詳細情報", "具体的な経営課題のヒアリング内容"],
};

/**
 * 回答から完成プロンプトを生成
 * @param {string} categoryId
 * @param {Object<string,string>} answers
 * @returns {string}
 */
export function buildPrompt(categoryId, answers) {
  const builder = PROMPT_BUILDERS[categoryId];
  if (!builder) {
    return wrapPrompt("プロンプトを生成できませんでした。カテゴリ設定を確認してください。");
  }
  return builder(answers);
}

/**
 * 自動タイトルを生成
 * @param {string} categoryLabel
 * @param {Object<string,string>} answers
 * @returns {string}
 */
export function generateTitle(categoryLabel, answers) {
  const sub =
    answers.industry ||
    answers.client_challenge ||
    answers.goal ||
    answers.sales_type ||
    answers.purpose ||
    "";
  return sub ? `${categoryLabel} — ${sub}` : `${categoryLabel}プロンプト`;
}

/** @param {string} categoryId @returns {QualityResult} */
export function getQualityCheck(categoryId) {
  return QUALITY_DATA[categoryId] || DEFAULT_QUALITY;
}

/** @param {number} stars @returns {string} */
export function formatStars(stars) {
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}
