/**
 * プロンプト生成 API クライアント（SSE ストリーミング）
 */

const API_PATH = "/api/generate-prompt";
const CLIENT_TIMEOUT_MS = 35000;

/**
 * @param {object} payload — wizard or meeting リクエスト
 * @param {{ onDelta?: (text: string) => void, onStep?: (step: string) => void }} [callbacks]
 * @returns {Promise<{ prompt: string, source: string, model?: string, fallback?: boolean }>}
 */
export async function fetchGeneratedPrompt(payload, callbacks = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    callbacks.onStep?.("GPT-4o がプロンプトを設計中…");

    const response = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    // 非ストリームエラー（401/503 等）
    if (!response.ok) {
      let fallback = true;
      try {
        const errJson = await response.json();
        fallback = errJson.fallback !== false;
      } catch {
        /* ignore */
      }
      const err = new Error(`API エラー (${response.status})`);
      err.fallback = fallback;
      throw err;
    }

    if (!response.body) {
      throw new Error("ストリームを取得できませんでした");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullPrompt = "";
    let meta = { source: "openai", model: "gpt-4o" };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;

        let event;
        try {
          event = JSON.parse(line.slice(5).trim());
        } catch {
          continue;
        }

        if (event.type === "delta" && event.text) {
          fullPrompt += event.text;
          callbacks.onDelta?.(event.text);
        } else if (event.type === "done") {
          fullPrompt = event.prompt || fullPrompt;
          meta = { source: event.source || "openai", model: event.model };
        } else if (event.type === "error") {
          const err = new Error(event.error || "生成エラー");
          err.fallback = event.fallback !== false;
          throw err;
        }
      }
    }

    if (!fullPrompt.trim()) {
      throw new Error("空のプロンプトが返されました");
    }

    return { prompt: fullPrompt.trim(), ...meta, aiApiCalls: 1 };
  } finally {
    clearTimeout(timer);
  }
}
