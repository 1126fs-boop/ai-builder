/**
 * 画像生成 — オリジナル背景 + 公式商品画像合成（プレビュー用）
 *
 * OpenAI Images API は使用しない。背景はクリエイティブブリーフに基づく合成背景。
 * 本番の画像生成はユーザーの ChatGPT アカウントで実行。
 */

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

/** レイアウト仕様 */
interface LayoutSpec {
  aspect?: string;
  productZone?: { position?: string; widthRatio?: number; anchor?: string };
  colorPalette?: string[];
  compositionStyle?: string;
  doNotMimicOfficialWebsite?: boolean;
}

/** クリエイティブブリーフ */
interface CreativeBrief {
  aspect?: string;
  colorPalette?: string[];
  productPlacement?: { position?: string; widthRatio?: number; anchor?: string };
}

/** 画像生成リクエスト */
interface GenerateImageBody {
  imagePrompt?: string;
  negativePrompt?: string;
  imageDirective?: {
    officialImageUrl?: string;
    layoutSpec?: LayoutSpec;
    creativeBrief?: CreativeBrief;
    doNotMimicOfficialWebsite?: boolean;
  };
}

/** アスペクト比文字列 → ピクセルサイズ */
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

/** 配色名 → おおよその HEX（フォールバック背景用） */
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

/** フォールバック背景（OpenAI 未設定時 — クリエイティブブリーフの配色を使用） */
async function createCreativeFallbackBackground(
  width: number,
  height: number,
  layoutSpec?: LayoutSpec,
  creativeBrief?: CreativeBrief
) {
  const palette = creativeBrief?.colorPalette || layoutSpec?.colorPalette || [];
  const [c1, c2, c3] = paletteToColors(palette);
  const angle = (width + height) % 360;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
          <stop offset="0%" style="stop-color:${c1}"/>
          <stop offset="55%" style="stop-color:${c2}"/>
          <stop offset="100%" style="stop-color:${c3}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>
  `;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** 公式商品画像を取得 */
async function fetchOfficialProduct(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "AI-Builder/2.0 (WAM Official Product Composite)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`公式商品画像の取得に失敗しました (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/** 商品配置座標を計算（固定右配置を避ける） */
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
    return { left: padding, top: padding };
  }
  if (pos.includes("top-right") || pos.includes("top right")) {
    return { left: width - pw - padding, top: padding };
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

  // デフォルト: 右中央（後方互換）
  return { left: width - pw - padding, top: Math.round((height - ph) / 2) };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateImageBody;
    const { imageDirective } = body;

    const layoutSpec = imageDirective?.layoutSpec ?? {};
    const creativeBrief = imageDirective?.creativeBrief ?? undefined;
    const { width, height } = parseDimensions(layoutSpec, creativeBrief);

    // OpenAI Images API は使用せず、クリエイティブブリーフに基づく背景を生成
    const background = await createCreativeFallbackBackground(width, height, layoutSpec, creativeBrief);

    let composite = sharp(background).resize(width, height, { fit: "cover" });

    const officialUrl = imageDirective?.officialImageUrl;
    if (officialUrl) {
      const productBuf = await fetchOfficialProduct(officialUrl);
      const placement =
        creativeBrief?.productPlacement ||
        layoutSpec.productZone || { position: "center-right", widthRatio: 0.4 };
      const zoneWidth = Math.round(width * (placement.widthRatio ?? 0.4));
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

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
        "X-Image-Source": officialUrl ? "original-creative-with-official-product" : "original-creative-only",
        "X-Design-Mode": "original_creative",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "画像生成に失敗しました";
    console.error("[generate-image]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
