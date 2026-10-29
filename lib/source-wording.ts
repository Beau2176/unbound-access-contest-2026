import { indexLocalSource, explicitSourceKind, parseLocalExtraction } from "./local-meta-policy.ts";
import { ModelError } from "./meta.ts";
import type { FormDefinition } from "./access.ts";

// An explicit alternative to model inference, never counted as a model pass.
// Unknown labels, conditions and limits stop the proposal instead of guessing.
export function sourceWordingProposal(source:string):FormDefinition {
  const lines=indexLocalSource(source);
  if(!/^fictional\b/i.test(lines[0].text)) throw new ModelError("Start this short practice form with its Fictional title, followed by one question per line.",422);
  const fields:Record<string,string>={[lines[0].id]:"skip"};
  for(const line of lines.slice(1)) {
    const kind=explicitSourceKind(line.text);
    if(!kind) throw new ModelError(`The answer type is not explicit for “${line.text.slice(0,120)}”. Use Meta or a manually reviewed proposal; your current form is unchanged.`,422);
    fields[line.id]=kind;
  }
  const result=parseLocalExtraction(JSON.stringify({fields}),source);
  return {...result,id:`source-${Date.now()}`,origin:"source",warnings:[
    "These types come from explicit source wording using application rules. No AI request was made. This is not a model accuracy result.",
    "Check every type, source page, required flag and repeated-label link before approving. Unknown types, conditions and numeric limits need a different proposal route.",
  ]};
}
