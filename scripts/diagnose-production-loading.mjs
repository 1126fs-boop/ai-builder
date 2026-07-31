/**
 * 本番 E2E 診断: Network / loading / API 呼び出しを記録
 */
import { chromium } from "playwright";

const PROD = process.argv[2] || "https://ai-builder-chi-three.vercel.app";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  /** @type {Array<{method:string,url:string,status?:number,pending:boolean,durationMs?:number,failed?:string}>} */
  const networkLog = [];
  /** @type {string[]} */
  const consoleLog = [];
  const pending = new Map();

  page.on("console", (msg) => consoleLog.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => consoleLog.push(`[pageerror] ${err.message}`));

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("generate-prompt") || url.includes("promptApiClient")) {
      pending.set(req, { method: req.method(), url, start: Date.now(), pending: true });
    }
  });

  page.on("requestfinished", async (req) => {
    const url = req.url();
    if (!url.includes("generate-prompt") && !url.includes("promptApiClient")) return;
    const entry = pending.get(req) || { method: req.method(), url, start: Date.now() };
    let status;
    try {
      status = (await req.response())?.status();
    } catch {
      status = undefined;
    }
    networkLog.push({
      method: entry.method,
      url,
      status,
      pending: false,
      durationMs: Date.now() - entry.start,
    });
    pending.delete(req);
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    if (!url.includes("generate-prompt") && !url.includes("promptApiClient")) return;
    networkLog.push({
      method: req.method(),
      url,
      pending: false,
      failed: req.failure()?.errorText || "failed",
      durationMs: Date.now() - (pending.get(req)?.start || Date.now()),
    });
    pending.delete(req);
  });

  console.log(`\n=== 本番 E2E 診断: ${PROD} ===\n`);

  // 1) 本番 index.html（認証リダイレクトの有無）
  const nav = await page.goto(`${PROD}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("1. ページ遷移");
  console.log(`   最終URL: ${page.url()}`);
  console.log(`   HTTP: ${nav?.status()}`);

  // 2) 本番 CSS/JS の loading 修正が配信されているか
  const assetCheck = await page.evaluate(async (prod) => {
    const css = await fetch(`${prod}/style.css`).then((r) => r.text());
    const rv = await fetch(`${prod}/js/resultView.js`).then((r) => r.text());
    const pl = await fetch(`${prod}/js/ai/promptGenerationPipeline.js`).then((r) => r.text());
    return {
      cssHiddenFix: css.includes(".generating[hidden]"),
      resultViewFinally: rv.includes("loading dismissed"),
      resultViewTimeout: rv.includes("GENERATION_TIMEOUT_MS"),
      pipelineHasFetch: pl.includes("fetch(") || pl.includes("/api/generate-prompt"),
      pipelineHasProvider: pl.includes("promptProvider"),
    };
  }, PROD);
  console.log("\n2. 配信アセット");
  console.log(JSON.stringify(assetCheck, null, 2));

  // 3) 本番 JS を import して生成 + overlay 状態を計測
  await page.setContent(`
    <!DOCTYPE html><html><head>
      <link rel="stylesheet" href="${PROD}/style.css">
    </head><body>
      <div id="generating-overlay" class="generating" hidden>loading</div>
      <pre id="out"></pre>
    </body></html>
  `);
  await page.waitForTimeout(300);

  const gen = await page.evaluate(async (prod) => {
    const overlay = document.getElementById("generating-overlay");
    const log = [];

    overlay.hidden = false;
    log.push({ step: "showGenerating(true)", hidden: overlay.hidden, display: getComputedStyle(overlay).display });

    const answers = {
      sales_type: "商談",
      industry: "エステサロン",
      client_challenge: "売上アップ",
      goal: "商談成功",
      ai_role: "BtoBソリューション営業のプロ",
      tone: "論理的",
      output_format: "営業台本",
    };

    const t0 = performance.now();
    const { generateWizardPrompt } = await import(`${prod}/js/ai/promptGenerationPipeline.js`);
    const result = await generateWizardPrompt("sales", answers);
    const genMs = Math.round(performance.now() - t0);

    overlay.hidden = true;
    log.push({ step: "showGenerating(false)", hidden: overlay.hidden, display: getComputedStyle(overlay).display });

    return {
      genMs,
      promptLen: result.prompt.length,
      source: result.metrics.source,
      aiApiCalls: result.metrics.aiApiCalls,
      overlayLog: log,
    };
  }, PROD);

  console.log("\n3. 本番 JS 直接実行（Network/API 不使用）");
  console.log(JSON.stringify(gen, null, 2));

  // 4) showGeneratedResult 相当の finally シミュレーション
  const finallySim = await page.evaluate(async (prod) => {
    const { generateWizardPrompt } = await import(`${prod}/js/ai/promptGenerationPipeline.js`);
    const overlay = document.getElementById("generating-overlay");
    let finallyRan = false;
    overlay.hidden = false;
    try {
      await generateWizardPrompt("sales", { sales_type: "商談", industry: "エステサロン", client_challenge: "売上アップ", goal: "商談成功", ai_role: "BtoB", tone: "論理的", output_format: "営業台本" });
    } finally {
      overlay.hidden = true;
      finallyRan = true;
    }
    return {
      finallyRan,
      overlayHidden: overlay.hidden,
      overlayDisplay: getComputedStyle(overlay).display,
    };
  }, PROD);

  console.log("\n4. finally 実行後の overlay");
  console.log(JSON.stringify(finallySim, null, 2));

  console.log("\n5. generate-prompt 関連 Network");
  if (networkLog.length === 0) {
    console.log("   (generate-prompt へのリクエストなし)");
  } else {
    networkLog.forEach((n) => console.log(`   ${JSON.stringify(n)}`));
  }
  const stillPending = [...pending.values()];
  if (stillPending.length) {
    console.log("   Pending のまま:");
    stillPending.forEach((p) => console.log(`   ${JSON.stringify(p)}`));
  }

  const relevant = consoleLog.filter((l) =>
    /resultView|promptPipeline|ui\]|generate-prompt|loading dismissed|failed|pageerror/.test(l)
  );
  console.log("\n6. 関連コンソールログ");
  if (relevant.length) relevant.forEach((l) => console.log(`   ${l}`));
  else console.log("   (該当ログなし — フルウィザード未実行のため)");

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
