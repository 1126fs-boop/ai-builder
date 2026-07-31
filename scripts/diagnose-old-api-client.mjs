/**
 * 旧 API クライアント + POST 405 の挙動再現
 */
import { chromium } from "playwright";

const PROD = "https://ai-builder-chi-three.vercel.app";
const CLIENT_TIMEOUT_MS = 32000;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];

  page.on("console", (msg) => logs.push(msg.text()));

  const result = await page.evaluate(async ({ prod, timeoutMs }) => {
    async function fetchGeneratedPrompt(payload) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const startedAt = performance.now();

      try {
        const response = await fetch(`${prod}/api/generate-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API エラー (${response.status})`);
        }
        if (!response.body) throw new Error("no body");

        const reader = response.body.getReader();
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
        return { ok: true };
      } finally {
        clearTimeout(timer);
      }
    }

    const t0 = performance.now();
    let error = null;
    try {
      await fetchGeneratedPrompt({ mode: "wizard", categoryId: "sales", answers: {} });
    } catch (e) {
      error = e.message;
    }
    return {
      ms: Math.round(performance.now() - t0),
      error,
      timedOut: performance.now() - t0 > timeoutMs - 100,
    };
  }, { prod: PROD, timeoutMs: CLIENT_TIMEOUT_MS });

  console.log("旧 API クライアント POST 405 再現:");
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

run();
