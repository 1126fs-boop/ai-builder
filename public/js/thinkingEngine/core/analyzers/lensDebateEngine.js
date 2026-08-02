/**
 * Lens Debate Engine — 専門 Lens ごとに「違う声」を生成
 *
 * テンプレートの言い換えではなく、役割固有の評価軸・反論・改善案を出す。
 */

/** Lens 間の対立マトリクス（A が B に反論しやすい） */
const CONFLICT_TARGETS = {
  sns: ["copy", "design"],
  instagram: ["marketing", "copy"],
  beauty: ["sales", "marketing"],
  marketing: ["copy", "psychology"],
  copy: ["design", "instagram"],
  design: ["marketing", "copy"],
  sales: ["marketing", "psychology"],
  psychology: ["sales", "roi"],
  management: ["sales", "roi"],
  roi: ["psychology", "management"],
};

/** 第1ラウンド — 専門家としての「最初の提案」（Lens ごとに文体・評価軸を変える） */
export function buildLensProposal(lens, ctx) {
  const { purpose, challenge, knowledge, categoryId } = ctx;
  const sc = challenge.surfaceChallenge || "経営課題";
  const audience = purpose.audience || "サロンオーナー";
  const goal = purpose.primaryGoal || "成果物の改善";
  const season = knowledge?.trends?.[0]?.text?.slice(0, 40) || "繁忙期・閑散期の波";

  const builders = {
    sns: () =>
      `【SNS運用】保存率とプロフィール遷移がKPI。${sc}は「共感→保存→DM/来店」の3段で設計すべき。いいねだけ追うと${audience}の行動変容に繋がらない。`,
    instagram: () =>
      `【Instagram】1行目3秒でスクロール停止。${sc}を「数字 or 問いかけ」でフック化。カルーセル1枚目は結論先出し。保存率<3%なら構成から作り直し。`,
    beauty: () =>
      `【美容業界】${audience}は施術者ではなく経営者。${sc}は客数・客単価・リピート・稼働率のどれに効くか明示。${season}を踏まえた訴求が必要。`,
    marketing: () =>
      `【マーケ】BtoBは教育→信頼→リードの順。${goal}の前に「なぜ今」が弱い。${sc}をファネル上段（認知）と下段（成約）で分けて設計。`,
    copy: () =>
      `【コピー】${sc}→${challenge.impact || "成果"}を1メッセージ1CTAに圧縮。情報3点以上は3秒ルール違反。ヘッドは【】強調+数字。`,
    design: () =>
      `【デザイン】情報量が多い。${sc}を視覚階層の1位に。商品は公式画像のみ・AI生成禁止。HPの見た目コピーは却下。`,
    sales: () =>
      `【営業】商品説明から入るのはNG。${sc}への共感→SPIN深掘り→PoC提案の順。ヒアリング不足で${goal}は達成不可。`,
    psychology: () =>
      `【心理】${audience}の不安は「効果が出るか・定着するか・投資回収」。${sc}訴求の前にリスク低減（小規模PoC）を示せ。`,
    management: () =>
      `【経営】${sc}は客数×客単価×リピート×稼働率の式で分解。現場が回らない理想論は却下。90日で測れるKPIを。`,
    roi: () =>
      `【ROI】${challenge.impact || "効果"}は【】で保守試算。根拠なき+30%は信頼を損なう。2週間Quick Win→回収期間の順。`,
  };

  let insight = (builders[lens.id] || (() => `${lens.label}: ${lens.focus} — ${sc}`))();

  if (categoryId === "sns" && lens.id === "design") {
    insight += " 保存率より「読了→タップ」の導線設計が先。";
  }
  if (categoryId === "image" && lens.id === "copy") {
    insight += " POP/バナーは7文字以内のヘッド+サブ1行が上限。";
  }

  return {
    insight,
    recommendation: buildLensRecommendation(lens, ctx),
    critique: lens.risk ? `盲点: ${lens.risk}` : null,
  };
}

