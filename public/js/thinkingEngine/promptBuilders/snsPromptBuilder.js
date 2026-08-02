/**
 * SNS — Prompt Builder
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
  DEFAULT_CONSTRAINTS,
} from "./_shared.js";

export function buildSnsImagePrompts(blueprint) {
  const bp = unwrapBlueprint(blueprint);
  const purpose = bp.purpose ?? {};
  const challenge = bp.challenge ?? {};
  const product = bp.productAsset ?? null;
  const answers = { wam_product: bp.product };
  const brief = bp.creativeBrief ?? null;

  const copyBlock = (bp.copyPatterns || []).map((c, i) => `${i + 1}. ${c}`).join("\n");
  const lensBlock = (bp.lensReviews || [])
    .map((l) => `- ${l.focus}: ${l.insight}`)
    .join("\n");

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB向けSNS販促のプロフェッショナル（オリジナルクリエイティブ設計）",
    mission: purpose.primaryGoal || `${bp.targetAudience}向け${bp.snsFormat}の新規販促クリエイティブ`,
    includeCreativeRules: true,
    constraints: [
      ...DEFAULT_CONSTRAINTS,
      "公式HPはKnowledge Baseのみ（商品情報・画像・ブランドルール）",
      "公式HPのレイアウト・配色・タイポは再現禁止",
      "商品画像のみ公式画像を配置（AI生成・改変禁止）",
      "背景・人物・レイアウト・配色・装飾・タイポは毎回ゼロから新規設計",
    ],
  });

  const productBlock = buildProductKnowledgeBlock(product, answers);
  const creativeBlock = brief ? buildCreativeDesignPrinciplesBlock(brief) : "";

  const textPrompt = `# 依頼
${bp.snsFormat}用の【オリジナル販促クリエイティブ】（キャプション+コピー+デザイン指示）を作成してください。
公式HPのデザインを再現するのではなく、公式素材を使った新しいクリエイティブを設計してください。

${productBlock}

${creativeBlock}

# thinkingCore 分析結果
${buildAnalysisReflectionBlock(bp)}

【訴求軸】${bp.appealAxis}
【ターゲット】${bp.targetAudience}
【経営課題】${challenge.surfaceChallenge ?? bp.impact}
【期待インパクト】${bp.impact}
【フォーマット】${bp.snsFormat} / ${bp.aspect}

# オリジナルビジュアルコンセプト
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
1. オリジナルクリエイティブのデザイン指示（配色・構図・タイポ・装飾 — HP再現禁止）
2. キャッチコピー3案（日本語）
3. 投稿キャプション全文
4. CTA（1つ）`;

  const imagePrompt = brief
    ? buildCreativeScenePrompt(brief)
    : buildCreativeScenePrompt({
        formatLabel: bp.snsFormat,
        sceneConcept: "original beauty B2B promotional scene",
        mood: "professional",
        colorPalette: ["fresh original palette"],
        compositionStyle: "unique asymmetric layout",
        typographyStyle: "modern promotional hierarchy",
        aspect: bp.aspect?.includes("9:16") ? "9:16" : "1:1",
        targetAudience: bp.targetAudience,
        appealAxis: bp.appealAxis,
        productPlacement: { position: "compositional overlay zone" },
      });

  const captionPrompt = textPrompt;

  return {
    systemPrompt,
    textPrompt,
    imagePrompt,
    negativePrompt: buildStandardNegativePrompt(),
    captionPrompt,
    _imageDirective: buildImageDirective(
      product,
      { layoutSpec: bp.layoutSpec, creativeBrief: brief },
      answers,
      brief
    ),
  };
}

export function renderSnsImageDeliverablePrompt(blueprint) {
  const p = buildSnsImagePrompts(blueprint);
  return [
    p.systemPrompt,
    p.textPrompt,
    p.imagePrompt ? `\n[クリエイティブシーン生成プロンプト]\n${p.imagePrompt}` : "",
    p.negativePrompt ? `\n[negative]\n${p.negativePrompt}` : "",
  ].filter(Boolean).join("\n\n");
}
