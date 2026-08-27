import type { AiClient, StructuredCall, StructuredResult, TextCall, Usage } from "../client";

export type FakeStructuredResponse =
  | { output: unknown; stopReason?: string | null; usage?: Partial<Usage> }
  | { refusal: true }
  | { error: Error };

/**
 * A scripted AiClient for tests: returns the queued structured responses in order
 * and records every call so tests can assert on prompts. Never touches the network.
 */
export function fakeClient(script: { structured?: FakeStructuredResponse[]; stream?: string[] } = {}) {
  const queue = [...(script.structured ?? [])];
  const calls: { structured: StructuredCall<unknown>[]; stream: TextCall[] } = { structured: [], stream: [] };

  const client: AiClient = {
    async structured<T>(call: StructuredCall<T>): Promise<StructuredResult<T>> {
      calls.structured.push(call as StructuredCall<unknown>);
      const next = queue.shift();
      if (!next) throw new Error("fakeClient: no scripted response left");
      if ("error" in next) throw next.error;
      const usage: Usage = { inputTokens: 100, outputTokens: 50, cacheReadTokens: 0, cacheWriteTokens: 0 };
      if ("refusal" in next) return { output: null, stopReason: "refusal", usage };
      const parsed = next.output === null ? null : call.schema.safeParse(next.output);
      return {
        output: parsed && parsed.success ? parsed.data : null,
        stopReason: next.stopReason ?? (parsed && parsed.success ? "end_turn" : "max_tokens"),
        usage: { ...usage, ...next.usage },
      };
    },
    async *streamText(call: TextCall): AsyncIterable<string> {
      calls.stream.push(call);
      for (const chunk of script.stream ?? []) yield chunk;
    },
  };

  return { client, calls };
}
