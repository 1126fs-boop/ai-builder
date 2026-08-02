/**
 * ChatGPT Adapter
 *
 * GeneratedPrompt → ChatGPT 向け Handoff
 * 画像生成はユーザーの ChatGPT アカウントで実行（OpenAI Images API 不要）
 *
 * 画像系（SNS / POP）: 「まず画像だけ生成」を最優先。キャプション等は完成後に追加依頼。
 */

import { unwrapGeneratedPrompt } from "../core/types/generatedPrompt.js";

const IMAGE_CREATIVE_USE_CASES = new Set(["sns_image", "pop_promo"]);

const IMAGE_FIRST_SYSTEM_NOTE = `

【Handoff — 画像優先モード】
- ユーザーの最初の依頼は「画像の完成」のみ。最初の回答で長文・キャプション・ハッシュタグを出力しない。
- 投稿文・キャプション・ハッシュタグは、画像完成後の別ターンで依頼される。`;

export const chatgptAdapter = {
  id: "chatgpt",
  label: "ChatGPTアプリ",
  supportedPromptFields: ["systemPrompt", "textPrompt", "captionPrompt", "imagePrompt"],

  buildRequest(generatedPrompt) {
    const payload = unwrapGeneratedPrompt(generatedPrompt);
    const { prompts, imageDirective } = payload;
    const useCaseId = generatedPrompt.useCaseId ?? payload.useCaseId ?? "";
    const imageFirst = IMAGE_CREATIVE_USE_CASES.has(useCaseId);

    const messages = [];
    if (prompts.systemPrompt) {
      const systemContent = imageFirst
        ? `${prompts.systemPrompt}${IMAGE_FIRST_SYSTEM_NOTE}`
        : prompts.systemPrompt;
      messages.push({ role: "system", content: systemContent });
    }

    const userContent = imageFirst
      ? buildImageFirstUserContent(prompts, imageDirective, useCaseId)
      : [
          prompts.textPrompt,
          prompts.captionPrompt ? `\n\n---\n\n${prompts.captionPrompt}` : "",
          buildChatGptImageBlock(prompts, imageDirective),
        ]
          .filter(Boolean)
          .join("");

    messages.push({ role: "user", content: userContent });

    return { messages, format: "chatgpt", imageDirective, imageFirst };
  },

  getHandoff(request) {
    const text = request.messages
      .map((m) => (m.role === "system" ? `# システム\n${m.content}` : m.content))
      .join("\n\n---\n\n");

    return {
      type: "clipboard_app",
      adapterId: "chatgpt",
      label: request.imageFirst ? "ChatGPTで画像を生成" : "ChatGPTアプリで開く",
      text,
      openTarget: "chatgpt_app",
    };
  },
};

/**
 * 画像優先 — ユーザー向け Handoff 本文
 */
function buildImageFirstUserContent(prompts, imageDirective, useCaseId) {
  const imageBlock = buildChatGptImageBlock(prompts, imageDirective, { imageFirst: true });
  const reference = buildCreativeReferenceBlock(prompts.textPrompt, useCaseId);
  const followUpExamples =
    useCaseId === "sns_image"
      ? `- 「この画像用のInstagramキャプションを書いて」
- 「ハッシュタグ案を10個出して」
- 「画像内コピーの言い換え案を3つ」`
      : `- 「このPOP用のヘッドライン言い換え案を3つ」
- 「掲示場所向けの注意書きを追加して」
- 「サブコピーの短縮版を作って」`;

  return `# 【最優先】まず画像だけを生成してください

この依頼は**画像生成カテゴリ**です。**最初の回答では画像の完成のみ**をお願いします。

- 今すぐ作るもの: **販促クリエイティブ画像**（背景・レイアウト・画像内コピー・公式商品配置）
- 今は不要: 投稿キャプション、ハッシュタグ、長文の説明文、Markdownレポート

画像ができたあと、必要なら別メッセージで文章を依頼できます。

${imageBlock}

---

# クリエイティブの参考情報（画像生成時に参照 — テキスト出力は不要）

以下は画像を作るための背景情報です。この段階では**テキスト成果物を出力しないでください**。

${reference || "（分析結果は上記画像指示に反映済み）"}

---

# 画像完成後に追加依頼できること（今は不要）

${followUpExamples}`;
}

/** キャプション・出力指示など、画像後に依頼する部分を除外 */
function buildCreativeReferenceBlock(textPrompt, useCaseId) {
  if (!textPrompt?.trim()) return "";

  let text = textPrompt;
  const stripPatterns = [
    /\n#\s*出力[\s\S]*/i,
    /\n#\s*キャプション構成[\s\S]*/i,
    /\n#\s*ハッシュタグ[\s\S]*/i,
  ];
  for (const pattern of stripPatterns) {
    text = text.replace(pattern, "");
  }

  if (useCaseId === "sns_image") {
    text = text.replace(/\n# 依頼[\s\S]*?公式HPのデザインを再現[^\n]*\n/i, "\n");
  }

  return text.trim();
}

/**
 * ChatGPT 向け画像生成指示ブロック
 * 商品はAI生成禁止。背景・人物・光・レイアウト・装飾・コピーのみ。
 */
function buildChatGptImageBlock(prompts, imageDirective, options = {}) {
  const { imageFirst = false } = options;
  if (!prompts.imagePrompt && !imageDirective) return "";

  const lines = [
    "",
    "---",
    "",
    "# 画像生成指示（ChatGPT の画像生成機能を使用）",
    "",
  ];

  if (imageFirst) {
    lines.push(
      "【このターンで実行すること】",
      "- 下記に従い、**画像のみ**を生成して提示する",
      "- キャプション・投稿文・ハッシュタグは出力しない（画像完成後に別依頼）",
      ""
    );
  }

  lines.push(
    "【重要 — 商品画像ルール】",
    "- 公式HP = 正規の商品画像取得元（デザインのコピー元ではない）",
    "- 商品・機器・パッケージは AI で描かない（創作・改変・色変更禁止）",
    "- AI生成するのは: 背景・人物・光・レイアウト・装飾・コピー（文字）のみ",
    "- 公式HPのデザイン・レイアウトは再現しない — 毎回オリジナルクリエイティブ",
    "- Instagram/広告代理店風の多様な構図・世界観を毎回新規設計",
    "- 商品画像用の余白を確保し、後から公式商品画像を加工せず配置"
  );

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
      "- リサイズのみ可。色変更・影追加・ロゴ改変は禁止"
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
    "【手順 — 画像のみ】",
    "1. 上記プロンプトで背景・人物・光・レイアウト・装飾・画像内コピーを生成（商品実物は描かない）",
    "2. 公式商品画像URLがある場合はダウンロードし、指定位置に加工せず合成",
    "3. 代理店品質のオリジナルクリエイティブとして仕上げ、**完成画像を提示**",
    "4. 投稿キャプション・ハッシュタグ・長文説明は**このターンでは出力しない**（画像完成後に別途依頼）"
  );

  return lines.join("\n");
}

export function isImageCreativeHandoff(useCaseId) {
  return IMAGE_CREATIVE_USE_CASES.has(useCaseId);
}
