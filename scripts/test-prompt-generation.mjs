/**
 * プロンプト生成フローの E2E 診断（headless）
 * 実行: node scripts/test-prompt-generation.mjs [baseUrl]
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://localhost:3002";
const target = `${baseUrl.replace(/\/$/, "")}/index.html`;

const logs = [];
const network = [];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
  });
  page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
  page.on("requestfailed", (req) => {
    network.push(`FAIL ${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });
  page.on("response", (res) => {
    const url = res.url();
    if (url.includes("generate-prompt") || url.includes("promptApiClient")) {
      network.push(`${res.request().method()} ${url} -> ${res.status()}`);
    }
  });

  console.log(`\n=== テスト開始: ${target} ===\n`);
  await page.goto(target, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("#all-categories-grid .category-card", { timeout: 15000 });

  // ホーム → 営業カテゴリ
  await page.locator("#all-categories-grid .category-card").filter({ hasText: "営業" }).first().click();

  const answerFlow = [
    /商談$/,
    /エステサロン/,
    /売上アップ/,
    /商談成功/,
    /BtoBソリューション営業のプロ/,
    /論理的/,
    /営業台本/,
  ];

  for (const pattern of answerFlow) {
    await page.locator(".option-btn").filter({ hasText: pattern }).first().click({ timeout: 10000 });
    await page.waitForTimeout(600);
  }

  // 任意入力はスキップして生成
  await page.locator("#btn-next").click({ timeout: 10000 });

  const overlay = page.locator("#generating-overlay");
  const start = Date.now();

  // 最大 15 秒待機して overlay が消えるか確認
  let overlayHidden = false;
  try {
    await page.waitForFunction(() => {
      const el = document.getElementById("generating-overlay");
      return el && el.hidden === true;
    }, { timeout: 15000 });
    overlayHidden = true;
  } catch {
    overlayHidden = false;
  }

  const elapsed = Date.now() - start;
  const overlayState = await overlay.evaluate((el) => ({
    hidden: el.hidden,
    display: getComputedStyle(el).display,
  }));
  const promptText = await page.locator("#prompt-output").textContent().catch(() => "");
  const resultViewHidden = await page.locator("#view-result").evaluate((el) => el.hidden);

  console.log("--- 結果 ---");
  console.log("生成時間(ms):", elapsed);
  console.log("overlay.hidden:", overlayState.hidden);
  console.log("overlay display:", overlayState.display);
  console.log("view-result hidden:", resultViewHidden);
  console.log("プロンプト文字数:", (promptText || "").trim().length);
  console.log("overlay 解除:", overlayHidden ? "OK" : "NG（タイムアウト）");

  const relevantLogs = logs.filter((l) =>
    /resultView|promptPipeline|promptProvider|generate-prompt|loading dismissed|showGeneratedResult|perf/.test(l)
  );
  console.log("\n--- 関連コンソールログ ---");
  if (relevantLogs.length) relevantLogs.forEach((l) => console.log(l));
  else console.log("(関連ログなし)");

  console.log("\n--- generate-prompt 関連ネットワーク ---");
  if (network.length) network.forEach((n) => console.log(n));
  else console.log("(呼び出しなし)");

  await browser.close();

  const ok = overlayHidden && (promptText || "").trim().length > 100;
  process.exit(ok ? 0 : 1);
}

run().catch((err) => {
  console.error("テスト失敗:", err);
  process.exit(1);
});
