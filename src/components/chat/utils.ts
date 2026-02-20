/**
 * Anthropic SDK's toReadableStream() produces newline-separated JSON (NDJSON),
 * not SSE. Each line is a full event object.
 */
export function parseStreamLine(
  line: string,
): { type?: string; delta?: { type?: string; text?: string } } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    return parsed;
  } catch {
    return null;
  }
}

export async function* readStreamLines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      yield line;
    }
  }
  if (buffer) yield buffer;
}
