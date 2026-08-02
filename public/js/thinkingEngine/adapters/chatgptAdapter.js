/**
 * ChatGPT Adapter
 *
 * GeneratedPrompt → ChatGPT 向け Handoff
 * 画像生成はユーザーの ChatGPT アカウントで実行（OpenAI Images API 不要）
 */

import { unwrapGeneratedPrompt } from "../core/types/generatedPrompt.js";

export const chatgptAdapter = {
  id: "chatgpt",
  label: "ChatGPTアプリ",
  supportedPromptFields: ["systemPrompt", "textPrompt", "captionPrompt", "imagePrompt"],

  buildRequest(generatedPrompt) {
    const payload = unwrapGeneratedPrompt(generatedPrompt);
    const { prompts, imageDirective } = payload;

    const messages = [];
    if (prompts.systemPrompt) {
      messages.push({ role: "system", content: prompts.systemPrompt });
    }

    const imageBlock = buildChatGptImageBlock(prompts, imageDirective);

    const userContent = [
      prompts.textPrompt,
      prompts.captionPrompt ? `\n\n---\n\n${prompts.captionPrompt}` : "",
      imageBlock,
    ].filter(Boolean).join("");

    messages.push({ role: "user", content: userContent });

    return { messages, format: "chatgpt", imageDirective };
  },

  getHandoff(request) {
    const text = request.messages
      .map((m) => (m.role === "system" ? `# システム\n${m.content}` : m.content))
      .join("\n\n---\n\n");

    return {
      type: "clipboard_app",
      adapterId: "chatgpt",
      label: "ChatGPTアプリで開く",
      text,
      openTarget: "chatgpt_app",
    };
  },
};

/**
 * ChatGPT 向け画像生成指示ブロック
 * 商品はAI生成禁止。背景・人物・光・レイアウト・装飾・コピーのみ。
 */
function buildChatGptImageBlock(prompts, imageDirective) {
  if (!prompts.imagePrompt && !imageDirective) return "";

  const lines = [
    "",
    "---",
    "",
    "# 画像生成指示（ChatGPT の画像生成機能を使用）",
    "",
    "【重要ルール】",
    "- 商品・機器・パッケージは AI で描かない（創作・改変禁止）",
    "- 生成するのは背景・人物・光・レイアウト・装飾・コピー（文字）のみ",
    "- 公式HPのデザイン・レイアウトは再現しない — 毎回オリジナルクリエイティブ",
    "- 商品画像用の余白を確保し、後から公式商品画像を配置できる構成にする",
  ];

  if (imageDirective?.creativeBrief) {
    const cb = imageDirective.creativeBrief;
    lines.push(
      "",
      `【今回のクリエイティブスタイル】${cb.creativeStyle || "オリジナル"}`,
      `【構図】${cb.compositionStyle}`,
      `【配色】${cb.colorPalette?.join(" / ") || "—"}`,
      `【商品配置予定位置】${cb.productPlacement?.position || "—"}`
    );
  }

  if (prompts.imagePrompt) {
    lines.push("", "【シーン生成プロンプト（英語）】", prompts.imagePrompt);
  }

  if (prompts.negativePrompt) {
    lines.push("", "【negative prompt】", prompts.negativePrompt);
  }

  if (imageDirective?.officialImageUrl) {
    lines.push(
      "",
      "【公式商品画像 — 合成用（AI生成禁止）】",
      `- 商品名: ${imageDirective.productName || "—"}`,
      `- 公式画像URL: ${imageDirective.officialImageUrl}`,
      "- 上記URLの商品画像をダウンロードし、生成した背景に加工せず配置する",
      "- 商品の形状・色・ロゴは1ピクセルも変更しない"
    );
  } else if (imageDirective?.productName) {
    lines.push(
      "",
      "【商品画像】",
      `- ${imageDirective.productName}: 公式画像URLなし — 商品をAIで描かない`,
      "- 背景・人物・装飾・コピーのみ生成"
    );
  }

  lines.push(
    "",
    "【手順】",
    "1. 上記プロンプトで背景・人物・光・レイアウト・装飾・コピーを生成",
    "2. 公式商品画像がある場合は、加工せず指定位置に配置",
    "3. キャプション文が未生成ならテキストも作成"
  );

  return lines.join("\n");
}
