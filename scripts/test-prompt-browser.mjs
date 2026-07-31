/**
 * ブラウザ上で promptGenerationPipeline を直接実行する診断
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://localhost:3333";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));

  await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded" });

  const result = await page.evaluate(async () => {
    const answers = {
      sales_type: "商談",
      industry: "エステサロン",
      client_challenge: "売上アップ",
      goal: "商談成功",
      ai_role: "BtoBソリューション営業のプロ",
      tone: "論理的",
      output_format: "営業台本",
    };

    const overlay = document.getElementById("generating-overlay");
    overlay.hidden = false;

    const t0 = performance.now();
    try {
      const { generateWizardPrompt } = await import("/js/ai/promptGenerationPipeline.js");
      const { yieldToMain } = await import("/js/ai/performanceProfiler.js");
      await yieldToMain();
      const gen = await generateWizardPrompt("sales", answers, {
        onStep: (s) => console.log("[step]", s),
      });
      overlay.hidden = true;
      return {
        ok: true,
        ms: Math.round(performance.now() - t0),
        promptLen: gen.prompt.length,
        source: gen.metrics.source,
        overlayHidden: overlay.hidden,
        overlayDisplay: getComputedStyle(overlay).display,
      };
    } catch (err) {
      overlay.hidden = true;
      return {
        ok: false,
        ms: Math.round(performance.now() - t0),
        error: err?.message || String(err),
        overlayHidden: overlay.hidden,
        overlayDisplay: getComputedStyle(overlay).display,
      };
    }
  });

  console.log("=== ブラウザ直接生成テスト ===");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n--- ログ ---");
  logs.forEach((l) => console.log(l));

  await browser.close();
  process.exit(result.ok ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
