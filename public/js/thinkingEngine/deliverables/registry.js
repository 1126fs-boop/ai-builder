/**
 * 成果物レジストリ — Blueprint Builder + Prompt Builder
 *
 * アプリの責務: GeneratedPrompt まで。
 * 外部AI接続は adapters/ 経由。
 */

import { buildProposalBlueprint } from "../blueprints/proposalDoc.js";
import { buildSnsImageBlueprint } from "../blueprints/snsImage.js";
import { buildNewsletterLineBlueprint } from "../blueprints/newsletterLine.js";
import { buildSalesTalkBlueprint } from "../blueprints/salesTalk.js";
import { buildPopPromoBlueprint } from "../blueprints/popPromo.js";

import { buildProposalPrompts, renderProposalDeliverablePrompt } from "../promptBuilders/proposalPromptBuilder.js";
import { buildSnsImagePrompts, renderSnsImageDeliverablePrompt } from "../promptBuilders/snsPromptBuilder.js";
import { buildNewsletterPrompts, renderNewsletterLineDeliverablePrompt } from "../promptBuilders/newsletterPromptBuilder.js";
import { buildSalesTalkPrompts, renderSalesTalkDeliverablePrompt } from "../promptBuilders/salesTalkPromptBuilder.js";
import { buildPopPromoPrompts, renderPopPromoDeliverablePrompt } from "../promptBuilders/popPromoPromptBuilder.js";

export const DELIVERABLE_REGISTRY = {
  proposal_doc: {
    buildBlueprint: buildProposalBlueprint,
    buildPrompts: buildProposalPrompts,
    render: renderProposalDeliverablePrompt,
  },
  sns_image: {
    buildBlueprint: buildSnsImageBlueprint,
    buildPrompts: buildSnsImagePrompts,
    render: renderSnsImageDeliverablePrompt,
  },
  newsletter_line: {
    buildBlueprint: buildNewsletterLineBlueprint,
    buildPrompts: buildNewsletterPrompts,
    render: renderNewsletterLineDeliverablePrompt,
  },
  sales_talk: {
    buildBlueprint: buildSalesTalkBlueprint,
    buildPrompts: buildSalesTalkPrompts,
    render: renderSalesTalkDeliverablePrompt,
  },
  pop_promo: {
    buildBlueprint: buildPopPromoBlueprint,
    buildPrompts: buildPopPromoPrompts,
    render: renderPopPromoDeliverablePrompt,
  },
};

export function getDeliverableHandler(useCaseId) {
  const handler = DELIVERABLE_REGISTRY[useCaseId];
  if (!handler) throw new Error(`未登録の成果物 Blueprint: ${useCaseId}`);

  return {
    build: handler.buildBlueprint,
    buildPrompts: handler.buildPrompts,
    render: handler.render,
  };
}
