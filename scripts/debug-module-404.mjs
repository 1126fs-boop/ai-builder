import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://localhost:3456";
const failed = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("requestfailed", (req) => failed.push({ url: req.url(), err: req.failure()?.errorText }));
page.on("response", (res) => {
  if (res.status() >= 400) failed.push({ url: res.url(), status: res.status() });
});
page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE:", msg.text());
});

await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);

console.log("Failed requests:");
failed
  .filter((f) => f.url.includes(baseUrl.replace("http://", "")) || f.url.startsWith(baseUrl))
  .forEach((f) => console.log(f.status || f.err, f.url));

const ready = await page.evaluate(() => ({
  cards: document.querySelectorAll("[data-category-id]").length,
  initRan: typeof window.__AIB_INIT__ !== "undefined",
}));
console.log("State:", ready);

await browser.close();
