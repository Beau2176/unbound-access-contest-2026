import { z } from "zod";
import { callFreeMeta, ModelError } from "./meta.ts";
import { callFreeNvidia } from "./nvidia.ts";
import { getAnswerClarification } from "./answer-clarification.ts";

const schema = z.object({
  task: z.enum(["extract", "answer"]), text: z.string().min(1).max(16000),
  fictionalDataOnly: z.literal(true), consent: z.literal(true),
  field: z.object({ id: z.string().regex(/^[a-z][a-z0-9_]{0,47}$/), label: z.string().min(1).max(160),
    kind: z.enum(["text", "longtext", "number", "money", "yesno", "email", "date"]) }).strict().optional(),
}).strict();

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function readBody(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 80000) throw new ModelError("Use a smaller document.", 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ModelError("Send the form as JSON.", 415);
  if (!request.body) throw new ModelError("The request did not include a form.", 400);
  const reader = request.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > 80000) { await reader.cancel(); throw new ModelError("Use a smaller document.", 413); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

export async function handleAssist(request: Request, options: { authenticated: boolean; key?: string; provider?: "openrouter" | "nvidia" | "unavailable"; fetcher?: typeof fetch }) {
  if (!options.authenticated) return json({ error: "Sign in to this private prototype before using Meta AI.", preservedAnswers: true }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Use the app's own page.", preservedAnswers: true }, 403);
  try {
    const body = schema.parse(await readBody(request));
    if (body.task === "answer" && !body.field) return json({ error: "Choose a question first.", preservedAnswers: true }, 400);
    if (body.task === "answer") {
      const clarification = getAnswerClarification(body.field!, body.text);
      if (clarification) return json({ data: clarification, model: "Application clarification (no AI call)", provider: "Application rules", reportedCost: 0 });
    }
    if (options.provider === "unavailable") throw new ModelError("Live Meta AI has no valid provider configured. Your answers are preserved.");
    const call = options.provider === "nvidia" ? callFreeNvidia : callFreeMeta;
    return json(await call({ key: options.key, fetcher: options.fetcher, ...body }));
  } catch (error) {
    return json({ error: error instanceof ModelError ? error.message : "The request could not be used. Your existing answers are unchanged.",
      preservedAnswers: true }, error instanceof ModelError ? error.status : 400);
  }
}
