/**
 * 営業トーク — 成果物 Blueprint
 */

import {
  runLensReviews,
  evaluateDeliverableQuality,
  resolveRootCause,
  resolveIndustryContext,
  resolveImpact,
} from "./_shared.js";

const OPENING_BY_TYPE = {
  商談: "本日はお時間いただきありがとうございます。まず御社の状況をお伺いし、経営課題の整理から始めさせてください。",
  テレアポ: "お忙しいところ失礼します。○○と申します。30秒だけ、{industry}の{challenge}でお悩みのオーナー様に多い話を共有させてください。",
  DM: "突然のご連絡失礼します。{industry}向けに{challenge}の改善事例をご用意しました。",
  LINE: "お世話になっております。{challenge}でお困りのサロン様向けの情報を共有します。",
  新規開拓: "初めてのご連絡になります。{industry}の経営課題解決を支援しております。",
  既存フォロー: "前回のご提案のその後、いかがでしょうか。本日は{challenge}の進捗を確認させてください。",
};

export function buildSalesTalkBlueprint(answers) {
  const industry = answers.industry || "美容サロン";
  const challenge = answers.client_challenge || "売上アップ";
  const salesType = answers.sales_type || "商談";
  const goal = answers.goal || "商談成功";
  const rootCause = resolveRootCause(industry, challenge);
  const impact = resolveImpact(challenge);
  const industryContext = resolveIndustryContext(industry);

  const openingTemplate = OPENING_BY_TYPE[salesType] || OPENING_BY_TYPE.商談;
  const opening = openingTemplate
    .replace("{industry}", industry)
    .replace("{challenge}", challenge);

  const blueprint = {
    useCaseId: "sales_talk",
    purpose: `${industry}向け${salesType}。${challenge}（${rootCause}）の解決に向け${goal}を目指す`,
    industry,
    challenge,
    salesType,
    goal,
    rootCause,
    impact,
    industryContext,
    clientContext: answers.client_context || "",
    opening,
    hearingQuestions: [
      `現在の${challenge}について、具体的にどのあたりが一番のネックですか？`,
      `理想として、3ヶ月後にどんな状態になっていたいですか？`,
      `過去に試された施策で、うまくいかなかったことはありますか？`,
    ],
    proposalStory: `Before: ${challenge}（${rootCause}）→ After: ${impact}`,
    objectionResponses: [
      { q: "本当に効果がある？", a: `2週間のQuick Winで初期効果を確認。KPI: ${impact}` },
      { q: "スタッフが使える？", a: "導入研修＋週次フォローで定着支援" },
    ],
    closing: goal.includes("アポ")
      ? "来週○曜日、30分だけ詳細をお話しできませんか？"
      : goal.includes("受注")
        ? "次のステップとして、PoC開始日を決めさせてください。"
        : "本日の内容を踏まえ、次回○日にデモをご用意します。",
    constraintsSummary: "- 商品説明から入らない\n- 共感→ヒアリング→提案→CTA\n- 自然な日本語",
    outputFormat: answers.output_format || "営業台本",
    improvementPoints: [
      "ヒアリング3問は必ず実施",
      "Before/Afterを数字イメージで",
      `CTAは${goal}に直結`,
    ],
    sections: [
      "冒頭（共感）",
      "ヒアリング3問",
      "課題整理",
      "提案ストーリー",
      "反論処理",
      "クロージング",
    ],
  };

  blueprint.lensReviews = runLensReviews({
    context: blueprint,
    lenses: [
      { id: "top_sales", focus: "トップ営業", insight: () => `${salesType}では共感の質が成否を分ける。` },
      { id: "owner", focus: "オーナー", insight: () => "押し売り感が出た瞬間に心が閉じる。" },
      { id: "coach", focus: "営業コーチ", insight: () => `ゴール「${goal}」に向けたCTAは1つに絞る。` },
    ],
  });

  blueprint.quality = evaluateDeliverableQuality([
    { id: "industry", label: "業種", pass: Boolean(answers.industry) },
    { id: "challenge", label: "課題", pass: Boolean(answers.client_challenge) },
    { id: "hearing", label: "ヒアリング", pass: blueprint.hearingQuestions.length >= 3 },
    { id: "objection", label: "反論処理", pass: blueprint.objectionResponses.length >= 1 },
    { id: "closing", label: "クロージング", pass: Boolean(blueprint.closing) },
  ]);

  return blueprint;
}
