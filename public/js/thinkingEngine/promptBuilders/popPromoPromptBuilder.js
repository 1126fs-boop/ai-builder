/**
 * POP・販促物 — Prompt Builder
 */

import { unwrapBlueprint } from "../core/types/blueprint.js";
import {
  buildSystemPrompt,
  buildProductKnowledgeBlock,
  buildCreativeScenePrompt,
  buildCreativeDesignPrinciplesBlock,
  buildStandardNegativePrompt,
  buildImageDirective,
  formatSynthesisHints,
  buildAnalysisReflectionBlock,
  buildKnowledgePromptBlock,
  DEFAULT_CONSTRAINTS,
} from "./_shared.js";

export function buildPopPromoPrompts(blueprint) {
  const bp = unwrapBlueprint(blueprint);
  const purpose = bp.purpose ?? {};
  const product = bp.productAsset ?? null;
  const answers = { wam_product: bp.product };
  const brief = bp.creativeBrief ?? null;

  const creativeBlock = (bp.creativeDirections || bp.layoutInstructions || [])
    .map((l, i) => `${i + 1}. ${l}`)
    .join("\n");
  const lensBlock = (bp.lensReviews || [])
    .map((l) => `- ${l.focus}: ${l.insight}`)
    .join("\n");

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB向け販促物（POP・店内掲示）のオリジナルクリエイティブ設計者",
    mission: purpose.primaryGoal || `${bp.usage} — ${bp.displayLocation}向け新規販促デザイン`,
    includeCreativeRules: true,
    constraints: [
      ...DEFAULT_CONSTRAINTS,
      "公式HPはKnowledge Baseのみ。HPデザイン再現禁止",
      "商品画像のみ公式画像を配置（AI生成・改変禁止）",
      "背景・配色・タイポ・装飾は毎回ゼロから新規設計",
      "3秒で訴求が伝わるオリジナル構成",
    ],
  });

  const productBlock = buildProductKnowledgeBlock(product, answers);
  const principlesBlock = brief ? buildCreativeDesignPrinciplesBlock(brief) : "";
  const knowledgeBlock = buildKnowledgePromptBlock(bp);

  const headlineBlock = (bp.headlineVariants || [bp.headline]).map((h, i) => `${i + 1}. ${h}`).join("\n");
  const hierarchyBlock = (bp.copyHierarchy || []).map((c) => `- ${c}`).join("\n");

  const textPrompt = `# 依頼
${bp.usage}の【オリジナル販促クリエイティブ】制作指示書を、美容業界プロの販促デザイナーレベルで作成してください。
公式HPのデザインを再現せず、公式素材を使った新しい販促物を設計してください。

${productBlock}

${knowledgeBlock}

${principlesBlock}

# thinkingCore 分析結果
${buildAnalysisReflectionBlock(bp)}

【訴求】${bp.appealPoint}
【掲示場所】${bp.displayLocation}
【サイズ】${bp.sizeFormat}
【トーン】${bp.style}
【経営課題】${bp.challenge?.surfaceChallenge ?? ""}
【季節性】${bp.seasonalHook || ""}
【レイアウト】${bp.layoutHint || ""}

# コピー階層
${hierarchyBlock}

# ヘッドライン案（3秒ルール）
${headlineBlock}

# サブコピー
${bp.subCopy}

# オリジナルクリエイティブ方向
${creativeBlock}

# 多視点チェック
${lensBlock}

${formatSynthesisHints(bp.synthesis)}

# 出力
1. オリジナルデザイン指示（配色・構図・タイポ — HP再現禁止）
2. ヘッドライン3案
3. サブコピー
4. 印刷・掲示時の注意点`;

  const imagePrompt = brief
    ? buildCreativeScenePrompt(brief)
    : buildCreativeScenePrompt({
        formatLabel: bp.usage || "POP",
        sceneConcept: bp.imagePromptHint || "original promotional scene",
        mood: bp.style || "professional",
        colorPalette: ["original fresh palette"],
        compositionStyle: "unique retail promotional layout",
        typographyStyle: "bold retail hierarchy",
        aspect: "1:1",
        targetAudience: "salon owner",
        appealAxis: bp.appealPoint,
        productPlacement: { position: "compositional overlay zone" },
      });

  return {
    systemPrompt,
    textPrompt,
    imagePrompt,
    negativePrompt: buildStandardNegativePrompt(),
    captionPrompt: null,
    _imageDirective: buildImageDirective(
      product,
      { layoutSpec: bp.layoutSpec, creativeBrief: brief },
      answers,
      brief
    ),
  };
}

export function renderPopPromoDeliverablePrompt(blueprint) {
  const p = buildPopPromoPrompts(blueprint);
  return [
    p.systemPrompt,
    p.textPrompt,
    p.imagePrompt ? `\n[クリエイティブシーン生成]\n${p.imagePrompt}` : "",
    p.negativePrompt ? `\n[negative]\n${p.negativePrompt}` : "",
  ].filter(Boolean).join("\n\n");
}
