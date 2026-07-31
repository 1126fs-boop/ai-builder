/**
 * AI会議 — 議論エンジン（役割別意見生成・総合結論）
 */

import { getFacilitatorRole } from "./roles.js";

/** 前の発言を要約テキストに変換 */
function summarizePrevious(messages) {
  if (!messages.length) return "";
  return messages
    .map((m) => `【${m.roleName}】${m.content.slice(0, 120)}…`)
    .join("\n");
}

/** 前の発言への言及文を生成 */
function referencePrevious(messages, roleName) {
  if (!messages.length) return "";
  const last = messages[messages.length - 1];
  if (last.roleName === roleName) return "";
  return `${last.roleName}のご指摘にも触れながら、`;
}

/** 役割別の意見生成ロジック */
const OPINION_BUILDERS = {
  sales_director(topic, prev, roleName) {
    const ref = referencePrevious(prev, roleName);
    const teamFocus = prev.some((m) => m.roleId === "top_sales")
      ? "現場の声を踏まえ、営業チーム全体のKPI設計として"
      : "営業チーム全体のKPI設計として";
    return `${ref}${teamFocus}、テーマ「${topic}」について私の見解を述べます。

まず、組織として最も重要なのは「再現性のある勝ちパターン」の確立です。トップ営業の成功事例を標準化し、週次のパイプライン管理で商談化率・成約率を可視化すべきです。

具体的には、①初回ヒアリングの質問テンプレート統一、②提案資料のA/Bテスト、③失注理由の週次レビュー——この3点を回すことで、3ヶ月以内にチーム全体の成約率向上が見込めます。`;
  },

  top_sales(topic, prev, roleName) {
    const ref = referencePrevious(prev, roleName);
    const heardDirector = prev.some((m) => m.roleId === "sales_director")
      ? "部長がおっしゃるKPI管理は現場でも実感していますが、"
      : "現場の視点から申し上げると、";
    return `${ref}${heardDirector}「${topic}」で最も効くのは、お客様（サロンオーナー・院長）の"経営の悩み"に寄り添った提案です。

商品スペックではなく「売上・リピート・客単価」のどこを改善したいかを最初の15分で深掘りすると、成約率が大きく変わります。私の経験では、Before/Afterの数字を1つ示すだけで信頼が生まれます。

${prev.length ? "先ほどの意見を踏まえつつ、" : ""}次のアクションとして、既存顧客3社にヒアリングを行い、成功パターンを言語化することを提案します。`;
  },

  beauty_consultant(topic, prev, roleName) {
    const ref = referencePrevious(prev, roleName);
    return `${ref}美容サロン・クリニックの現場視点から、「${topic}」についてお話しします。

オーナーが本当に困っているのは「技術はあるのに経営がうまくいかない」というギャップです。メニュー設計・価格設定・リピート施策をセットで提案しないと、導入後の満足度が下がります。

${prev.length ? "これまでの議論で出た施策を、サロンのフェーズ（新規/open後1年/成熟期）別に整理すると実行しやすくなります。" : ""}

特に、既存メニューとの"共存"を設計することが、長期的な導入成功の鍵です。`;
  },

  marketer(topic, prev, roleName) {
    const ref = referencePrevious(prev, roleName);
    return `${ref}マーケティングの観点では、「${topic}」は集客ファネル全体で捉える必要があります。

認知→来店→リピート→紹介の各段階でKPIを設定し、施策ごとの費用対効果を測定しましょう。SNS・チラシ・紹介キャンペーンを統合した"一貫したメッセージ"が重要です。

${prev.some((m) => m.roleId === "sns_manager") ? "SNS運用AIの視点と合わせ、" : ""}${prev.some((m) => m.roleId === "beauty_consultant") ? "美容コンサルAIが指摘した現場課題を訴求軸に据え、" : ""}ターゲット別（新規/既存/休眠）の配信設計を提案します。`;
  },

  executive(topic, prev, roleName) {
    const ref = referencePrevious(prev, roleName);
    return `${ref}経営者の視点から「${topic}」の投資判断を整理します。

ROI・回収期間・リスクの3軸で評価すべきです。${prev.length ? "これまでの意見は実行面で有効ですが、" : ""}中長期（6〜12ヶ月）で見たときに、売上・利益・組織能力のどこにインパクトがあるかを明確にしましょう。

小さく始めて検証→拡大の段階投資が、美容BtoBにおいては最も堅実です。`;
  },

  sns_manager(topic, prev, roleName) {
    const ref = referencePrevious(prev, roleName);
    return `${ref}SNS運用の視点から「${topic}」について提案します。

Instagram・TikTok・LINEを用途別に使い分け、Before/After・お客様の声・スタッフの人柄をコンテンツ化することが効果的です。週3本の投稿リズムと、月1回のキャンペーン設計が現実的なスタートラインです。

${prev.some((m) => m.roleId === "marketer") ? "マーケターAIのファネル設計と連動させ、" : ""}「見る→来店→リピート」の導線をSNS上で可視化しましょう。`;
  },

  recruiter(topic, prev, roleName) {
    const ref = referencePrevious(prev, roleName);
    return `${ref}採用・人材の観点から「${topic}」に関してお話しします。

どんなに良い施策も、実行する人がいなければ機能しません。${prev.length ? "先ほどの施策を成功させるには、" : ""}必要なスキルセット（接客/技術/数字管理）を明確にし、採用要件と育成計画をセットで設計すべきです。

定着率向上のため、オンボーディング30日プログラムとメンター制度の導入を推奨します。`;
  },
};

