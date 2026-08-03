/**
 * 戦略的意図分析 — 表面的な入力から「本当に求めていること」を構造化
 *
 * 売上 / ブランディング / 集客 / リピート / 教育 の5軸で目的を整理し、
 * AnalysisContext の purpose.strategicIntent として返す。
 */

/** ビジネス目的タイプ */
export const BUSINESS_INTENT_TYPES = {
  revenue: { id: "revenue", label: "売上アップ", keywords: ["売上", "客単価", "稼働", "収益", "利益", "売上アップ"] },
  branding: { id: "branding", label: "ブランディング", keywords: ["ブランド", "信頼", "高級", "世界観", "差別化", "認知"] },
  acquisition: { id: "acquisition", label: "集客", keywords: ["集客", "新規", "来店", "問い合わせ", "リーチ", "認知獲得"] },
  repeat: { id: "repeat", label: "リピート", keywords: ["リピート", "再来", "継続", "定着", "会員", "フォロー"] },
  education: { id: "education", label: "教育・啓蒙", keywords: ["教育", "ノウハウ", "啓蒙", "理解", "啓発", "情報提供"] },
};

const APPEAL_INTENT_MAP = {
  売上アップ: "revenue",
  新メニュー訴求: "revenue",
  導入メリット: "revenue",
  ブランド訴求: "branding",
  信頼感: "branding",
  集客: "acquisition",
  新規獲得: "acquisition",
  リピート促進: "repeat",
  再来店: "repeat",
  教育: "education",
};

const PURPOSE_INTENT_MAP = {
  "フォロー・関係強化": "repeat",
  "新商品・新メニュー告知": "revenue",
  "セミナー・イベント告知": "acquisition",
  "教育・ノウハウ提供": "education",
  "キャンペーン告知": "revenue",
};

/**
 * @param {string} categoryId
 * @param {Object} answers
 * @param {import("../types/analysisContext.js").ChallengeAnalysis} challenge
 * @param {import("../types/analysisContext.js").PurposeAnalysis} purpose
 */
export function buildStrategicIntent(categoryId, answers, challenge, purpose) {
  const signals = collectIntentSignals(categoryId, answers, challenge, purpose);
  const scored = scoreIntentTypes(signals);
  const primary = scored[0];
  const secondary = scored.slice(1, 3).filter((s) => s.score >= primary.score * 0.5);

  const primaryType = primary?.type ?? "revenue";
  const primaryLabel = BUSINESS_INTENT_TYPES[primaryType]?.label ?? "売上アップ";

  const why = buildWhy(categoryId, primaryType, challenge, answers);
  const what = buildWhat(primaryType, challenge, purpose);
  const how = buildHow(categoryId, primaryType, answers, purpose);
  const audienceJob = buildAudienceJob(categoryId, primaryType, purpose, answers);

  return {
    primaryType,
    primaryLabel,
    secondaryTypes: secondary.map((s) => ({
      type: s.type,
      label: BUSINESS_INTENT_TYPES[s.type]?.label ?? s.type,
    })),
    why,
    what,
    how,
    audienceJob,
    businessGoal: `${primaryLabel} — ${what}`,
    confidence: Math.min(1, Math.round((primary?.score ?? 0.5) * 100) / 100),
  };
}

function collectIntentSignals(categoryId, answers, challenge, purpose) {
  const texts = [
    challenge?.surfaceChallenge,
    purpose?.primaryGoal,
    answers.free_input,
    answers.appeal_axis,
    answers.purpose,
    answers.goal,
    answers.value,
    answers.client_challenge,
    answers.appeal_point,
    answers.catch_direction,
  ]
    .filter(Boolean)
    .join(" ");

  const signals = { texts, explicit: [] };

  if (categoryId === "sns") {
    signals.explicit.push(APPEAL_INTENT_MAP[answers.appeal_axis] ?? inferFromText(texts));
  }
  if (categoryId === "newsletter") {
    signals.explicit.push(PURPOSE_INTENT_MAP[answers.purpose] ?? inferFromText(texts));
  }
  if (categoryId === "sales" || categoryId === "proposal") {
    signals.explicit.push(inferFromChallenge(answers.client_challenge) ?? inferFromText(texts));
  }
  if (categoryId === "image") {
    signals.explicit.push(APPEAL_INTENT_MAP[answers.appeal_point] ?? inferFromText(texts));
  }

  return signals;
}

