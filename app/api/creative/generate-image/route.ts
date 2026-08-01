/**
 * 画像生成 — 背景生成 + 公式商品画像合成
 *
 * 商品画像は AI で創作せず、公式 URL から取得して配置する。
 */

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

/** レイアウト仕様 */
interface LayoutSpec {
  aspect?: string;
  productZone?: { position?: string; widthRatio?: number };
}

/** 画像生成リクエスト */
interface GenerateImageBody {
  imagePrompt?: string;
  negativePrompt?: string;
  imageDirective?: {
    officialImageUrl?: string;
    layoutSpec?: LayoutSpec;
  };
}

/** アスペクト比文字列 → ピクセルサイズ */
function parseDimensions(layoutSpec?: LayoutSpec) {
  const aspect = layoutSpec?.aspect || "1:1（1080×1080）";
  if (aspect.includes("9:16") || aspect.includes("1080×1920")) {
    return { width: 1080, height: 1920 };
  }
  if (aspect.includes("16:9")) {
    return { width: 1920, height: 1080 };
  }
  return { width: 1080, height: 1080 };
}

/** 背景グラデーション（OpenAI 未設定時のフォールバック） */
async function createBackground(width: number, height: number) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8f4f0"/>
          <stop offset="50%" style="stop-color:#efe8e0"/>
          <stop offset="100%" style="stop-color:#e8ddd4"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="0" y="0" width="${Math.round(width * 0.55)}" height="100%" fill="rgba(255,255,255,0.35)"/>
    </svg>
  `;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** OpenAI DALL-E で背景のみ生成（API キーがある場合） */
async function tryOpenAiBackground(imagePrompt: string | undefined, width: number, height: number) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !imagePrompt?.trim()) return null;

  const size = width === height ? "1024x1024" : height > width ? "1024x1792" : "1792x1024";

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `${imagePrompt}. NO products, NO devices, NO machines, NO logos, NO text.`,
        n: 1,
        size,
        response_format: "b64_json",
      }),
    });

    if (!res.ok) {
      console.warn("[generate-image] OpenAI error:", await res.text());
      return null;
    }

    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return null;

    return Buffer.from(b64, "base64");
  } catch (err) {
    console.warn("[generate-image] OpenAI fetch failed:", err);
    return null;
  }
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateImageBody;
    const { imagePrompt, imageDirective } = body;

    const layoutSpec = imageDirective?.layoutSpec ?? {};
    const { width, height } = parseDimensions(layoutSpec);

    let background = await tryOpenAiBackground(imagePrompt, width, height);
    if (!background) {
      background = await createBackground(width, height);
    }

    let composite = sharp(background).resize(width, height, { fit: "cover" });

    const officialUrl = imageDirective?.officialImageUrl;
    if (officialUrl) {
      const productBuf = await fetchOfficialProduct(officialUrl);
      const productZone = layoutSpec.productZone ?? { position: "right", widthRatio: 0.45 };
      const zoneWidth = Math.round(width * (productZone.widthRatio ?? 0.45));
      const zoneHeight = Math.round(height * 0.85);
      const padding = Math.round(width * 0.03);

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

      const left =
        productZone.position === "left"
          ? padding
          : width - pw - padding;
      const top = Math.round((height - ph) / 2);

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
        "X-Image-Source": officialUrl ? "official-composite" : "background-only",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "画像生成に失敗しました";
    console.error("[generate-image]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
