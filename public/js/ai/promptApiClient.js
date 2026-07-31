/**
 * プロンプト生成 API クライアント（SSE ストリーミング）
 */

const API_PATH = "/api/generate-prompt";
/** サーバータイムアウト 30秒 + 余裕 */
const CLIENT_TIMEOUT_MS = 32000;

/**
 * @param {object} payload
 * @param {{ onDelta?: (text: string) => void, onStep?: (step: string) => void }} [callbacks]
 */
export async function fetchGeneratedPrompt(payload, callbacks = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  const startedAt = performance.now();

  let progressTimer = setInterval(() => {
    const sec = Math.round((performance.now() - startedAt) / 1000);
    callbacks.onStep?.(`GPT-4o が最高品質のプロンプトを設計中…（${sec}秒）`);
  }, 1000);

  function clearProgress() {
    clearInterval(progressTimer);
    progressTimer = null;
  }

  try {
    callbacks.onStep?.("GPT-4o に接続中…");

    const response = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

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
    let meta = {
      source: "openai",
      model: "gpt-4o",
      durationMs: null,
      qualityGuard: null,
    };
    let receivedDelta = false;

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

        if (event.type === "start") {
          callbacks.onStep?.("GPT-4o がプロンプトを設計中…");
        } else if (event.type === "delta" && event.text) {
          if (!receivedDelta) {
            receivedDelta = true;
            clearProgress();
            callbacks.onStep?.("プロンプトを生成中…（ストリーミング表示）");
          }
          fullPrompt += event.text;
          callbacks.onDelta?.(event.text);
        } else if (event.type === "done") {
          clearProgress();
          fullPrompt = event.prompt || fullPrompt;
          meta = {
            source: event.source || "openai",
            model: event.model || "gpt-4o",
            durationMs: event.durationMs ?? Math.round(performance.now() - startedAt),
            qualityGuard: event.qualityGuard || null,
          };
        } else if (event.type === "error") {
          clearProgress();
          const err = new Error(event.error || "生成エラー");
          err.fallback = event.fallback !== false;
          throw err;
        }
      }
    }

    clearProgress();

    if (!fullPrompt.trim()) {
      throw new Error("空のプロンプトが返されました");
    }

    const clientDurationMs = Math.round(performance.now() - startedAt);

    return {
      prompt: fullPrompt.trim(),
      source: meta.source,
      model: meta.model,
      durationMs: meta.durationMs ?? clientDurationMs,
      clientDurationMs,
      qualityGuard: meta.qualityGuard,
      aiApiCalls: 1,
    };
  } catch (err) {
    clearProgress();
    if (err instanceof Error && err.name === "AbortError") {
      const timeoutErr = new Error("プロンプト生成がタイムアウトしました（30秒）");
      timeoutErr.fallback = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    clearProgress();
  }
}
