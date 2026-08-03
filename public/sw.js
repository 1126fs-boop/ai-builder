/**
 * AI Builder — Service Worker (PWA)
 * 静的アセットをキャッシュし、オフライン閲覧をサポート
 */

const CACHE_NAME = "aibuilder-pwa-v36";

const PRECACHE = [
  "/",
  "/index.html",
  "/meeting.html",
  "/style.css",
  "/meeting.css",
  "/data/knowledge-trends.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/context.js",
  "/categories.js",
  "/questions.js",
  "/promptBuilder.js",
  "/qualityEngine.js",
  "/wamProducts.js",
  "/wamImageContext.js",
  "/js/app.js",
  "/js/pwa.js",
  "/js/state.js",
  "/js/ui.js",
  "/js/storage.js",
  "/js/learningBridge.js",
  "/js/asyncUtils.js",
  "/js/supabaseClient.js",
  "/js/authBar.js",
  "/js/templates.js",
  "/js/homeView.js",
  "/js/questionView.js",
  "/js/resultView.js",
  "/js/chatgptHandoff.js",
  "/js/imageGenerationService.js",
  "/js/meetingPromptView.js",
  "/js/ai/contentFramework.js",
  "/js/ai/promptEnhancer.js",
  "/js/ai/meetingRoundEngine.js",
  "/js/ai/performanceProfiler.js",
  "/js/ai/promptGenerationPipeline.js",
  "/js/ai/promptProvider.js",
  "/js/thinkingEngine/index.js",
  "/js/thinkingEngine/types.js",
  "/js/thinkingEngine/domainKnowledge.js",
  "/js/thinkingEngine/sectionBuilder.js",
  "/js/thinkingEngine/core/thinkingCore.js",
  "/js/thinkingEngine/providers/templateProvider.js",
  "/js/thinkingEngine/clients/registry.js",
  "/js/thinkingEngine/clients/meetingClient.js",
  "/js/thinkingEngine/clients/meetingRoleDebateEngine.js",
  "/js/thinkingEngine/clients/promptClient.js",
  "/js/thinkingEngine/clients/futureClient.js",
  "/js/thinkingEngine/schemas/index.js",
  "/js/thinkingEngine/schemas/types.js",
  "/js/thinkingEngine/schemas/proposalDoc.js",
  "/js/thinkingEngine/schemas/snsImage.js",
  "/js/thinkingEngine/schemas/newsletterLine.js",
  "/js/thinkingEngine/schemas/salesTalk.js",
  "/js/thinkingEngine/schemas/popPromo.js",
  "/js/thinkingEngine/blueprints/_shared.js",
  "/js/thinkingEngine/blueprints/_context.js",
  "/js/thinkingEngine/blueprints/proposalDoc.js",
  "/js/thinkingEngine/blueprints/snsImage.js",
  "/js/thinkingEngine/blueprints/newsletterLine.js",
  "/js/thinkingEngine/blueprints/salesTalk.js",
  "/js/thinkingEngine/blueprints/popPromo.js",
  "/js/thinkingEngine/deliverables/registry.js",
  "/js/thinkingEngine/rubrics/proposalQuality.js",
  "/js/thinkingEngine/renderers/proposalDeliverable.js",
  "/js/thinkingEngine/renderers/snsImageDeliverable.js",
  "/js/thinkingEngine/renderers/newsletterLineDeliverable.js",
  "/js/thinkingEngine/renderers/salesTalkDeliverable.js",
  "/js/thinkingEngine/renderers/popPromoDeliverable.js",
  "/js/thinkingEngine/core/pipeline/proposalPipeline.js",
  "/js/thinkingEngine/core/pipeline/deliverablePipeline.js",
  "/js/thinkingEngine/core/pipeline/analysisPipeline.js",
  "/js/thinkingEngine/core/analyzers/lensEngine.js",
  "/js/thinkingEngine/core/analyzers/lensRegistry.js",
  "/js/thinkingEngine/core/analyzers/lensCouncil.js",
  "/js/thinkingEngine/core/analyzers/lensDebateEngine.js",
  "/js/thinkingEngine/core/analyzers/lensPersonas.js",
  "/js/thinkingEngine/core/creative/creativeLayoutComposer.js",
  "/js/thinkingEngine/schemas/_sharedSchemaFields.js",
  "/js/thinkingEngine/core/analyzers/freeInputParser.js",
  "/js/thinkingEngine/core/quality/councilQualityGate.js",
  "/js/thinkingEngine/core/analyzers/structurePlanner.js",
  "/js/thinkingEngine/core/categoryConfig.js",
  "/js/thinkingEngine/core/types/generatedPrompt.js",
  "/js/thinkingEngine/promptBuilders/_shared.js",
  "/js/thinkingEngine/promptBuilders/proposalPromptBuilder.js",
  "/js/thinkingEngine/promptBuilders/snsPromptBuilder.js",
  "/js/thinkingEngine/promptBuilders/newsletterPromptBuilder.js",
  "/js/thinkingEngine/promptBuilders/salesTalkPromptBuilder.js",
  "/js/thinkingEngine/promptBuilders/popPromoPromptBuilder.js",
  "/js/thinkingEngine/adapters/registry.js",
  "/js/thinkingEngine/adapters/chatgptAdapter.js",
  "/js/thinkingEngine/adapters/openaiImagesAdapter.js",
  "/js/thinkingEngine/adapters/types.js",
  "/js/thinkingEngine/core/creative/creativeDesignEngine.js",
  "/js/thinkingEngine/core/knowledge/wamKnowledgeBase.js",
  "/js/thinkingEngine/core/quality/rubricFramework.js",
  "/js/thinkingEngine/core/quality/categoryRubricProfiles.js",
  "/js/thinkingEngine/core/quality/rubricLearningStore.js",
  "/js/thinkingEngine/core/quality/rubricLearningRegistry.js",
  "/js/thinkingEngine/core/analyzers/analysisIntelligence.js",
  "/js/thinkingEngine/core/quality/promptQuality.js",
  "/js/thinkingEngine/rubrics/snsQuality.js",
  "/js/thinkingEngine/rubrics/popQuality.js",
  "/js/thinkingEngine/rubrics/newsletterQuality.js",
  "/js/thinkingEngine/rubrics/salesQuality.js",
  "/js/thinkingEngine/core/analyzers/purposeAnalyzer.js",
  "/js/thinkingEngine/core/analyzers/challengeAnalyzer.js",
  "/js/thinkingEngine/core/analyzers/gapAnalyzer.js",
  "/js/thinkingEngine/core/analyzers/inputEnricher.js",
  "/js/thinkingEngine/core/quality/qualitySupplementEngine.js",
  "/js/thinkingEngine/core/quality/qualityStatusFormatter.js",
  "/js/thinkingEngine/core/quality/qualityGateEvaluator.js",
  "/js/thinkingEngine/core/quality/selfReviewEvaluator.js",
  "/js/thinkingEngine/core/analyzers/strategicIntentAnalyzer.js",
  "/js/thinkingEngine/core/knowledge/proInsightsRegistry.js",
  "/js/thinkingEngine/core/types/persistable.js",
  "/js/thinkingEngine/core/types/analysisContext.js",
  "/js/thinkingEngine/core/types/blueprint.js",
  "/js/thinkingEngine/core/types/deliverable.js",
  "/js/thinkingEngine/core/knowledge/knowledgeTypes.js",
  "/js/thinkingEngine/core/knowledge/knowledgeRegistry.js",
  "/js/thinkingEngine/blueprints/categoryEnhancers.js",
  "/js/thinkingEngine/core/knowledge/industryKnowledgeBase.js",
  "/js/thinkingEngine/core/knowledge/categoryKnowledgeRegistry.js",
  "/js/thinkingEngine/core/knowledge/trendsKnowledgeStore.js",
  "/js/thinkingEngine/core/knowledge/categories/snsKnowledge.js",
  "/js/thinkingEngine/core/knowledge/categories/newsletterKnowledge.js",
  "/js/thinkingEngine/core/knowledge/categories/proposalKnowledge.js",
  "/js/thinkingEngine/core/knowledge/categories/salesKnowledge.js",
  "/js/thinkingEngine/core/knowledge/categories/imageKnowledge.js",
  "/js/thinkingEngine/core/knowledge/categoryPlaybooks.js",
  "/js/thinkingEngine/core/knowledge/knowledgeApplicator.js",
  "/js/thinkingEngine/core/knowledge/learningStorage.js",
  "/js/thinkingEngine/core/knowledge/learningRegistry.js",
  "/js/meeting/meetingApp.js",
  "/js/meeting/roles.js",
  "/js/meeting/discussionEngine.js",
  "/js/meeting/meetingStorage.js",
  "/js/meeting/meetingUi.js",
  "/js/meeting/meetingBridge.js",
];

/** HTML / JS / CSS はネットワーク優先（古い index.html のキャッシュ混入を防ぐ） */
function isNetworkFirstAsset(url) {
  return (
    url.pathname === "/" ||
    url.pathname.endsWith(".html") ||
    /\.(?:js|css)$/.test(url.pathname)
  );
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (!url.origin.startsWith(self.location.origin)) return;

  if (isNetworkFirstAsset(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
