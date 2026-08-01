/**
 * SNS — Prompt Builder
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

export function buildSnsImagePrompts(blueprint) {
  const bp = unwrapBlueprint(blueprint);
  const purpose = bp.purpose ?? {};
  const challenge = bp.challenge ?? {};
  const product = bp.productAsset ?? null;
  const answers = { wam_product: bp.product };

  const copyBlock = (bp.copyPatterns || []).map((c, i) => `${i + 1}. ${c}`).join("\n");
  const lensBlock = (bp.lensReviews || [])
    .map((l) => `- ${l.focus}: ${l.insight}`)
    .join("\n");

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB向けSNS販促のプロフェッショナル（コピー+クリエイティブ設計）",
    mission: purpose.primaryGoal || `${bp.targetAudience}向け${bp.snsFormat}`,
    constraints: [
      ...DEFAULT_CONSTRAINTS,
      "商品画像はAI生成禁止（公式画像を配置）",
      "背景・人物・装飾・文字・レイアウトのみAI生成可",
    ],
  });

  const productBlock = buildProductKnowledgeBlock(product, answers);

  const textPrompt = `# 依頼
${bp.snsFormat}用の投稿素材（キャプション+コピー）を作成してください。

${productBlock}

# thinkingCore 分析結果
${buildAnalysisReflectionBlock(bp)}

【訴求軸】${bp.appealAxis}
【ターゲット】${bp.targetAudience}
【経営課題】${challenge.surfaceChallenge ?? bp.impact}
【期待インパクト】${bp.impact}
【フォーマット】${bp.snsFormat} / ${bp.aspect}

# ビジュアルコンセプト
${bp.visualConcept}

# キャッチコピー案
${copyBlock}

# 多視点チェック
${lensBlock}

${formatSynthesisHints(bp.synthesis)}

# キャプション構成
${bp.captionStructure}

# ハッシュタグ
${bp.hashtags}

# 出力
1. キャッチコピー3案（日本語）
2. 投稿キャプション全文
3. CTA（1つ）`;

  const imagePrompt = buildBackgroundImagePrompt({
    style: "Instagram beauty salon promotional, luxury, B2B",
    aspect: bp.aspect?.includes("9:16") ? "9:16" : "1:1",
    emptyZone: "large empty space on right third for official product photo overlay",
  });

  const captionPrompt = textPrompt;

  return {
    systemPrompt,
    textPrompt,
    imagePrompt,
    negativePrompt: buildStandardNegativePrompt(),
    captionPrompt,
    _imageDirective: buildImageDirective(product, { layoutSpec: bp.layoutSpec }, answers),
  };
}

export function renderSnsImageDeliverablePrompt(blueprint) {
  const p = buildSnsImagePrompts(blueprint);
  return [
    p.systemPrompt,
    p.textPrompt,
    p.imagePrompt ? `\n[背景画像生成プロンプト]\n${p.imagePrompt}` : "",
    p.negativePrompt ? `\n[negative]\n${p.negativePrompt}` : "",
  ].filter(Boolean).join("\n\n");
}
