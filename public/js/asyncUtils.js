/**
 * AI Builder — async ユーティリティ
 */

/**
 * Promise にタイムアウトを付与する
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
export function withTimeout(promise, ms, label = "operation") {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} が ${ms}ms 以内に完了しませんでした`)), ms);
    }),
  ]);
}

/**
 * @param {() => Promise<T>} fn
 * @param {number} ms
 * @param {string} label
 * @template T
 * @returns {Promise<T>}
 */
export function runWithTimeout(fn, ms, label) {
  return withTimeout(fn(), ms, label);
}
