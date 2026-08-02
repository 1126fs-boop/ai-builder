/**
 * クリエイティブレイアウト設計（API合成用）
 */

export interface LayoutZone {
  x: number;
  y: number;
  w: number;
  h: number;
  align?: "left" | "right";
  position?: string;
}

export interface CreativeLayoutPlan {
  width: number;
  height: number;
  copySide: "left" | "right";
  copy: { badge: string; headline: string; subcopy: string; cta: string };
  zones: {
    badge: LayoutZone;
    headline: LayoutZone;
    subcopy: LayoutZone;
    cta: LayoutZone;
    product: LayoutZone;
  };
  typography: {
    headlineSize: number;
    subSize: number;
    labelSize: number;
    ctaSize: number;
  };
}

interface CreativeBriefLike {
  aspect?: string;
  formatLabel?: string;
  challengeHook?: string;
  appealAxis?: string;
  productPlacement?: { position?: string; widthRatio?: number; anchor?: string };
}

export function resolveCanvasSize(aspect = "1:1（1080×1080）") {
  if (aspect.includes("9:16") || aspect.includes("1080×1920")) {
    return { width: 1080, height: 1920 };
  }
  if (aspect.includes("16:9")) {
    return { width: 1920, height: 1080 };
  }
  return { width: 1080, height: 1080 };
}

export function extractCopyFromPrompts(opts: {
  textPrompt?: string;
  captionPrompt?: string;
  creativeBrief?: CreativeBriefLike;
  productName?: string;
}) {
  const { textPrompt = "", captionPrompt = "", creativeBrief = {}, productName = "" } = opts;
  const lines = textPrompt
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
    captionPrompt.match(/CTA[：:]\s*(.+)/i)?.[1]?.trim().slice(0, 18) ||
    lines.find((l) => /(詳しく|問い合わせ|資料|予約|DM|プロフィール)/.test(l))?.slice(0, 18) ||
    "詳しくはプロフィールへ";

  return {
    badge: creativeBrief.formatLabel || "WAM Creative",
    headline,
    subcopy,
    cta: ctaText,
  };
}

function resolveCopySide(productPosition = "center-right"): "left" | "right" {
  const pos = productPosition.toLowerCase();
  if (pos.includes("right")) return "left";
  if (pos.includes("left")) return "right";
  return "left";
}

export function composeCreativeLayout(
  creativeBrief: CreativeBriefLike = {},
  options: { textPrompt?: string; captionPrompt?: string; productName?: string } = {}
): CreativeLayoutPlan {
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
  const productX = copySide === "left" ? width - productW - pad : pad;
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
