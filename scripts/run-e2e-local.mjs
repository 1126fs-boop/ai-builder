import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2]) || 3490;

const serveProc = spawn("npx", ["--yes", "serve", "public", "-l", String(port), "--no-clipboard"], {
  cwd: root,
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
});

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("serve timeout")), 30000);
  const onData = (chunk) => {
    if (chunk.toString().includes("Accepting connections")) {
      clearTimeout(timeout);
      resolve(null);
    }
  };
  serveProc.stdout?.on("data", onData);
  serveProc.stderr?.on("data", onData);
  serveProc.on("error", reject);
});

const url = `http://127.0.0.1:${port}`;
console.log("Testing", url);
const result = spawnSync(process.execPath, [path.join(root, "scripts/quality-gate-category-flow.mjs"), url], {
  stdio: "inherit",
});

if (process.platform === "win32") {
  spawnSync("taskkill", ["/pid", String(serveProc.pid), "/f", "/t"], { stdio: "ignore", shell: true });
} else {
  serveProc.kill("SIGTERM");
}

process.exit(result.status ?? 1);
