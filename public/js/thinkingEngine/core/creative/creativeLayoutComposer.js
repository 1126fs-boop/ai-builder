/**
 * クリエイティブレイアウト設計 — 完成広告に近いゾーン配置
 *
 * 背景 / ヘッド / サブ / CTA / 商品 を衝突なく配置する。
 */

/** アスペクト比 → ピクセル */
export function resolveCanvasSize(aspect = "1:1（1080×1080）") {
  if (aspect.includes("9:16") || aspect.includes("1080×1920")) {
    return { width: 1080, height: 1920 };
  }
  if (aspect.includes("16:9")) {
    return { width: 1920, height: 1080 };
  }
  return { width: 1080, height: 1080 };
}

/** textPrompt からコピー要素を抽出 */
export function extractCopyFromPrompts({ textPrompt = "", captionPrompt = "", creativeBrief = {}, productName = "" }) {
  const lines = (textPrompt || "")
    .split("\n")
    .map((l) => l.replace(/^[-・*■]\s*/, "").trim())
    .filter(Boolean);

  const headline =
    lines.find((l) => /【/.test(l) || l.length <= 20)?.slice(0, 28) ||
    creativeBrief.challengeHook?.slice(0, 28) ||
    creativeBrief.appealAxis?.slice(0, 28) ||
    productName?.slice(0, 20) ||
    "";

  const subcopy =
    lines.find((l) => l !== headline && l.length > 5)?.slice(0, 40) ||
    creativeBrief.appealAxis?.slice(0, 40) ||
    "";

  const ctaText =
    captionPrompt?.match(/CTA[：:]\s*(.+)/i)?.[1]?.trim().slice(0, 18) ||
    lines.find((l) => /(詳しく|問い合わせ|資料|予約|DM|プロフィール)/.test(l))?.slice(0, 18) ||
    "詳しくはプロフィールへ";

  return {
    badge: creativeBrief.formatLabel || "WAM Creative",
    headline,
    subcopy,
    cta: ctaText,
  };
}

/** 商品配置からコピー側を決定 */
function resolveCopySide(productPosition = "center-right") {
  const pos = productPosition.toLowerCase();
  if (pos.includes("right")) return "left";
  if (pos.includes("left")) return "right";
  return "left";
}

/**
 * 完成レイアウトプランを生成
 * @param {Object} creativeBrief
 * @param {Object} [options]
 */
export function composeCreativeLayout(creativeBrief = {}, options = {}) {
  const { width, height } = resolveCanvasSize(creativeBrief.aspect);
  const placement = creativeBrief.productPlacement || {
    position: "center-right",
    widthRatio: 0.48,
    anchor: "center",
  };
  const copySide = resolveCopySide(placement.position);
  const pad = Math.round(width * 0.06);
  const copyW = Math.round(width * 0.52);

  const copy = extractCopyFromPrompts({
    textPrompt: options.textPrompt,
    captionPrompt: options.captionPrompt,
    creativeBrief,
    productName: options.productName,
  });

  const productW = Math.round(width * (placement.widthRatio ?? 0.48));
  const productH = Math.round(height * 0.72);
  const productX =
    copySide === "left"
      ? width - productW - pad
      : pad;
  const productY = Math.round(height * 0.14);

  const copyX = copySide === "left" ? pad : width - copyW - pad;
  const headlineY = Math.round(height * 0.1);
  const subY = headlineY + Math.round(height * 0.12);
  const ctaW = Math.round(copyW * 0.85);
  const ctaH = Math.round(height * 0.065);
  const ctaY = height - ctaH - Math.round(height * 0.1);

  return {
    width,
    height,
    copySide,
    copy,
    zones: {
      badge: { x: copyX, y: headlineY, w: copyW, h: Math.round(height * 0.04), align: copySide },
      headline: { x: copyX, y: headlineY + Math.round(height * 0.05), w: copyW, h: Math.round(height * 0.1), align: copySide },
      subcopy: { x: copyX, y: subY, w: copyW, h: Math.round(height * 0.08), align: copySide },
      cta: { x: copyX, y: ctaY, w: ctaW, h: ctaH, align: copySide },
      product: { x: productX, y: productY, w: productW, h: productH, position: placement.position },
    },
    typography: {
      headlineSize: Math.max(32, Math.round(width * 0.048)),
      subSize: Math.max(18, Math.round(width * 0.024)),
      labelSize: Math.max(14, Math.round(width * 0.018)),
      ctaSize: Math.max(16, Math.round(width * 0.022)),
    },
  };
}
