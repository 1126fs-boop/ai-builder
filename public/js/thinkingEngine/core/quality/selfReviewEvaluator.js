/**
 * 出力品質セルフレビュー — 生成プロンプトの事後検査とブラッシュアップ
 *
 * LLM API 不要。ルールベースで曖昧さ・目的・カテゴリ適合を検査し、
 * 改善指示をプロンプトに追記する。
 */

const AMBIGUOUS_PATTERNS = [
  /適宜/g,
  /など(?![の])/g,
  /よしなに/g,
  /なんとなく/g,
  /適当に/g,
  /いい感じに/g,
];

const BEAUTY_B2B_KEYWORDS = ["サロン", "クリニック", "美容", "オーナー", "経営", "BtoB"];

const CATEGORY_KEYWORDS = {
  proposal: ["提案", "ROI", "Before", "After", "PoC", "KPI"],
  sns: ["キャプション", "ハッシュタグ", "Instagram", "保存", "フック"],
  newsletter: ["件名", "プレヘッダー", "PS", "教育", "CTA"],
  sales: ["ヒアリング", "SPIN", "反論", "クロージング", "アイスブレイク"],
  image: ["ヘッドライン", "POP", "掲示", "コピー階層"],
};

/**
 * @param {string} categoryId
 * @param {Object} blueprintPayload
 * @param {Object} promptBundle
 */
export function runSelfReview(categoryId, blueprintPayload, promptBundle) {
  const text = [promptBundle.textPrompt, promptBundle.captionPrompt, promptBundle.systemPrompt]
    .filter(Boolean)
    .join("\n");

  const checks = [
    checkAmbiguity(text),
    checkPurposeClarity(text, blueprintPayload),
    checkCategoryFit(text, categoryId),
    checkBeautyIndustry(text),
    checkStrategicIntent(text, blueprintPayload),
    checkSelfReviewInstructions(text),
  ];

  const failed = checks.filter((c) => !c.pass);
  const score = checks.length ? Math.round((checks.filter((c) => c.pass).length / checks.length) * 100) / 100 : 1;

  const improvements = failed.map((c) => c.hint);
  const strengths = checks.filter((c) => c.pass).map((c) => c.label);

  return {
    passed: failed.length === 0,
    score,
    checks,
    improvements,
    strengths,
    needsRefinement: failed.length > 0,
  };
}

/**
 * セルフレビュー結果をプロンプト束に反映
 * @param {Object} promptBundle
 * @param {Object} review
 * @param {string} categoryId
 */
export function refinePromptBundle(promptBundle, review, categoryId) {
  if (!review.needsRefinement) return promptBundle;

  const refinementBlock = [
    "",
    "# 【品質セルフレビュー — 以下を修正してから出力】",
    ...review.improvements.map((h) => `- ${h}`),
    "",
    "上記の指摘を反映し、曖昧さを排除した最終版を出力してください。",
  ].join("\n");

  const refined = { ...promptBundle };
  if (refined.textPrompt) {
    refined.textPrompt = refined.textPrompt + refinementBlock;
  } else if (refined.captionPrompt) {
    refined.captionPrompt = refined.captionPrompt + refinementBlock;
  }

  refined._selfReviewApplied = true;
  refined._selfReviewScore = review.score;
  return refined;
}

function checkAmbiguity(text) {
  const found = [];
  for (const pat of AMBIGUOUS_PATTERNS) {
    const matches = text.match(pat);
    if (matches) found.push(...matches);
  }
  return {
    id: "ambiguity",
    label: "曖昧表現チェック",
    pass: found.length === 0,
    hint: found.length
      ? `曖昧語を排除: 「${[...new Set(found)].slice(0, 3).join("」「")}」→ 具体的な指示に置換`
      : null,
  };
}

function checkPurposeClarity(text, blueprint) {
  const hasGoal =
    text.includes("目的") ||
    text.includes("経営課題") ||
    Boolean(blueprint?.purpose?.primaryGoal && text.includes(blueprint.purpose.primaryGoal.slice(0, 10)));
  const hasIntent = text.includes("Why") || text.includes("なぜ") || text.includes("戦略的意図");
  return {
    id: "purpose",
    label: "目的の明確さ",
    pass: hasGoal && (hasIntent || Boolean(blueprint?.strategicIntent)),
    hint: !hasGoal
      ? "目的・経営課題をプロンプト冒頭に明示"
      : "戦略的意図（Why/What/How）をプロンプトに含める",
  };
}

function checkCategoryFit(text, categoryId) {
  const keywords = CATEGORY_KEYWORDS[categoryId] ?? [];
  const matchCount = keywords.filter((kw) => text.includes(kw)).length;
  return {
    id: "category",
    label: "カテゴリ適合性",
    pass: matchCount >= 2,
    hint: `カテゴリ固有要素を追加（${keywords.slice(0, 3).join("、")}等）`,
  };
}

function checkBeautyIndustry(text) {
  const matchCount = BEAUTY_B2B_KEYWORDS.filter((kw) => text.includes(kw)).length;
  return {
    id: "industry",
    label: "美容業界BtoB文脈",
    pass: matchCount >= 2,
    hint: "美容サロン・クリニック向けBtoBの文脈（経営課題・オーナー視点）を明示",
  };
}

function checkStrategicIntent(text, blueprint) {
  const hasBlueprint = Boolean(blueprint?.strategicBlueprint?.winStrategy);
  const inText = text.includes("勝ち筋") || text.includes("設計方向") || text.includes("thinkingCore");
  return {
    id: "strategy",
    label: "戦略設計の反映",
    pass: hasBlueprint ? inText : true,
    hint: "thinkingCore分析結果（勝ち筋・訴求優先順位）をプロンプトに含める",
  };
}

function checkSelfReviewInstructions(text) {
  return {
    id: "self_review_inst",
    label: "セルフレビュー指示",
    pass: text.includes("セルフレビュー") || text.includes("自己チェック"),
    hint: "出力前セルフレビュー指示をプロンプト末尾に追加",
  };
}
