/**
 * 営業トーク — Prompt Builder
 */

import { unwrapBlueprint } from "../core/types/blueprint.js";
import { buildSystemPrompt, formatSynthesisHints, DEFAULT_CONSTRAINTS } from "./_shared.js";

export function buildSalesTalkPrompts(blueprint) {
  const bp = unwrapBlueprint(blueprint);
  const purpose = bp.purpose ?? {};

  const hearingBlock = (bp.hearingQuestions || []).map((q, i) => `${i + 1}. ${q}`).join("\n");
  const objectionBlock = (bp.objectionResponses || [])
    .map((o) => `Q: ${o.q}\nA: ${o.a}`)
    .join("\n\n");
  const lensBlock = (bp.lensReviews || [])
    .map((l) => `- ${l.focus}: ${l.insight}`)
    .join("\n");

  const systemPrompt = buildSystemPrompt({
    role: "美容業界BtoB営業のプロフェッショナル（商談・テレアポ・DM対応）",
    mission: purpose.primaryGoal || `${bp.salesType}で${bp.goal}`,
    constraints: [...DEFAULT_CONSTRAINTS, "商品説明から入らない", "共感→ヒアリング→提案→CTA"],
  });

  const textPrompt = `# 依頼
${bp.salesType}用の営業トーク台本を作成してください。

【業種】${bp.industry}
【課題（表面）】${bp.surfaceChallenge}
【根本原因】${bp.rootCause}
【業種特性】${bp.industryContext}
【ゴール】${bp.goal}

# 提案ストーリー
${bp.proposalStory}

# 冒頭（共感）
${bp.opening}

# ヒアリング3問
${hearingBlock}

# 反論処理
${objectionBlock}

# クロージング
${bp.closing}

${bp.clientContext ? `# 取引先状況\n${bp.clientContext}\n` : ""}
# 多視点チェック
${lensBlock}

${formatSynthesisHints(bp.synthesis)}

# 出力
そのまま営業現場で使える台本形式（セリフ＋トークポイント）で。`;

  return {
    systemPrompt,
    textPrompt,
    imagePrompt: null,
    negativePrompt: null,
    captionPrompt: null,
  };
}

export function renderSalesTalkDeliverablePrompt(blueprint) {
  const p = buildSalesTalkPrompts(blueprint);
  return `${p.systemPrompt}\n\n${p.textPrompt}`;
}
