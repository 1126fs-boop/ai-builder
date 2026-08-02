/**
 * GeneratedPrompt 品質ルーブリック（全カテゴリ共通 + 画像系追加）
 */

/**
 * @param {string} categoryId
 * @param {Object} promptBundle buildPrompts の戻り値
 */
export function evaluateGeneratedPrompt(categoryId, promptBundle) {
  const isImage = categoryId === "sns" || categoryId === "image";
  const checks = [
    {
      id: "system",
      label: "systemPrompt がある",
      pass: Boolean(promptBundle.systemPrompt?.trim()),
      hint: "systemPrompt に役割・制約を明記する",
    },
    {
      id: "text",
      label: "textPrompt または captionPrompt がある",
      pass: Boolean(promptBundle.textPrompt?.trim() || promptBundle.captionPrompt?.trim()),
      hint: "依頼内容を具体的に記述する",
    },
    {
      id: "constraints",
      label: "WAM制約が含まれる",
      pass: (promptBundle.systemPrompt || "").includes("経営") ||
        (promptBundle.textPrompt || "").includes("経営"),
      hint: "経営課題解決の制約をプロンプトに含める",
    },
  ];

  if (isImage) {
    checks.push(
      {
        id: "image_prompt",
        label: "オリジナルシーン用 imagePrompt がある",
        pass: Boolean(promptBundle.imagePrompt?.trim()),
        hint: "HP再現禁止のオリジナルシーン生成プロンプトを追加",
      },
      {
        id: "negative",
        label: "negativePrompt がある",
        pass: Boolean(promptBundle.negativePrompt?.trim()),
        hint: "商品創作・HP再現禁止の negativePrompt を追加",
      },
      {
        id: "no_hp_mimic",
        label: "HP再現禁止の指示",
        pass:
          (promptBundle.textPrompt || "").includes("HP") ||
          (promptBundle.textPrompt || "").includes("公式HP") ||
          (promptBundle.systemPrompt || "").includes("再現禁止") ||
          (promptBundle.imagePrompt || "").includes("NOT a website"),
        hint: "公式HPデザイン再現禁止を明記",
      },
      {
        id: "no_product_gen",
        label: "商品AI生成禁止の指示",
        pass:
          (promptBundle.textPrompt || "").includes("AI生成禁止") ||
          (promptBundle.systemPrompt || "").includes("AI生成禁止") ||
          (promptBundle.textPrompt || "").includes("公式画像"),
        hint: "商品画像は公式画像配置のみと明記",
      }
    );
  }

  if (categoryId === "proposal") {
    checks.push({
      id: "structure",
      label: "提案書の構成指示",
      pass: (promptBundle.textPrompt || "").includes("提案") ||
        (promptBundle.textPrompt || "").includes("ROI"),
      hint: "提案書の章立て・ROI・CTA を指示",
    });
  }

  const passed = checks.filter((c) => c.pass).length;
  const score = checks.length ? Math.round((passed / checks.length) * 100) / 100 : 1;

  return { score, checks, passed, total: checks.length };
}
