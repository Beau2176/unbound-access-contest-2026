import { ModelError, metaSystemPrompt, parseMetaContent } from "./meta.ts";
import type { MetaField } from "./meta.ts";

export const NVIDIA_META_MODEL = "meta/muse-glimmer-30b";
export const NVIDIA_MODEL_PAGE = "https://build.nvidia.com/meta/muse-glimmer-30b/build";
const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

// Catalog changes fail closed; paid partner endpoints are never selected.
export function nvidiaFreeEndpointAvailable(html: string) {
  if (html.length > 2_000_000) return false;
  const visible = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ");
  return /meta\s*\/\s*muse-glimmer-30b/.test(visible) && /Model Availability\s+Free Endpoint\s+Available\b/.test(visible);
}

export async function callFreeNvidia({ key, model = NVIDIA_META_MODEL, task, text, field, fetcher = fetch }: {
  key?: string; model?: string; task: "extract" | "answer"; text: string; field?: MetaField; fetcher?: typeof fetch;
}) {
  if (model !== NVIDIA_META_MODEL) throw new ModelError("This model is not approved for the free NVIDIA prototype. No request was sent.");
  if (!key) throw new ModelError("Live Meta AI is not connected. The free NVIDIA connection needs its server key. Your practice answers are preserved.");
  if (!text.trim() || text.length > 16000) throw new ModelError("Use between 1 and 16,000 characters of text.", 400);
  if (task === "answer" && (!field || !/^[a-z][a-z0-9_]{0,47}$/.test(field.id) || !field.label || !["text","longtext","number","money","yesno","email","date"].includes(field.kind))) throw new ModelError("Choose a valid question first. No AI request was sent.", 400);
  let page: Response;
  try { page = await fetcher(NVIDIA_MODEL_PAGE, { signal: AbortSignal.timeout(12000), cache: "no-store", redirect: "error" }); }
  catch { throw new ModelError("The free NVIDIA endpoint could not be checked. Your answers are preserved; no AI request was sent."); }
  if (!page.ok || !nvidiaFreeEndpointAvailable(await page.text())) throw new ModelError("The NVIDIA catalog does not confirm a free Muse Glimmer endpoint. No paid fallback will be used.");
  let response: Response;
  try { response = await fetcher(ENDPOINT, { method: "POST", redirect: "error", signal: AbortSignal.timeout(45000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: metaSystemPrompt(task) }, { role: "user", content: JSON.stringify(task === "extract" ? { source: text } : { field, utterance: text }) }],
      temperature: 0.95, top_p: 1, max_tokens: task === "extract" ? 7000 : 1500, reasoning_effort: "low", stream: false, tool_choice: "none" }) }); }
  catch { throw new ModelError("The free NVIDIA service did not respond. Your answers are preserved; try again later."); }
  if (response.status === 202) throw new ModelError("The free NVIDIA response is still pending. No answer has changed; try again later.");
  if (!response.ok) throw new ModelError(response.status === 429 ? "The free NVIDIA service is rate limited. Your answers are preserved; try again later." : "The free NVIDIA service is unavailable. Your answers are preserved.", response.status === 429 ? 429 : 503);
  const result = await response.json() as { model?: string; choices?: { finish_reason?: string; message?: { content?: string } }[] };
  if (result.model !== model || result.choices?.[0]?.finish_reason === "length") throw new ModelError("The NVIDIA response was incomplete or used an unexpected model. Your answers are unchanged.", 422);
  const data = parseMetaContent(result.choices?.[0]?.message?.content, task, text, field);
  return { data, model, provider: "NVIDIA API Catalog", reportedCost: null };
}
