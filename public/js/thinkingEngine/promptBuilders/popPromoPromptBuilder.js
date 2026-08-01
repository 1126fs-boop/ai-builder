/**
 * POP・販促物 — Prompt Builder
 */

import { unwrapBlueprint } from "../core/types/blueprint.js";
import {
  buildSystemPrompt,
  buildProductKnowledgeBlock,
  buildBackgroundImagePrompt,
  buildStandardNegativePrompt,
  buildImageDirective,
  formatSynthesisHints,
  buildAnalysisReflectionBlock,
  DEFAULT_CONSTRAINTS,
} from "./_shared.js";

export function buildPopPromoPrompts(blueprint) {
  const bp = unwrapBlueprint(blueprint);
  const purpose = bp.purpose ?? {};
  const product = bp.productAsset ?? null;
  const answers = { wam_product: bp.product };

  const layoutBlock = (bp.layoutInstructions || []).map((l, i) => `${i + 1}. ${l}`).join("\n");
  const lensBlock = (bp.lensReviews || [])
    .map((l) => `- ${l.focus}: ${l.insight}`)
    .join("\n");

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB向け販促物（POP・店内掲示）のプロフェッショナル",
    mission: purpose.primaryGoal || `${bp.usage} for ${bp.displayLocation}`,
    constraints: [
      ...DEFAULT_CONSTRAINTS,
      "商品はAI生成禁止。公式画像を配置",
      "3秒で訴求が伝わる構成",
    ],
  });

  const productBlock = buildProductKnowledgeBlock(product, answers);

  const textPrompt = `# 依頼
${bp.usage}の制作指示書（文案+レイアウト）を作成してください。

${productBlock}

# thinkingCore 分析結果
${buildAnalysisReflectionBlock(bp)}

【訴求】${bp.appealPoint}
【掲示場所】${bp.displayLocation}
【サイズ】${bp.sizeFormat}
【トーン】${bp.style}
【経営課題】${bp.challenge?.surfaceChallenge ?? ""}

# ヘッドライン
${bp.headline}

# サブコピー
${bp.subCopy}

# レイアウト指示
${layoutBlock}

# 多視点チェック
${lensBlock}

${formatSynthesisHints(bp.synthesis)}

# 出力
1. ヘッドライン3案
2. サブコピー
3. レイアウト指示（デザイナー向け）
4. 印刷・掲示時の注意点`;

  const imagePrompt = buildBackgroundImagePrompt({
    style: `${bp.style} beauty salon promotional POP background`,
    aspect: bp.sizeFormat?.includes("9:16") ? "9:16" : "A4 portrait",
    emptyZone: "center-right empty zone for official product photo, no products in scene",
  });

  return {
    systemPrompt,
    textPrompt,
    imagePrompt,
    negativePrompt: buildStandardNegativePrompt(),
    captionPrompt: null,
    _imageDirective: buildImageDirective(product, { layoutSpec: bp.layoutSpec }, answers),
  };
}

export function renderPopPromoDeliverablePrompt(blueprint) {
  const p = buildPopPromoPrompts(blueprint);
  return [
    p.systemPrompt,
    p.textPrompt,
    p.imagePrompt ? `\n[背景画像生成]\n${p.imagePrompt}` : "",
    p.negativePrompt ? `\n[negative]\n${p.negativePrompt}` : "",
  ].filter(Boolean).join("\n\n");
}
