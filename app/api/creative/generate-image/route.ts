/**
 * 画像生成 — オリジナル背景 + 公式商品画像合成
 *
 * GeneratedPrompt.imageDirective を Single Source of Truth として使用。
 * プレビューと ChatGPT Handoff / 将来 GPT Image API が同一構図を再現できるよう設計。
 *
 * 現状: 背景は imagePrompt + creativeBrief から決定論的 SVG（API キー不要）
 * 将来: imagePrompt で GPT Image API 背景生成 → 同一 composite パイプライン
 */

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

interface LayoutSpec {
  aspect?: string;
  productZone?: { position?: string; widthRatio?: number; anchor?: string };
  colorPalette?: string[];
  compositionStyle?: string;
}

interface CreativeBrief {
  aspect?: string;
  colorPalette?: string[];
  productPlacement?: { position?: string; widthRatio?: number; anchor?: string };
  compositionStyle?: string;
  typographyStyle?: string;
  appealAxis?: string;
  challengeHook?: string;
  variationSeed?: number;
  formatLabel?: string;
}

interface GenerateImageBody {
  imagePrompt?: string;
  negativePrompt?: string;
  textPrompt?: string;
  captionPrompt?: string;
  imageDirective?: {
    officialImageUrl?: string;
    layoutSpec?: LayoutSpec;
    creativeBrief?: CreativeBrief;
    layoutInstructions?: string;
    productName?: string;
    doNotMimicOfficialWebsite?: boolean;
  };
}

/** 文字列 → 決定論的 seed */
function hashSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function parseDimensions(layoutSpec?: LayoutSpec, creativeBrief?: CreativeBrief) {
  const aspect = creativeBrief?.aspect || layoutSpec?.aspect || "1:1（1080×1080）";
  if (aspect.includes("9:16") || aspect.includes("1080×1920")) {
    return { width: 1080, height: 1920 };
  }
  if (aspect.includes("16:9")) {
    return { width: 1920, height: 1080 };
  }
  return { width: 1080, height: 1080 };
}

function paletteToColors(palette: string[] = []) {
  const map: Record<string, string> = {
    "deep navy": "#1e3a5f",
    "gold accent": "#c9a227",
    "cream white": "#faf8f5",
    "soft rose": "#e8b4b8",
    "charcoal gray": "#36454f",
    "warm ivory": "#fffff0",
    "emerald green": "#2d6a4f",
    "matte black": "#1a1a1a",
    champagne: "#f7e7ce",
    "coral orange": "#ff7f50",
    "slate blue": "#6a5acd",
    "off-white": "#faf9f6",
    "lavender purple": "#b57edc",
    "silver gray": "#c0c0c0",
    "pearl white": "#f0ead6",
    terracotta: "#e2725b",
    "forest green": "#228b22",
    "sand beige": "#f5deb3",
    "midnight blue": "#191970",
    "copper bronze": "#b87333",
    "soft gray": "#d3d3d3",
  };
  const colors = palette.slice(0, 3).map((name) => map[name.toLowerCase()] || "#e8e4df");
  return colors.length >= 2 ? colors : ["#2c3e50", "#ecf0f1", "#bdc3c7"];
}

