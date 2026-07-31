/**
 * AI プロバイダー共通型
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type StreamCallbacks = {
  onDelta: (text: string) => void;
};

export type GenerateResult = {
  prompt: string;
  model: string;
  provider: string;
};

export interface AIProvider {
  readonly name: string;
  generateStream(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<GenerateResult>;
}
