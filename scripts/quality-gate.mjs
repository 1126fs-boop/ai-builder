/**
 * 品質ゲート — デプロイ前チェック（thinkingCore とは別）
 *
 * 1. Production Build (next build)
 * 2. 静的アセットの import 404 スキャン
 * 3. カテゴリ導線 E2E（ローカル静的サーバー）
 *
 * 使い方: npm run quality:gate
 */
import { spawn, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

/** @param {string} title */
function step(title) {
  console.log(`\n▶ ${title}`);
}

/** @param {string} cmd @param {string[]} args @param {{ shell?: boolean }} [opts] */
function runSync(cmd, args, opts = {}) {
  const shell = opts.shell ?? false;
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: root, shell, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

/** public 内の相対 import を簡易スキャン */
async function scanBrokenImports() {
  /** @param {string} dir @param {string} prefix */
  async function walk(dir, prefix = "") {
    /** @type {string[]} */
    const out = [];
    const { readdir } = await import("node:fs/promises");
    for (const name of await readdir(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${name.name}` : name.name;
      if (name.isDirectory()) out.push(...(await walk(path.join(dir, name.name), rel)));
      else if (name.name.endsWith(".js")) out.push(rel.replace(/\\/g, "/"));
    }
    return out;
  }

  const files = await walk(publicDir);
  const fileSet = new Set(files);
  const broken = [];

  for (const rel of files) {
    const abs = path.join(publicDir, rel.replace(/\//g, path.sep));
    const text = await readFile(abs, "utf8");
    const re = /from\s+["'](\.[^"']+)["']/g;
    let m;
    while ((m = re.exec(text))) {
      const spec = m[1];
      const base = path.dirname(rel);
      let resolved = path.posix.normalize(path.posix.join(base, spec));
      if (!resolved.endsWith(".js")) resolved += ".js";
      if (!fileSet.has(resolved)) {
        broken.push(`${rel} → ${spec} (expected ${resolved})`);
      }
    }
  }

  if (broken.length) {
    console.error("FAIL: 壊れた相対 import:");
    broken.forEach((b) => console.error(" -", b));
    process.exit(1);
  }
  console.log(`  OK: ${files.length} ファイルの相対 import を確認`);
}

/** npx serve で public を配信（MIME / キャッシュ問題を回避） */
function startServe(port) {
  const child = spawn("npx", ["--yes", "serve", "public", "-l", String(port), "--no-clipboard"], {
    cwd: root,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("serve 起動タイムアウト")), 30000);
    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes("Accepting connections") || text.includes("http://")) {
        clearTimeout(timeout);
        child.stdout?.off("data", onData);
        child.stderr?.off("data", onData);
        resolve(child);
      }
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("error", reject);
  });
}

function stopServe(child) {
  if (!child?.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/f", "/t"], { stdio: "ignore", shell: true });
  } else {
    child.kill("SIGTERM");
  }
}

async function main() {
  console.log("=== AI Builder 品質ゲート ===");

  step("① Production Build");
  runSync("npm", ["run", "build"], { shell: true });

  step("② 静的 JS import スキャン");
  await scanBrokenImports();

  step("③ カテゴリ導線 E2E");
  const port = 3460 + Math.floor(Math.random() * 20);
  const serveProc = await startServe(port);
  const testUrl = `http://127.0.0.1:${port}`;
  console.log(`  テストURL: ${testUrl}`);
  try {
    runSync(process.execPath, [path.join(root, "scripts/quality-gate-category-flow.mjs"), testUrl]);
  } finally {
    stopServe(serveProc);
  }

  const prodUrl = process.env.QUALITY_PROD_URL;
  if (prodUrl) {
    step("④ Production 導線確認");
    runSync(process.execPath, [path.join(root, "scripts/quality-gate-category-flow.mjs"), prodUrl]);
  }

  console.log("\n✅ 品質ゲート合格 — コミット・デプロイ可能");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
