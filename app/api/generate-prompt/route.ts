import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAIConfigured } from "@/lib/ai/env";
import { generatePromptWithAI } from "@/lib/ai/generate-prompt";
import { validateGenerateRequest } from "@/lib/ai/prompt-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SSE イベントをエンコード */
function sseEvent(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です", fallback: true }, { status: 401 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: "OpenAI API が未設定です", fallback: true },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です", fallback: true }, { status: 400 });
  }

  const payload = validateGenerateRequest(body);
  if (!payload) {
    return NextResponse.json({ error: "入力データが不正です", fallback: true }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const startedAt = Date.now();
      controller.enqueue(sseEvent({ type: "start", model: "gpt-4o" }));

      try {
        const result = await generatePromptWithAI(payload, (delta) => {
          controller.enqueue(sseEvent({ type: "delta", text: delta }));
        });

        controller.enqueue(
          sseEvent({
            type: "done",
            prompt: result.prompt,
            model: result.model,
            provider: result.provider,
            source: result.source,
            durationMs: result.durationMs,
            qualityGuard: result.qualityGuard,
          })
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "プロンプト生成に失敗しました";
        controller.enqueue(
          sseEvent({
            type: "error",
            error: message,
            fallback: true,
            durationMs: Date.now() - startedAt,
          })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
