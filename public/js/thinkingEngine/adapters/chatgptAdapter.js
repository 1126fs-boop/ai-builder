/**
 * ChatGPT Adapter
 *
 * GeneratedPrompt → ChatGPT 向けリクエスト / Handoff
 */

import { unwrapGeneratedPrompt } from "../core/types/generatedPrompt.js";

export const chatgptAdapter = {
  id: "chatgpt",
  label: "ChatGPT",
  supportedPromptFields: ["systemPrompt", "textPrompt", "captionPrompt"],

  buildRequest(generatedPrompt) {
    const payload = unwrapGeneratedPrompt(generatedPrompt);
    const { prompts } = payload;

    const messages = [];
    if (prompts.systemPrompt) {
      messages.push({ role: "system", content: prompts.systemPrompt });
    }

    const userContent = [
      prompts.textPrompt,
      prompts.captionPrompt ? `\n\n---\n\n${prompts.captionPrompt}` : "",
      prompts.imagePrompt
        ? `\n\n[参考: 背景画像は別途生成]\n${prompts.imagePrompt}`
        : "",
    ].filter(Boolean).join("");

    messages.push({ role: "user", content: userContent });

    return { messages, format: "chatgpt" };
  },

  getHandoff(request) {
    const text = request.messages
      .map((m) => (m.role === "system" ? `# システム\n${m.content}` : m.content))
      .join("\n\n---\n\n");

    return {
      type: "clipboard",
      adapterId: "chatgpt",
      label: "ChatGPT にコピー",
      text,
      // 将来: { type: "url", url: "https://chatgpt.com/..." }
    };
  },
};
