/**
 * Lens 人格・評価軸 — 専門家としての「違い」を定義
 *
 * 各 Lens の voice / priorities / rejects / evaluationAxes を定義し、
 * 同じ入力でも異なる視点の評価が出るようにする。
 */

/** @type {Record<string, { voice: string, priorities: string[], rejects: string[], evaluationAxes: { id: string, label: string, question: string }[] }>} */
export const LENS_PERSONAS = {
  sns: {
    voice: "データドリブン・来店導線重視",
    priorities: ["保存率", "プロフィール遷移", "CTA1つ"],
    rejects: ["いいね至上主義", "CTA乱立"],
    evaluationAxes: [
      { id: "save_path", label: "保存導線", question: "保存→プロフィール/DMの導線は1本化されているか" },
      { id: "kpi_link", label: "KPI連動", question: "来店・問い合わせKPIに直結する設計か" },
    ],
  },
  instagram: {
    voice: "3秒フック・視覚停止重視",
    priorities: ["1行目フック", "カルーセル1枚目", "保存率"],
    rejects: ["長文冒頭", "結論後出し"],
    evaluationAxes: [
      { id: "hook_3sec", label: "3秒フック", question: "1行目でスクロールを止められるか" },
      { id: "visual_hierarchy", label: "視覚階層", question: "テキストとビジュアルの優先順位は明確か" },
    ],
  },
  beauty: {
    voice: "経営者目線・季節性重視",
    priorities: ["客数", "客単価", "リピート", "季節性"],
    rejects: ["施術者向けBtoC", "商品スペック起点"],
    evaluationAxes: [
      { id: "owner_kpi", label: "オーナーKPI", question: "サロンオーナーの経営数字に効く訴求か" },
      { id: "seasonality", label: "季節性", question: "繁忙期/閑散期の文脈があるか" },
    ],
  },
  marketing: {
    voice: "ファネル設計・教育型",
    priorities: ["認知→教育→成約", "Before/After", "信頼構築"],
    rejects: ["押し売り", "訴求の散漫"],
    evaluationAxes: [
      { id: "funnel", label: "ファネル", question: "認知と成約の段階が分かれているか" },
      { id: "trust", label: "信頼", question: "教育パートで信頼を積んでいるか" },
    ],
  },
  copy: {
    voice: "短く鋭く・1メッセージ1CTA",
    priorities: ["ヘッド7字", "サブ1行", "CTA1つ"],
    rejects: ["情報3点以上", "CTA複数"],
    evaluationAxes: [
      { id: "one_message", label: "1メッセージ", question: "伝えたいことは1つに絞れているか" },
      { id: "cta_single", label: "CTA単一", question: "CTAは1つだけか" },
    ],
  },
  design: {
    voice: "視認性・オリジナル性",
    priorities: ["情報量削減", "商品ゾーン", "HP非模倣"],
    rejects: ["HP再現", "商品AI生成", "情報過多"],
    evaluationAxes: [
      { id: "visual_clarity", label: "視認性", question: "3秒で何の広告か分かるか" },
      { id: "originality", label: "オリジナル", question: "毎回新規デザインになっているか" },
    ],
  },
  sales: {
    voice: "ヒアリング先行・PoC提案",
    priorities: ["共感", "SPIN深掘り", "PoC"],
    rejects: ["商品説明から入る", "押し売り"],
    evaluationAxes: [
      { id: "hearing", label: "ヒアリング", question: "深掘り質問の設計があるか" },
      { id: "poc", label: "PoC", question: "小さく試す提案があるか" },
    ],
  },
  psychology: {
    voice: "不安先回り・リスク低減",
    priorities: ["効果不安", "定着不安", "投資回収"],
    rejects: ["煽り", "恐怖訴求"],
    evaluationAxes: [
      { id: "risk_reduce", label: "リスク低減", question: "オーナーの不安に先回りしているか" },
      { id: "soft_tone", label: "トーン", question: "押し・煽りが強すぎないか" },
    ],
  },
  management: {
    voice: "KPI分解・現場実行可能性",
    priorities: ["客数×客単価×リピート", "90日KPI", "現場負荷"],
    rejects: ["理想論", "KPI不明"],
    evaluationAxes: [
      { id: "kpi_formula", label: "KPI式", question: "経営数字の式で分解されているか" },
      { id: "feasibility", label: "実行可能性", question: "現場が回せる計画か" },
    ],
  },
  roi: {
    voice: "保守試算・投資判断",
    priorities: ["【】数字", "Quick Win", "回収期間"],
    rejects: ["根拠なき+30%", "誇大効果"],
    evaluationAxes: [
      { id: "numbers", label: "数字根拠", question: "保守的な数字試算があるか" },
      { id: "payback", label: "回収", question: "2週間Quick Win→回収期間の順か" },
    ],
  },
};

/** 人格定義を取得 */
export function getLensPersona(lensId) {
  return LENS_PERSONAS[lensId] || {
    voice: "専門家視点",
    priorities: [],
    rejects: [],
    evaluationAxes: [{ id: "general", label: "一般", question: "経営課題起点か" }],
  };
}

/**
 * Lens 固有の評価軸で入力を採点し、指摘文を生成
 * @param {Object} lens
 * @param {Object} ctx
 */