/** imagePrompt + brief から決定論的背景 SVG（プレビュー = レイアウト再現） */
function buildSceneBackgroundSvg(
  width: number,
  height: number,
  imagePrompt: string,
  layoutSpec?: LayoutSpec,
  creativeBrief?: CreativeBrief
) {
  const palette = creativeBrief?.colorPalette || layoutSpec?.colorPalette || [];
  const [c1, c2, c3] = paletteToColors(palette);
  const seed = creativeBrief?.variationSeed ?? hashSeed(imagePrompt || "default");
  const angle = seed % 360;
  const cx = (seed % 70) + 15;
  const cy = ((seed >> 4) % 60) + 20;
  const r = Math.round(Math.min(width, height) * (0.25 + (seed % 20) / 100));

  // 構図に応じた装飾（商品ゾーンとは反対側）
  const placement = (creativeBrief?.productPlacement?.position || "center-right").toLowerCase();
  const accentX = placement.includes("right") ? width * 0.12 : width * 0.78;
  const accentY = height * 0.18;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
          <stop offset="0%" style="stop-color:${c1}"/>
          <stop offset="55%" style="stop-color:${c2}"/>
          <stop offset="100%" style="stop-color:${c3}"/>
        </linearGradient>
        <radialGradient id="glow" cx="${cx}%" cy="${cy}%">
          <stop offset="0%" style="stop-color:${c3};stop-opacity:0.35"/>
          <stop offset="100%" style="stop-color:${c3};stop-opacity:0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <circle cx="${accentX}" cy="${accentY}" r="${r}" fill="${c2}" opacity="0.12"/>
      <circle cx="${width - accentX}" cy="${height - accentY}" r="${Math.round(r * 0.6)}" fill="${c1}" opacity="0.08"/>
    </svg>
  `;
}

/** 訴求軸・ヘッドライン・サブコピーの SVG テキストオーバーレイ */
function buildCopyOverlaySvg(
  width: number,
  height: number,
  creativeBrief?: CreativeBrief,
  productName?: string,
  textPrompt?: string
) {
  const headline =
    creativeBrief?.challengeHook?.slice(0, 28) ||
    creativeBrief?.appealAxis?.slice(0, 28) ||
    productName?.slice(0, 20) ||
    "";
  const subcopy =
    textPrompt?.split("\n").find((l) => l.trim().length > 0)?.slice(0, 36) ||
    creativeBrief?.appealAxis?.slice(0, 36) ||
    "";
  if (!headline && !subcopy) return null;

  const placement = (creativeBrief?.productPlacement?.position || "center-right").toLowerCase();
  const textX = Math.round(width * 0.06);
  const textY = Math.round(height * 0.1);
  const fontSize = Math.max(32, Math.round(width * 0.048));
  const subSize = Math.max(18, Math.round(width * 0.024));
  const labelSize = Math.max(14, Math.round(width * 0.018));
  const formatLabel = creativeBrief?.formatLabel || "WAM Creative";

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const headlineLine = headline ? `<text x="${textX}" y="${textY + fontSize + 12}" class="head" font-size="${fontSize}">${esc(headline)}</text>` : "";
  const subLine = subcopy
    ? `<text x="${textX}" y="${textY + fontSize + subSize + 28}" class="sub" font-size="${subSize}">${esc(subcopy)}</text>`
    : "";

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="textFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color:#000;stop-opacity:0.45"/>
          <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${Math.round(width * 0.65)}" height="${Math.round(height * 0.35)}" fill="url(#textFade)"/>
      <style>
        .head { font-family: 'Segoe UI', 'Hiragino Sans', 'Yu Gothic', sans-serif; font-weight: 700; fill: #ffffff; }
        .sub { font-family: 'Segoe UI', 'Hiragino Sans', 'Yu Gothic', sans-serif; font-weight: 500; fill: rgba(255,255,255,0.9); }
        .label { font-family: 'Segoe UI', 'Hiragino Sans', sans-serif; font-weight: 600; fill: rgba(255,255,255,0.75); letter-spacing: 0.08em; }
      </style>
      <text x="${textX}" y="${textY}" class="label" font-size="${labelSize}">${esc(formatLabel)}</text>
      ${headlineLine}
      ${subLine}
    </svg>
  `);
}

