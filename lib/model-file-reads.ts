// Keep the browser's actual Blob/File object and trace only the byte ranges
// requested by the pinned inference runtime. Never materialize the whole model.
export type ModelRead = { offset: number; bytes: number; outcome: "start" | "ready" | "error"; error?: string };
export function traceModelFileReads(blob: Blob, report: (read: ModelRead) => void): Blob {
  const slice = blob.slice.bind(blob);
  Object.defineProperty(blob, "slice", { configurable: true, value(start = 0, end = blob.size, type?: string) {
    const offset = start < 0 ? Math.max(blob.size + start, 0) : Math.min(start, blob.size);
    const chunk = slice(start, end, type), arrayBuffer = chunk.arrayBuffer.bind(chunk);
    Object.defineProperty(chunk, "arrayBuffer", { value: async () => {
      const read = { offset, bytes: chunk.size };
      report({ ...read, outcome: "start" });
      try { const buffer = await arrayBuffer(); report({ ...read, outcome: "ready" }); return buffer; }
      catch (error) { report({ ...read, outcome: "error", error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) }); throw error; }
    }});
    return chunk;
  }});
  return blob;
}
