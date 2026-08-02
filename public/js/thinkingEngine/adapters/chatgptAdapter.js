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
    "【重要 — 商品画像ルール】",
    "- 公式HP = 正規の商品画像取得元（デザインのコピー元ではない）",
    "- 商品・機器・パッケージは AI で描かない（創作・改変・色変更禁止）",
    "- AI生成するのは: 背景・人物・光・レイアウト・装飾・コピー（文字）のみ",
    "- 公式HPのデザイン・レイアウトは再現しない — 毎回オリジナルクリエイティブ",
    "- Instagram/広告代理店風の多様な構図・世界観を毎回新規設計",
    "- 商品画像用の余白を確保し、後から公式商品画像を加工せず配置",
  ];

  if (imageDirective?.layoutInstructions) {
    lines.push("", "【レイアウト指示 — 厳守】", imageDirective.layoutInstructions);
  }

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
      "- 上記URLの商品画像をダウンロードし、生成した背景に1ピクセルも変更せず配置",
      "- リサイズのみ可。色変更・影追加・ロゴ改変は禁止",
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
    "【再現性 — 同じ構図で生成するため】",
    "- 上記 layoutInstructions / variationSeed / 商品配置位置を変更しない",
    "- 背景のみ再生成する場合も商品配置ゾーンは同じ位置を空ける",
    "- 公式商品画像URLの画像を1ピクセルも変更せず合成",
    "",
    "【手順】",
    "1. 上記プロンプトで背景・人物・光・レイアウト・装飾・コピーのみ生成（商品は描かない）",
    "2. 公式商品画像URLからダウンロードし、指定位置に加工せず合成",
    "3. HPの見た目ではなく、代理店品質のオリジナルクリエイティブに仕上げる",
    "4. キャプション文が未生成ならテキストも作成"
  );

  return lines.join("\n");
}