/** CTA ボタンオーバーレイ */
function buildCtaOverlaySvg(
  width: number,
  height: number,
  creativeBrief?: CreativeBrief,
  captionPrompt?: string
) {
  const ctaText =
    captionPrompt?.match(/CTA[：:]\s*(.+)/i)?.[1]?.slice(0, 16) ||
    captionPrompt?.split("\n").pop()?.slice(0, 16) ||
    "詳しくはプロフィールへ";
  const palette = paletteToColors(creativeBrief?.colorPalette || []);
  const accent = palette[1] || "#c9a227";
  const btnW = Math.round(width * 0.42);
  const btnH = Math.round(height * 0.065);
  const btnX = Math.round(width * 0.06);
  const btnY = height - btnH - Math.round(height * 0.08);
  const fontSize = Math.max(16, Math.round(width * 0.022));
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${btnX}" y="${btnY}" rx="${Math.round(btnH / 2)}" ry="${Math.round(btnH / 2)}"
        width="${btnW}" height="${btnH}" fill="${accent}" opacity="0.95"/>
      <text x="${btnX + btnW / 2}" y="${btnY + btnH / 2 + fontSize / 3}"
        text-anchor="middle" font-family="'Segoe UI','Hiragino Sans',sans-serif"
        font-size="${fontSize}" font-weight="700" fill="#ffffff">${esc(ctaText)}</text>
    </svg>
  `);
}

async function createSceneBackground(
  width: number,
  height: number,
  imagePrompt: string,
  layoutSpec?: LayoutSpec,
  creativeBrief?: CreativeBrief
) {
  const svg = buildSceneBackgroundSvg(width, height, imagePrompt, layoutSpec, creativeBrief);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function fetchOfficialProduct(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "AI-Builder/2.0 (WAM Official Product Composite)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`公式商品画像の取得に失敗しました (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

function calcProductPosition(
  position: string,
  width: number,
  height: number,
  pw: number,
  ph: number,
  padding: number
) {
  const pos = position.toLowerCase();

  if (pos.includes("bottom-center") || pos.includes("bottom center")) {
    return { left: Math.round((width - pw) / 2), top: height - ph - padding };
  }
  if (pos.includes("bottom-right") || pos.includes("bottom right")) {
    return { left: width - pw - padding, top: height - ph - padding };
  }
  if (pos.includes("bottom-left") || pos.includes("bottom left")) {
    return { left: padding, top: height - ph - padding };
  }
  if (pos.includes("top-left") || pos.includes("top left")) {
    return { left: padding, top: padding + Math.round(height * 0.08) };
  }
  if (pos.includes("top-right") || pos.includes("top right")) {
    return { left: width - pw - padding, top: padding + Math.round(height * 0.08) };
  }
  if (pos.includes("center-left") || pos.includes("center left")) {
    return { left: padding, top: Math.round((height - ph) / 2) };
  }
  if (pos.includes("center-right") || pos.includes("center right")) {
    return { left: width - pw - padding, top: Math.round((height - ph) / 2) };
  }
  if (pos.includes("floating") || pos.includes("center")) {
    return { left: Math.round((width - pw) / 2), top: Math.round((height - ph) / 2) };
  }

  return { left: width - pw - padding, top: Math.round((height - ph) / 2) };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateImageBody;
    const { imagePrompt = "", textPrompt = "", captionPrompt = "", imageDirective } = body;

    const layoutSpec = imageDirective?.layoutSpec ?? {};
    const creativeBrief = imageDirective?.creativeBrief ?? undefined;
    const { width, height } = parseDimensions(layoutSpec, creativeBrief);

    let composite = sharp(
      await createSceneBackground(width, height, imagePrompt, layoutSpec, creativeBrief)
    ).resize(width, height, { fit: "cover" });

    const copySvg = buildCopyOverlaySvg(
      width,
      height,
      creativeBrief,
      imageDirective?.productName,
      textPrompt
    );
    if (copySvg) {
      composite = composite.composite([{ input: copySvg, top: 0, left: 0 }]);
    }

    const ctaSvg = buildCtaOverlaySvg(width, height, creativeBrief, captionPrompt);
    if (ctaSvg) {
      composite = composite.composite([{ input: ctaSvg, top: 0, left: 0 }]);
    }

    const officialUrl = imageDirective?.officialImageUrl;
    if (officialUrl) {
      const productBuf = await fetchOfficialProduct(officialUrl);
      const placement =
        creativeBrief?.productPlacement ||
        layoutSpec.productZone || { position: "center-right", widthRatio: 0.4 };
      const zoneWidth = Math.round(width * (placement.widthRatio ?? 0.48));
      const zoneHeight = Math.round(height * 0.85);
      const padding = Math.round(width * 0.04);

      const resizedProduct = await sharp(productBuf)
        .resize(zoneWidth - padding * 2, zoneHeight, {
          fit: "inside",
          withoutEnlargement: false,
        })
        .png()
        .toBuffer();

      const meta = await sharp(resizedProduct).metadata();
      const pw = meta.width ?? zoneWidth;
      const ph = meta.height ?? zoneHeight;

      const { left, top } = calcProductPosition(
        placement.position || "center-right",
        width,
        height,
        pw,
        ph,
        padding
      );

      composite = composite.composite([
        {
          input: resizedProduct,
          left: Math.max(0, left),
          top: Math.max(0, top),
        },
      ]);
    }

    const output = await composite.png().toBuffer();
    const seed = creativeBrief?.variationSeed ?? hashSeed(imagePrompt);

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
        "X-Image-Source": officialUrl ? "scene-plus-official-product" : "scene-only",
        "X-Design-Mode": "original_creative",
        "X-Composite-Seed": String(seed),
        "X-Image-Prompt-Used": imagePrompt ? "1" : "0",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "画像生成に失敗しました";
    console.error("[generate-image]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
