/**
 * SVG アイコンから PWA 用 PNG（192 / 512）を生成する
 * 実行: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "icons", "icon.svg");
const svg = readFileSync(svgPath);

const sizes = [192, 512];

for (const size of sizes) {
  const out = join(root, "public", "icons", `icon-${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`Generated: public/icons/icon-${size}.png`);
}