function scoreIntentTypes(signals) {
  const combined = signals.texts.toLowerCase();
  const scores = Object.entries(BUSINESS_INTENT_TYPES).map(([type, def]) => {
    let score = 0;
    for (const kw of def.keywords) {
      if (combined.includes(kw.toLowerCase())) score += 1;
    }
    for (const ex of signals.explicit) {
      if (ex === type) score += 3;
    }
    return { type, score: score || 0.1 };
  });
  return scores.sort((a, b) => b.score - a.score);
}

function inferFromText(text) {
  const t = (text || "").toLowerCase();
  for (const [type, def] of Object.entries(BUSINESS_INTENT_TYPES)) {
    if (def.keywords.some((kw) => t.includes(kw.toLowerCase()))) return type;
  }
  return "revenue";
}

function inferFromChallenge(challenge) {
  const map = {
    売上アップ: "revenue",
    リピート率向上: "repeat",
    新規集客: "acquisition",
    客単価向上: "revenue",
    スタッフ定着: "education",
    ブランド力強化: "branding",
  };
  return map[challenge] ?? null;
}

function buildWhy(categoryId, primaryType, challenge, answers) {
  const surface = challenge?.surfaceChallenge ?? "経営課題";
  const industry = challenge?.industry ?? answers.industry ?? "美容サロン";
  const typeLabel = BUSINESS_INTENT_TYPES[primaryType]?.label ?? "";

  if (primaryType === "revenue") {
    return `${industry}が${surface}を解決し、数字で成果を出す必要があるため`;
  }
  if (primaryType === "branding") {
    return `${industry}の信頼・差別化を高め、選ばれる理由を明確にするため`;
  }
  if (primaryType === "acquisition") {
    return `${industry}に新規の見込み客・来店・問い合わせを増やすため`;
  }
  if (primaryType === "repeat") {
    return `${industry}の既存顧客・取引先との関係を深め、継続利用を促すため`;
  }
  if (primaryType === "education") {
    return `${categoryId === "newsletter" ? "読者" : "相手"}の理解を深め、信頼を築いてから提案するため`;
  }
  return `${typeLabel}を達成するため`;
}

function buildWhat(primaryType, challenge, purpose) {
  const impact = challenge?.impact ?? "経営改善";
  const goal = purpose?.primaryGoal ?? "";
  const typeActions = {
    revenue: `売上・客単価・稼働率の改善（${impact}）`,
    branding: "ブランド価値と信頼感の向上",
    acquisition: "新規リード・来店・問い合わせの獲得",
    repeat: "リピート率・継続率・LTVの向上",
    education: "経営ノウハウの提供と理解促進",
  };
  return typeActions[primaryType] ?? goal.slice(0, 80);
}

function buildHow(categoryId, primaryType, answers, purpose) {
  const categoryHow = {
    proposal: "共感→3層課題分析→Before/After→ROI→PoC→CTA",
    sns: "3秒フック→課題共感→訴求→保存/シェア→CTA",
    newsletter: "件名フック→教育型価値→ソフトセル→1CTA→PS",
    sales: "アイスブレイク→SPIN→深掘り→提案→反論→クロージング",
    image: "3秒ヘッドライン→訴求階層→視覚的インパクト→CTA",
  };
  const base = categoryHow[categoryId] ?? "課題共感→価値提示→CTA";
  const tone = purpose?.tone ? `（トーン: ${purpose.tone}）` : "";
  return `${base}${tone}`;
}

function buildAudienceJob(categoryId, primaryType, purpose, answers) {
  const audience = purpose?.audience ?? "サロンオーナー";
  const jobs = {
    revenue: `${audience}が「投資対効果が見える」と判断できる`,
    branding: `${audience}が「信頼できる・選びたい」と感じる`,
    acquisition: `${audience}が「試してみたい」と行動したくなる`,
    repeat: `${audience}が「また利用したい・紹介したい」と思う`,
    education: `${audience}が「明日使える」と実感できる`,
  };
  return jobs[primaryType] ?? `${audience}の経営課題解決に直結する`;
}