/** 第2ラウンド — 他 Lens への反論・補足（役割がぶつかる） */
export function buildLensDebate(lens, ctx, targetOpinion) {
  const targetLabel = targetOpinion?.lensLabel || "他Lens";
  const targetInsight = targetOpinion?.insight || "";
  const sc = ctx.challenge.surfaceChallenge || "経営課題";

  const counterTemplates = {
    sns: `【反論→${targetLabel}】「${truncate(targetInsight, 50)}」は来店導線が弱い。保存後のCTA1つに絞れ。`,
    instagram: `【反論→${targetLabel}】ビジュアル先行は理解3秒を超える。${sc}を1行目テキストで先に。`,
    beauty: `【補足→${targetLabel}】美容BtoBは季節性とオーナー決裁心理が鍵。${sc}に繁忙期の文脈を。`,
    marketing: `【反論→${targetLabel}】訴求が広すぎ。ファネル上段だけで${sc}は刺さらない。`,
    copy: `【反論→${targetLabel}】CTAが2つ以上。1メッセージ1CTA違反。ヘッドを短く。`,
    design: `【反論→${targetLabel}】情報過多で視認性低下。商品ゾーン以外の装飾を削れ。`,
    sales: `【反論→${targetLabel}】ヒアリング前提の提案不足。${sc}の深掘り質問がない。`,
    psychology: `【反論→${targetLabel}】押し・煽りが強い。${ctx.purpose.audience}の不安先回りが足りない。`,
    management: `【反論→${targetLabel}】KPI分解なし。${sc}がどの数字に効くか不明。`,
    roi: `【反論→${targetLabel}】数字の根拠が薄い。【】試算かPoC条件を明示。`,
  };

  const stance = counterTemplates[lens.id]?.includes("反論") ? "counter" : "supplement";

  return {
    insight: counterTemplates[lens.id] || `【検討→${targetLabel}】${lens.focus}の視点: ${lens.example}`,
    recommendation: buildLensRecommendation(lens, ctx),
    stance,
    counterpoint: `${targetLabel}への${stance === "counter" ? "反論" : "補足"}`,
  };
}

/** 第3ラウンド — 統合前の改善案（ラウンド1+2を踏まえた Lens 固有の結論） */
export function buildLensRefinement(lens, ctx, round1, round2) {
  const sc = ctx.challenge.surfaceChallenge || "経営課題";
  const refinements = {
    sns: `【改善】${truncate(round1?.insight, 40)} → 保存率KPI+CTA1つ+${sc}フックの3点セットに統合`,
    instagram: `【改善】1行目フック確定→カルーセル2枚目以降で${sc}の根拠。リールは縦構図優先`,
    beauty: `【改善】${sc}を経営KPI（客単価/リピート）に紐づけ。季節・業界文脈を1行追加`,
    marketing: `【改善】教育パート30%→信頼→${sc}改善のCTA。押し売り表現を削除`,
    copy: `【改善】ヘッド7字以内+サブ1行+CTA1つ。${round2?.insight ? "R2指摘を反映" : ""}`,
    design: `【改善】情報量-30%。商品ゾーン確保。オリジナル配色でHP再現禁止`,
    sales: `【改善】共感→深掘り質問3つ→PoC。商品スペック列挙を削除`,
    psychology: `【改善】PoC・小規模開始で不安解消。煽り表現をソフト化`,
    management: `【改善】90日KPI+現場負荷チェック。${sc}の式分解を明記`,
    roi: `【改善】保守ROI+2週間Quick Win。数字に【】根拠`,
  };

  return {
    insight: refinements[lens.id] || `【改善】${lens.example}`,
    recommendation: round2?.recommendation || round1?.recommendation || buildLensRecommendation(lens, ctx),
    stance: "refinement",
  };
}

/** 反論対象 Lens を選ぶ */
export function pickDebateTarget(lensId, panel, round1Ops) {
  const targets = CONFLICT_TARGETS[lensId] || [];
  for (const tid of targets) {
    const op = round1Ops.find((o) => o.lensId === tid);
    if (op) return op;
  }
  const idx = panel.findIndex((l) => l.id === lensId);
  return round1Ops[(idx + 1) % round1Ops.length];
}

function buildLensRecommendation(lens, ctx) {
  const sc = ctx.challenge.surfaceChallenge || "経営課題";
  const recs = {
    sns: "保存→プロフィール/DM。CTAは1つのみ",
    instagram: "3秒フック→PAS→CTA1つ。カルーセル1枚目最適化",
    beauty: `${sc}を経営KPI起点。季節性を1要素入れる`,
    marketing: "教育30%→信頼→CTA。Before/After明示",
    copy: "【】フック+サブ1行+CTA1つ。自然な日本語",
    design: "毎回新規レイアウト。公式商品のみ配置",
    sales: "共感→SPIN3問→PoC提案。押し売り禁止",
    psychology: "不安先回り+PoC。恐怖訴求は控えめ",
    management: "小さく検証→KPI→仕組み化",
    roi: "保守試算+Quick Win 2週間",
  };
  return recs[lens.id] || `${sc}と${ctx.purpose.primaryGoal}を一貫`;
}

function truncate(str, len) {
  if (!str) return "";
  return str.length <= len ? str : `${str.slice(0, len)}…`;
}
