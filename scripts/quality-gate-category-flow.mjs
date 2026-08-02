/**
 * 品質ゲート — 基本導線（カテゴリ選択 → ウィザード）
 *
 * 使い方:
 *   node scripts/quality-gate-category-flow.mjs [baseUrl]
 * 例:
 *   node scripts/quality-gate-category-flow.mjs http://localhost:3456
 *   node scripts/quality-gate-category-flow.mjs https://ai-builder-chi-three.vercel.app
 */
import { chromium } from "playwright";

const baseUrl = (process.argv[2] || "http://localhost:3456").replace(/\/$/, "");
const categories = ["sns", "newsletter", "proposal", "sales", "image"];

/** @type {Array<{url:string, status?:number, err?:string}>} */
const failedRequests = [];
/** @type {string[]} */
const pageErrors = [];
/** @type {string[]} */
const consoleErrors = [];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("requestfailed", (req) => {
    const url = req.url();
    if (url.includes(".js") || url.includes(".css")) {
      failedRequests.push({ url, err: req.failure()?.errorText });
    }
  });
  page.on("response", (res) => {
    const url = res.url();
    if (res.status() >= 400 && (url.includes(".js") || url.includes("index.html"))) {
      failedRequests.push({ url, status: res.status() });
    }
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__AIB_INIT__ === true, { timeout: 30000 });

  const initState = await page.evaluate(() => ({
    cardCount: document.querySelectorAll("[data-category-id]").length,
    initRan: window.__AIB_INIT__ === true,
  }));

  console.log("=== 品質ゲート: カテゴリ導線 ===");
  console.log("URL:", baseUrl);
  console.log("初期状態:", JSON.stringify(initState, null, 2));

  const failures = [];

  if (!initState.initRan) failures.push("app.js 初期化フラグ __AIB_INIT__ が立っていない");
  if (initState.cardCount < 5) failures.push(`カテゴリカード不足 (${initState.cardCount}件)`);

  for (const categoryId of categories) {
    if (!(await page.locator("#view-home.view--active").isVisible().catch(() => false))) {
      await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(() => window.__AIB_INIT__ === true, { timeout: 30000 });
    }

    const card = page.locator(`[data-category-id="${categoryId}"]`).first();
    if (!(await card.isVisible().catch(() => false))) {
      failures.push(`${categoryId}: カードが見えない`);
      continue;
    }

    await card.click({ timeout: 5000 });

    const ok = await page
      .waitForFunction(
        () => {
          const q = document.getElementById("view-questions");
          return q && !q.hidden && q.classList.contains("view--active");
        },
        { timeout: 8000 }
      )
      .then(() => true)
      .catch(() => false);

    const wizardState = await page.evaluate(() => ({
      category: document.getElementById("wizard-category")?.textContent?.trim() || "",
      question: document.getElementById("question-text")?.textContent?.trim() || "",
    }));

    if (!ok || !wizardState.question) {
      failures.push(`${categoryId}: ウィザード遷移失敗 (${JSON.stringify(wizardState)})`);
    } else {
      console.log(`OK: ${categoryId} → ${wizardState.category}`);
    }

    // 次のカテゴリテスト用にホームへ戻る（フルリロードより安定）
    const homeBtn = page.locator("#btn-top-home");
    if (await homeBtn.isVisible().catch(() => false)) {
      await homeBtn.click();
      await page.waitForFunction(
        () => document.getElementById("view-home")?.classList.contains("view--active"),
        { timeout: 5000 }
      ).catch(() => {});
    }
  }

  const js404 = failedRequests.filter((f) => f.url.endsWith(".js"));
  if (js404.length) {
    failures.push(`JS 404: ${js404.map((f) => f.url).join(", ")}`);
  }
  if (pageErrors.length) failures.push(`PageError: ${pageErrors.join(" | ")}`);

  if (failures.length) {
    console.error("\nFAIL:");
    failures.forEach((f) => console.error(" -", f));
    if (consoleErrors.length) {
      console.error("\nConsole errors:");
      consoleErrors.slice(0, 10).forEach((e) => console.error(" -", e));
    }
    await browser.close();
    process.exit(1);
  }

  console.log("\nPASS: カテゴリ導線 OK");
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
