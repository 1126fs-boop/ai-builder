/**
 * AI会議 — 役割ごとに異なる声を生成するエンジン
 *
 * 全役割が同じテンプレートにならないよう、専門性・反論・改善案を分岐させる。
 */

/** 役割Aが役割Bに反論しやすいマトリクス */
const ROLE_CONFLICT_TARGETS = {
  sales_director: ["top_sales", "executive"],
  top_sales: ["sales_director", "marketer"],
  beauty_consultant: ["top_sales", "marketer"],
  marketer: ["sns_manager", "top_sales"],
  executive: ["marketer", "recruiter"],
  sns_manager: ["marketer", "beauty_consultant"],
  recruiter: ["executive", "sales_director"],
};

/** 第1ラウンド — 役割固有の初見意見 */
export function buildRoleProposal(role, topic) {
  const exp = role._exp || {};
  const builders = {
    sales_director: () =>
      `【営業部長】組織KPI視点。「${topic}」は商談化率・成約率のどちらに効くか先に決めろ。現場任せは再現性ゼロ。`,
    top_sales: () =>
      `【トップ営業】現場視点。「${topic}」は初回15分のヒアリングで刺さるかが全て。商品説明から入るのは失敗パターン。`,
    beauty_consultant: () =>
      `【美容コンサル】サロン経営視点。「${topic}」は客数・客単価・リピートのどれに直結するか。施術者目線はNG。`,
    marketer: () =>
      `【マーケター】ファネル視点。「${topic}」の訴求が広すぎ。認知→教育→成約で段階を分けないと効果測定不能。`,
    executive: () =>
      `【経営者】ROI視点。「${topic}」の投資回収期間が見えない提案は却下。3ヶ月PoC→数値→全社展開の順。`,
    sns_manager: () =>
      `【SNS運用】来店導線視点。「${topic}」は保存率よりプロフィール遷移・DM/予約CTA。いいね追いは時間の無駄。`,
    recruiter: () =>
      `【採用】組織視点。「${topic}」を回す人がいなければ机上の空論。定着・育成コストを含めた実行計画が必要。`,
  };

  const insight = (builders[role.id] || (() => `【${role.name}】${exp.focus}の観点で「${topic}」を分析`))();

  return {
    insight,
    action: buildRoleAction(role, topic),
    risk: exp.risk || "実行リスク",
  };
}

/** 第2ラウンド — 他役割への反論・補足 */
export function buildRoleDebate(role, topic, refMessages) {
  const ref = refMessages[0];
  const refName = ref?.roleName || "他参加者";
  const refSnippet = (ref?.content || "").split("\n")[0]?.slice(0, 60) || "";

  const debates = {
    sales_director: `【反論→${refName}】「${refSnippet}…」は現場再現性が弱い。KPI分解と週次パイプライン管理を先に。`,
    top_sales: `【反論→${refName}】ヒアリング設計が不足。「${topic}」は共感→深掘り3問→PoCの順が必須。`,
    beauty_consultant: `【補足→${refName}】美容BtoBは季節性とオーナー決裁心理が鍵。繁忙期/閑散期の文脈を入れろ。`,
    marketer: `【反論→${refName}】訴求がファネル上段だけ。「${topic}」の成約導線（CTA1つ）が見えない。`,
    executive: `【反論→${refName}】ROI根拠が薄い。保守試算+2週間Quick Winを明示しろ。`,
    sns_manager: `【反論→${refName}】ビジュアル/話題先行は来店に繋がらない。保存→プロフィール→予約の3段設計を。`,
    recruiter: `【補足→${refName}】実行リソース不足。「${topic}」を回す担当・育成計画がないと定着しない。`,
  };

  const text = debates[role.id] || `【検討→${refName}】${role.name}として補足: ${refSnippet}`;
  const stance = text.includes("反論") ? "counter" : "supplement";

  return { insight: text, stance, action: buildRoleAction(role, topic) };
}

/** 第3ラウンド — 統合前の改善案 */
export function buildRoleRefinement(role, topic, round1Insight) {
  const refinements = {
    sales_director: `【改善】組織KPI（商談化率）に「${topic}」を紐づけ。現場マニュアル化まで含める。`,
    top_sales: `【改善】初回ヒアリング台本+反論処理を具体化。商品説明パートを削除。`,
    beauty_consultant: `【改善】客単価/リピート/稼働率のどれに効くか1行で明示。季節要素追加。`,
    marketer: `【改善】教育30%→信頼→CTA1つ。Before/After数字を入れる。`,
    executive: `【改善】3ヶ月PoC条件+保守ROI+撤退基準を明記。`,
    sns_manager: `【改善】1行目フック→保存→プロフィールCTA。リール/フィード使い分け。`,
    recruiter: `【改善】担当者1名+30日オンボーディング計画。「${topic}」実行の定着設計。`,
  };

  return {
    insight: refinements[role.id] || `【改善】${round1Insight?.slice(0, 40) || topic} → 実行可能な粒度へ`,
    action: buildRoleAction(role, topic),
  };
}

/** 反論対象メッセージを選ぶ */
export function pickRoleDebateTarget(roleId, messages) {
  const targets = ROLE_CONFLICT_TARGETS[roleId] || [];
  for (const tid of targets) {
    const msg = messages.find((m) => m.roleId === tid);
    if (msg) return [msg];
  }
  return messages.filter((m) => m.roleId !== roleId).slice(-2);
}

function buildRoleAction(role, topic) {
  const actions = {
    sales_director: `Week1: KPI分解 / Week2-4: パイプライン整備 / Week5-8: 横展開（${topic}）`,
    top_sales: `明日: ヒアリング3問を試す → 2週間PoC → 成約率測定`,
    beauty_consultant: `サロン3社ヒアリング → メニュー/KPI再設計 → 90日検証`,
    marketer: `ファネル設計 → A/Bテスト → CTA1つに絞る`,
    executive: `PoC予算承認 → 2週間Quick Win → ROI判定`,
    sns_manager: `1行目フック作成 → 保存率計測 → プロフィールCTA最適化`,
    recruiter: `担当者アサイン → 30日育成 → 定着率チェック`,
  };
  return actions[role.id] || `「${topic}」を2週間PoCで検証`;
}
