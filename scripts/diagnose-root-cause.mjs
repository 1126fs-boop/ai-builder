/**
 * 旧 CSS + 旧 API クライアント挙動の再現テスト
 */
import { chromium } from "playwright";

const PROD = "https://ai-builder-chi-three.vercel.app";

async function testOldCssOverlay() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 修正前 CSS（display:flex が hidden を上書き）
  await page.setContent(`
    <div id="generating-overlay" class="generating" hidden>loading</div>
    <style>
      .generating {
        position: fixed; inset: 0; background: rgba(255,255,255,0.92);
        display: flex; z-index: 100;
      }
    </style>
  `);

  const oldCss = await page.evaluate(() => {
    const el = document.getElementById("generating-overlay");
    el.hidden = false;
    const shown = getComputedStyle(el).display;
    el.hidden = true;
    const hidden = getComputedStyle(el).display;
    return { shown, hidden, visuallyStuck: hidden !== "none" };
  });

  await browser.close();
  return oldCss;
}

async function testPost405Behavior() {
  const t0 = Date.now();
  const res = await fetch(`${PROD}/api/generate-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "wizard", categoryId: "sales", answers: {} }),
  });
  const ms = Date.now() - t0;
  const text = await res.text();
  return {
    status: res.status,
    ms,
    isTimeout: ms > 30000,
    bodyPreview: text.slice(0, 80),
    pendingWouldBe: false,
  };
}

async function testGetBehavior() {
  const t0 = Date.now();
  const res = await fetch(`${PROD}/api/generate-prompt`, { method: "GET" });
  const ms = Date.now() - t0;
  const text = await res.text();
  return {
    status: res.status,
    ms,
    isHtml: text.includes("<!DOCTYPE") || text.includes("<html"),
    len: text.length,
  };
}

console.log("=== 原因切り分け ===\n");

console.log("1. POST /api/generate-prompt");
console.log(JSON.stringify(await testPost405Behavior(), null, 2));

console.log("\n2. GET /api/generate-prompt");
console.log(JSON.stringify(await testGetBehavior(), null, 2));

console.log("\n3. 旧 CSS で hidden=true 後の display");
console.log(JSON.stringify(await testOldCssOverlay(), null, 2));

console.log("\n4. 新 CSS（本番）で hidden=true 後の display");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(`<div id="o" class="generating" hidden></div><link rel="stylesheet" href="${PROD}/style.css">`);
await page.waitForTimeout(500);
const neu = await page.evaluate(() => {
  const el = document.getElementById("o");
  el.hidden = false;
  const shown = getComputedStyle(el).display;
  el.hidden = true;
  return { shown, hidden: getComputedStyle(el).display };
});
await browser.close();
console.log(JSON.stringify(neu, null, 2));
