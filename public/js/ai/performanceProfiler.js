/**
 * 処理時間計測ユーティリティ（開発・本番ログ用）
 */

const LOG_PREFIX = "[perf]";

/** @typedef {{ name: string, elapsed: number, delta: number }} PerfMark */

/**
 * @param {string} scope
 */
export function createProfiler(scope) {
  /** @type {PerfMark[]} */
  const marks = [];
  const startedAt = performance.now();
  let lastAt = startedAt;

  return {
    /** @param {string} name */
    mark(name) {
      const now = performance.now();
      marks.push({
        name,
        elapsed: now - startedAt,
        delta: now - lastAt,
      });
      lastAt = now;
    },

    /** コンソールにサマリーを出力 */
    report() {
      const rows = marks.map((m) => ({
        フェーズ: m.name,
        累計ms: Math.round(m.elapsed * 10) / 10,
        区間ms: Math.round(m.delta * 10) / 10,
      }));
      console.group(`${LOG_PREFIX} ${scope}`);
      console.table(rows);
      const total = marks.length ? marks[marks.length - 1].elapsed : 0;
      console.info(`${LOG_PREFIX} ${scope} 合計: ${Math.round(total * 10) / 10} ms`);
      console.groupEnd();
      return { scope, marks, totalMs: total };
    },
  };
}

/** UI更新のためにメインスレッドへ制御を返す（人工sleepの代替） */
export function yieldToMain() {
  if (typeof globalThis.scheduler !== "undefined" && typeof globalThis.scheduler.yield === "function") {
    return globalThis.scheduler.yield();
  }
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