/**
 * 1役割分の意見を生成
 * @param {{ id: string, name: string }} role
 * @param {string} topic
 * @param {Array<{ roleId: string, roleName: string, content: string }>} previousMessages
 */
export function generateOpinion(role, topic, previousMessages) {
  const builder = OPINION_BUILDERS[role.id];
  const content = builder
    ? builder(topic, previousMessages, role.name)
    : `「${topic}」について、${role.name}として検討した結果、現場の実行可能性と効果測定を重視した提案が必要です。${previousMessages.length ? summarizePrevious(previousMessages).slice(0, 80) + "…を踏まえ、" : ""}段階的な導入を推奨します。`;

  return {
    roleId: role.id,
    roleName: role.name,
    roleIcon: role.icon,
    roleColor: role.color,
    content,
    order: previousMessages.length + 1,
  };
}

/**
 * ファシリテーターによる総合結論
 * @param {string} topic
 * @param {Array<{ roleName: string, content: string }>} messages
 */
export function generateConclusion(topic, messages) {
  const facilitator = getFacilitatorRole();
  const names = messages.map((m) => m.roleName).join("、");

  const keyPoints = messages.map((m, i) => {
    const firstLine = m.content.split("\n").find((l) => l.trim().length > 20) || m.content.slice(0, 60);
    return `${i + 1}. 【${m.roleName}】${firstLine.trim().slice(0, 80)}…`;
  });

  const content = `【総合結論 — ${facilitator?.name ?? "ファシリテーターAI"}】

テーマ「${topic}」について、${names}の${messages.length}名が議論しました。以下が最終結論です。

■ 議論の要点
${keyPoints.join("\n")}

■ 合意形成された方向性
① お客様（サロン・クリニック）の経営課題を起点に、商品ではなくソリューションとして提案する
② 小さく検証→数字で効果測定→拡大、の段階的アプローチを取る
③ 営業・マーケ・現場・組織の各視点を統合した実行計画を作る

■ 推奨ネクストアクション（優先順）
1. 既存顧客3社へのヒアリング（課題の深掘り）
2. 成功パターンの言語化とテンプレート化
3. 90日間のKPI設定と週次レビューの開始

■ ファシリテーターからの一言
全員の意見に共通するのは「現場の課題解決」と「再現性」です。この2点を軸に、次の一手を決めて実行に移しましょう。`;

  return {
    roleId: facilitator?.id ?? "facilitator",
    roleName: facilitator?.name ?? "ファシリテーターAI",
    roleIcon: facilitator?.icon ?? "🎯",
    roleColor: facilitator?.color ?? "#4f46e5",
    content,
    order: messages.length + 1,
    isConclusion: true,
  };
}

/**
 * 会議全体を実行（順次意見 → 総合結論）
 * @param {string} topic
 * @param {Array<{ id: string, name: string, icon: string, color: string }>} discussionRoles
 * @param {(message: object) => void} onMessage — 各発言完了時のコールバック
 * @param {number} delayMs — 発言間の待機（UX用）
 */
export async function runMeeting(topic, discussionRoles, onMessage, delayMs = 600) {
  /** @type {Array<{ roleId: string, roleName: string, content: string }>} */
  const messages = [];

  for (const role of discussionRoles) {
    await sleep(delayMs);
    const opinion = generateOpinion(role, topic, messages);
    messages.push(opinion);
    onMessage(opinion);
  }

  await sleep(delayMs);
  const conclusion = generateConclusion(topic, messages);
  onMessage(conclusion);

  return { messages, conclusion };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
