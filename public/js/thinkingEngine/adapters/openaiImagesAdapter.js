/**
 * OpenAI Images Adapter
 *
 * GeneratedPrompt → 画像生成 API リクエスト
 * 商品画像は公式画像を合成（AI創作禁止）
 */

import { unwrapGeneratedPrompt } from "../core/types/generatedPrompt.js";

export const openaiImagesAdapter = {
  id: "openai_images",
  label: "画像を生成",
  supportedPromptFields: ["imagePrompt", "negativePrompt"],

  buildRequest(generatedPrompt) {
    const payload = unwrapGeneratedPrompt(generatedPrompt);
    const { prompts, imageDirective } = payload;

    return {
      imagePrompt: prompts.imagePrompt || "",
      negativePrompt: prompts.negativePrompt || "",
      imageDirective: imageDirective ?? null,
      captionPrompt: prompts.captionPrompt || prompts.textPrompt || null,
      format: "openai_images",
    };
  },

  getHandoff(request) {
    return {
      type: "api",
      adapterId: "openai_images",
      label: "画像を生成",
      endpoint: "/api/creative/generate-image",
      method: "POST",
      body: {
        imagePrompt: request.imagePrompt,
        negativePrompt: request.negativePrompt,
        imageDirective: request.imageDirective,
      },
    };
  },

  /** 画像生成が可能か（imagePrompt + 公式画像URL または背景のみ） */
  canGenerate(generatedPrompt) {
    const payload = unwrapGeneratedPrompt(generatedPrompt);
    if (!payload.prompts?.imagePrompt) return false;
    const dir = payload.imageDirective;
    if (!dir) return true;
    if (dir.mode === "official" && dir.officialImageUrl) return true;
    if (dir.mode === "background_only") return true;
    return Boolean(dir.officialImageUrl);
  },
};
