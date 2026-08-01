/**
 * 成果物 — レジストリ（Blueprint + Renderer）
 */

import { buildProposalBlueprint } from "../blueprints/proposalDoc.js";
import { buildSnsImageBlueprint } from "../blueprints/snsImage.js";
import { buildNewsletterLineBlueprint } from "../blueprints/newsletterLine.js";
import { buildSalesTalkBlueprint } from "../blueprints/salesTalk.js";
import { buildPopPromoBlueprint } from "../blueprints/popPromo.js";
import { renderProposalDeliverablePrompt } from "../renderers/proposalDeliverable.js";
import { renderSnsImageDeliverablePrompt } from "../renderers/snsImageDeliverable.js";
import { renderNewsletterLineDeliverablePrompt } from "../renderers/newsletterLineDeliverable.js";
import { renderSalesTalkDeliverablePrompt } from "../renderers/salesTalkDeliverable.js";
import { renderPopPromoDeliverablePrompt } from "../renderers/popPromoDeliverable.js";

export const DELIVERABLE_REGISTRY = {
  proposal_doc: {
    build: buildProposalBlueprint,
    render: renderProposalDeliverablePrompt,
  },
  sns_image: {
    build: buildSnsImageBlueprint,
    render: renderSnsImageDeliverablePrompt,
  },
  newsletter_line: {
    build: buildNewsletterLineBlueprint,
    render: renderNewsletterLineDeliverablePrompt,
  },
  sales_talk: {
    build: buildSalesTalkBlueprint,
    render: renderSalesTalkDeliverablePrompt,
  },
  pop_promo: {
    build: buildPopPromoBlueprint,
    render: renderPopPromoDeliverablePrompt,
  },
};

export function getDeliverableHandler(useCaseId) {
  const handler = DELIVERABLE_REGISTRY[useCaseId];
  if (!handler) throw new Error(`未登録の成果物 Blueprint: ${useCaseId}`);
  return handler;
}
