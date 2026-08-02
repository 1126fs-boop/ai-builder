/**
 * 入力補完 — thinkingCore 内部
 *
 * 少ない入力でも KB・トレンド・学習事例から不足情報を補い、
 * 本当に必要な質問だけを残す。
 */

import { getActiveProducts, NO_PRODUCT_OPTION } from "../../../../wamProducts.js";
import { WAM_BRAND_TONE } from "../knowledge/wamKnowledgeBase.js";
import { APPEAL_TO_CHALLENGE } from "../knowledge/knowledgeRegistry.js";
import { getTrendsForCategorySync } from "../knowledge/trendsKnowledgeStore.js";
import { getLearnedInsightsForAnalysis } from "../knowledge/learningRegistry.js";
import { inferFieldsFromCorpus, parseFreeInputDirectives } from "./freeInputParser.js";

/** @typedef {{ field: string, value: string, source: string, confidence: number, reason: string }} EnrichmentSource */

/**
 * Knowledge Base から回答を補完
 * @param {string} categoryId
 * @param {Object} answers
 * @param {import("../../schemas/types.js").UseCaseSchema|null} schema
 */
export function enrichAnswersFromKnowledge(categoryId, answers, schema) {
  const base = { ...(answers ?? {}) };
  /** @type {EnrichmentSource[]} */
  const sources = [];

  const corpus = collectTextCorpus(base);

  // 商品名をテキストから検出（例: 「ハイパーナイフのSNS投稿」）
  if (!base.wam_product?.trim()) {
    const product = detectProductFromText(corpus);
    if (product) {
      base.wam_product = product.name;
      sources.push({
        field: "wam_product",
        value: product.name,
        source: "product_kb",
        confidence: 0.92,
        reason: `入力文から公式商品「${product.name}」を検出`,
      });
    }
  }

  applyCategoryEnrichment(categoryId, base, corpus, sources);

  // 自由記述の構造化（AnalysisContext へ渡す）
  const userDirectives = parseFreeInputDirectives(base.free_input);
  if (userDirectives.hasContent) {
    base._userDirectives = userDirectives;
  }

  // 自由記述 + 回答全体から不足フィールドを推定
  const enrichedCorpus = [base.free_input, corpus].filter(Boolean).join(" ");
  const inferredFromText = inferFieldsFromCorpus(categoryId, enrichedCorpus);
  for (const [field, value] of Object.entries(inferredFromText)) {
    if (!base[field]?.trim?.()) {
      sources.push({
        field,
        value,
        source: "free_input_parse",
        confidence: 0.72,
        reason: "自由記述・入力文から推定",
      });
      base[field] = value;
    }
  }

  // スキーマ既定値（aspect / tone 等）
  const schemaDefaults = schema?.inferDefaults?.(base) ?? {};
  for (const [key, value] of Object.entries(schemaDefaults)) {
    if (!base[key]?.trim?.() && value) {
      if (!sources.some((s) => s.field === key)) {
        sources.push({
          field: key,
          value: String(value),
          source: "schema_defaults",
          confidence: 0.75,
          reason: "カテゴリスキーマの標準値",
        });
      }
      base[key] = value;
    }
  }

  // トレンド・学習はメタデータとして保持（回答フィールドには入れない）
  const trends = getTrendsForCategorySync(categoryId).slice(0, 3);
  const learned = getLearnedInsightsForAnalysis(categoryId);

  base._kbEnrichment = {
    sources,
    enrichedFields: sources.map((s) => s.field),
    trendsApplied: trends.map((t) => (typeof t === "string" ? t : t.text)).slice(0, 3),
    successHints: (learned.successCases ?? []).slice(0, 2).map((s) => s.summary || s.title),
    enrichmentConfidence: computeEnrichmentConfidence(sources),
  };

  return {
    answers: base,
    enrichmentSources: sources,
    enrichedFields: sources.map((s) => s.field),
    enrichmentConfidence: base._kbEnrichment.enrichmentConfidence,
  };
}

/** @param {EnrichmentSource[]} sources */
function computeEnrichmentConfidence(sources) {
  if (!sources.length) return 0;
  const avg = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
  return Math.round(Math.min(1, avg + sources.length * 0.03) * 100) / 100;
}

function collectTextCorpus(answers) {
  return Object.entries(answers)
    .filter(([k]) => !k.startsWith("_"))
    .map(([, v]) => (typeof v === "string" ? v : ""))
    .filter(Boolean)
    .join(" ");
}

/**
 * テキストから WAM 公式商品を推定
 * @param {string} text
 */
export function detectProductFromText(text) {
  if (!text?.trim()) return null;

  if (/商品なし|背景のみ|人物のみ/.test(text)) return null;

  const products = getActiveProducts();

  // EX 系を優先
  if (/ハイパーナイフ\s*EX|EX2/i.test(text)) {
    return products.find((p) => p.id === "hyperknife_ex") ?? null;
  }

  // 部分一致（長い商品名を優先）
  let best = null;
  let bestScore = 0;

  for (const product of products) {
    const candidates = [product.name, product.id.replace(/_/g, " ")];
    if (product.name.includes("ハイパーナイフ")) candidates.push("ハイパーナイフ");

    for (const pattern of candidates) {
      if (pattern.length < 3) continue;
      if (text.includes(pattern)) {
        const score = pattern.length + (product.name.length * 0.01);
        if (score > bestScore) {
          bestScore = score;
          best = product;
        }
      }
    }
  }

  // 「ハイパーナイフ」のみ → 定番のハイパーナイフ7
  if (!best && text.includes("ハイパーナイフ")) {
    best = products.find((p) => p.id === "hyperknife") ?? null;
  }

  return best;
}