export function evaluateByLensAxes(lens, ctx) {
  const persona = getLensPersona(lens.id);
  const { purpose, challenge, categoryId } = ctx;
  const sc = challenge.surfaceChallenge || "経営課題";
  const corpus = [
    purpose.primaryGoal,
    purpose.audience,
    purpose.tone,
    sc,
    challenge.impact,
    ...(purpose.constraints || []),
  ]
    .filter(Boolean)
    .join(" ");

  const findings = [];
  const passes = [];

  for (const axis of persona.evaluationAxes) {
    const result = scoreAxis(axis.id, corpus, ctx, categoryId);
    if (result.pass) {
      passes.push(`✓ ${axis.label}: ${result.note}`);
    } else {
      findings.push(`✗ ${axis.label}: ${result.note}`);
    }
  }

  for (const reject of persona.rejects) {
    if (corpus.includes(reject) || shouldReject(reject, corpus, lens.id)) {
      findings.push(`✗ ${lens.label}の拒否基準: 「${reject}」に該当`);
    }
  }

  return { findings, passes, persona };
}

function scoreAxis(axisId, corpus, ctx, categoryId) {
  const sc = ctx.challenge.surfaceChallenge || "経営課題";
  const has = (...words) => words.some((w) => corpus.includes(w));

  switch (axisId) {
    case "hook_3sec":
      return has("フック", "3秒", "1行目", "【")
        ? { pass: true, note: "フック要素あり" }
        : { pass: false, note: "1行目3秒フックが不足" };
    case "save_path":
      return has("保存", "プロフィール", "DM", "CTA")
        ? { pass: true, note: "保存→遷移導線あり" }
        : { pass: false, note: "保存後の来店導線が弱い" };
    case "owner_kpi":
      return has("客単価", "リピート", "客数", "KPI", "経営")
        ? { pass: true, note: "オーナーKPIに言及" }
        : { pass: false, note: `${sc}が経営KPIに未接続` };
    case "seasonality":
      return has("季節", "繁忙", "閑散", "春", "夏", "秋", "冬")
        ? { pass: true, note: "季節文脈あり" }
        : { pass: false, note: "美容業界の季節性が未反映" };
    case "funnel":
      return has("教育", "信頼", "ファネル", "認知", "成約")
        ? { pass: true, note: "ファネル設計あり" }
        : { pass: false, note: "認知→成約の段階設計不足" };
    case "one_message":
      return !has("3点", "複数", "また")
        ? { pass: true, note: "メッセージ集中" }
        : { pass: false, note: "訴求が複数に分散" };
    case "cta_single":
      return !corpus.match(/CTA.*CTA/) && !has("2つ", "複数CTA")
        ? { pass: true, note: "CTA単一" }
        : { pass: false, note: "CTAが2つ以上" };
    case "visual_clarity":
      return categoryId === "image" || has("階層", "視認", "ヘッド")
        ? { pass: true, note: "視認性考慮あり" }
        : { pass: false, note: "情報量過多の恐れ" };
    case "hearing":
      return has("ヒアリング", "SPIN", "深掘り", "質問")
        ? { pass: true, note: "ヒアリング設計あり" }
        : { pass: false, note: "ヒアリング不足" };
    case "risk_reduce":
      return has("PoC", "小規模", "不安", "リスク")
        ? { pass: true, note: "リスク低減あり" }
        : { pass: false, note: "オーナー不安への先回り不足" };
    case "kpi_formula":
      return has("客数", "客単価", "リピート", "×", "KPI")
        ? { pass: true, note: "KPI分解あり" }
        : { pass: false, note: "KPI式分解なし" };
    case "numbers":
      return has("【", "ROI", "試算", "数字", "回収")
        ? { pass: true, note: "数字根拠あり" }
        : { pass: false, note: "保守試算が不足" };
    default:
      return has("経営課題", sc)
        ? { pass: true, note: "経営課題起点" }
        : { pass: false, note: "経営課題起点でない" };
  }
}

function shouldReject(reject, corpus, lensId) {
  if (reject === "商品スペック起点" && /スペック|成分|容量/.test(corpus) && !/経営課題|KPI/.test(corpus)) {
    return true;
  }
  if (reject === "CTA乱立" && /CTA.*CTA|2つ.*CTA/.test(corpus)) return true;
  if (reject === "いいね至上主義" && lensId === "sns" && /いいね/.test(corpus) && !/保存|来店/.test(corpus)) {
    return true;
  }
  return false;
}

/**
 * 第1ラウンド意見の多様性を測定（0〜1、低いほど同質）
 * @param {Object[]} opinions
 */
export function measureOpinionDiversity(opinions) {
  if (opinions.length < 2) return 0;

  const tokenSets = opinions.map((o) => new Set(tokenize(o.insight || "")));
  let totalOverlap = 0;
  let pairs = 0;

  for (let i = 0; i < tokenSets.length; i++) {
    for (let j = i + 1; j < tokenSets.length; j++) {
      const a = tokenSets[i];
      const b = tokenSets[j];
      const intersection = [...a].filter((t) => b.has(t)).length;
      const union = new Set([...a, ...b]).size;
      totalOverlap += union > 0 ? intersection / union : 0;
      pairs++;
    }
  }

  const avgOverlap = pairs > 0 ? totalOverlap / pairs : 1;
  return Math.round((1 - avgOverlap) * 100) / 100;
}

function tokenize(text) {
  return text
    .replace(/[【】「」]/g, " ")
    .split(/[\s、。・]+/)
    .filter((t) => t.length >= 2);
}

/** 再議論が必要か */
export function needsRedebate(round1Ops, round2Ops) {
  const diversity = measureOpinionDiversity(round1Ops);
  const counterCount = round2Ops.filter((o) => o.stance === "counter").length;
  return diversity < 0.35 || counterCount < 2;
}
