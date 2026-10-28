import type { FormDefinition } from "./access.ts";
import { metaSystemPrompt, ModelError, validateExtraction } from "./meta.ts";
export const META_PLAYGROUND = "https://build.nvidia.com/meta/muse-glimmer-30b/playground";
export function manualMetaPrompt(source: string) {
  if (source.trim().length < 30 || source.length > 16000) throw new ModelError("Use a fictional form with 30 to 16,000 characters.",400);
  return `${metaSystemPrompt("extract")}\nFor copying from a web playground, put the JSON in one fenced json code block.\n\n${JSON.stringify({source})}`;
}
export function importManualMeta(output: string, source: string): FormDefinition {
  manualMetaPrompt(source);
  if (output.length > 80000) throw new ModelError("Use a shorter proposed question list.",400);
  try {
    const raw = JSON.parse(output.trim().replace(/^```(?:json)?\s*|\s*```$/g,""));
    const form = validateExtraction(raw, source);
    return {...form,id:`manual-${Date.now()}`,sourceText:source,fictional:true,linksVerified:true,origin:"manual"};
  } catch (error) {
    if (error instanceof ModelError) throw error;
    throw new ModelError("The proposed questions could not be verified. Copy the complete JSON response, including every field, and keep the original source text unchanged.",422);
  }
}