/**
 * @param {string} categoryId
 * @param {Object} base
 * @param {string} corpus
 * @param {EnrichmentSource[]} sources
 */
function applyCategoryEnrichment(categoryId, base, corpus, sources) {
  const add = (field, value, source, confidence, reason) => {
    if (base[field]?.trim?.()) return;
    base[field] = value;
    sources.push({ field, value, source, confidence, reason });
  };

  const toneDefault = WAM_BRAND_TONE?.primary ?? "高級感・信頼感（ワムブランド準拠）";

  if (categoryId === "sns") {
    if (/リール|reels/i.test(corpus)) {
      add("sns_format", "Instagramリール", "category_kb", 0.85, "入力文からリール形式を推定");
    } else if (/ストーリー|story/i.test(corpus)) {
      add("sns_format", "Instagramストーリー", "category_kb", 0.85, "入力文からストーリー形式を推定");
    } else if (/SNS|Instagram|インスタ/i.test(corpus)) {
      add("sns_format", "Instagram投稿", "category_kb", 0.8, "SNS/Instagram 文脈から形式を推定");
    }

    add("target_audience", "サロンオーナー", "beauty_kb", 0.78, "WAM BtoB 標準ターゲット");

    if (/新商品|新機器|発売|告知/.test(corpus)) {
      add("appeal_axis", "新商品告知", "category_kb", 0.82, "新商品文脈から訴求軸を推定");
    } else if (/成功事例|導入事例|事例/.test(corpus)) {
      add("appeal_axis", "成功事例", "category_kb", 0.8, "事例訴求を推定");
    } else if (/リピート|再来/.test(corpus)) {
      add("appeal_axis", "リピート率向上", "category_kb", 0.78, "リピート訴求を推定");
    } else {
      add("appeal_axis", "導入メリット", "category_kb", 0.72, "BtoB 標準訴求軸");
    }

    add("tone", toneDefault, "brand_kb", 0.7, "ワムブランドトーン");
    add("industry", "美容サロン", "beauty_kb", 0.75, "美容業界標準");
  }

  if (categoryId === "newsletter") {
    add("audience", "サロンオーナー", "beauty_kb", 0.78, "BtoB 標準読者");
    add("tone", toneDefault, "brand_kb", 0.7, "ワムブランドトーン");
    if (!base.purpose?.trim()) {
      add("purpose", "新商品・新機器のご案内", "category_kb", 0.65, "メルマガ標準目的");
    }
  }

  if (categoryId === "proposal") {
    add("industry", "美容サロン", "beauty_kb", 0.75, "美容業界標準");
    add("tone", toneDefault, "brand_kb", 0.7, "ワムブランドトーン");
  }

  if (categoryId === "sales") {
    add("industry", "美容サロン", "beauty_kb", 0.75, "美容業界標準");
    add("tone", toneDefault, "brand_kb", 0.7, "ワムブランドトーン");
  }

  if (categoryId === "image") {
    if (base.usage && !base.display_location?.trim()) {
      const loc = {
        店内POP: "サロン店内",
        提案資料用ビジュアル: "クリニック受付",
        SNS投稿画像: "デジタル配信（SNS等）",
        "セミナー・展示会用": "展示会ブース",
      }[base.usage];
      if (loc) add("display_location", loc, "category_kb", 0.9, "用途から掲示場所を推定");
    }
    if (base.usage && !base.appeal_point?.trim()) {
      const ap = {
        店内POP: "キャンペーン",
        提案資料用ビジュアル: "導入メリット",
        SNS投稿画像: "導入メリット",
        "セミナー・展示会用": "導入メリット",
      }[base.usage];
      if (ap) add("appeal_point", ap, "category_kb", 0.88, "用途から訴求軸を推定");
    }
    add("tone", toneDefault, "brand_kb", 0.7, "ワムブランドトーン");
  }

  // 訴求軸 → 経営課題のヒント（challenge 分析で利用）
  if (base.appeal_axis && APPEAL_TO_CHALLENGE[base.appeal_axis]) {
    add(
      "client_challenge",
      APPEAL_TO_CHALLENGE[base.appeal_axis],
      "category_kb",
      0.68,
      "訴求軸から経営課題を推定"
    );
  }
}

/**
 * 補完済みフィールドかどうか（ギャップ分析用）
 * @param {string} fieldId
 * @param {EnrichmentSource[]} sources
 * @param {number} minConfidence
 */
export function isKbEnrichedField(fieldId, sources, minConfidence = 0.7) {
  const hit = sources.find((s) => s.field === fieldId);
  return Boolean(hit && hit.confidence >= minConfidence);
}
