/**
 * 思考エンジン — テンプレートプロバイダー
 *
 * 現状: ルールベースのみ
 * 将来: openai プロバイダーに差し替え可能
 */

import { resolveHandler } from "../clients/registry.js";

/**
 * @param {import("../types.js").ThinkingRequest} request
 */
export function run(request) {
  const { client, scenario, input, meta } = request;
  const handler = resolveHandler(client, scenario);

  if (scenario === "to-payload") {
    return handler({ thinking: input.thinking, extras: meta?.extras || {} });
  }

  return handler(input);
}
