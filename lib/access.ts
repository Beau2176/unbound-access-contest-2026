export type FieldKind = "text" | "longtext" | "number" | "money" | "yesno" | "email" | "date";
export type Field = { id: string; label: string; kind: FieldKind; required: boolean; sourceQuote: string; sourcePage: number; factKey: string; help: string; requiredWhen?: { fieldId: string; equals: string }; min?: number; max?: number };
export type FormDefinition = { id: string; title: string; sourceText: string; fields: Field[]; fictional: boolean; linksVerified: boolean; origin: "prepared" | "meta" | "manual" | "local"; warnings: string[] };
export type Answer = { value: string; confirmed: boolean; method: "typed" | "voice" | "meta"; at: string };
export type Change = { fieldId: string; before: string; after: string };
export type Proposal = { revision: number; changes: Change[]; method: Answer["method"]; transcript: string };
export type Audit = { at: string; changes: Change[]; method: Answer["method"] };
export type Session = { version: 1; form: FormDefinition; answers: Record<string, Answer>; revision: number; audit: Audit[]; startedAt: string; interactions: number };
export type Issue = { fieldId: string; message: string };

export function createSession(form: FormDefinition): Session {
  return { version: 1, form: structuredClone(form), answers: {}, revision: 0, audit: [], startedAt: new Date().toISOString(), interactions: 0 };
}
export function groups(form: FormDefinition): Field[][] {
  const result = new Map<string, Field[]>();
  for (const f of form.fields) { const key = form.linksVerified ? f.factKey : f.id; result.set(key, [...(result.get(key) ?? []), f]); }
  return [...result.values()];
}
export function isRequired(field: Field, session: Session): boolean {
  return field.required || !!(field.requiredWhen && session.answers[field.requiredWhen.fieldId]?.value === field.requiredWhen.equals);
}
const words: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function normalizeValue(field: Field, input: string): string {
  const value = input.trim();
  if (!value) return "";
  if (field.kind === "email") {
    // Phone keyboard dictation arrives as typed input too. Convert explicit
    // separators only; keep other spaces so ambiguous addresses fail validation.
    if (emailPattern.test(value)) return value;
    return value.replace(/\s+(?:at(?:\s+sign)?|a\s*-\s*t|a\s+t)\s+/gi, "@")
      .replace(/\s*@\s*/g, "@")
      .replace(/\s+dot\s+/gi, ".")
      .replace(/\s*\.\s*/g, ".");
  }
  if (field.kind === "yesno") {
    if (/^(yes|y|yeah|yep|true)$/i.test(value)) return "Yes";
    if (/^(no|n|nope|false)$/i.test(value)) return "No";
  }
  if (field.kind === "number" || field.kind === "money") {
    const spoken = value.toLowerCase().replace(field.kind === "money" ? /\s+dollars?$/ : /\s+(?:people|persons|items|members)$/, "");
    if (words[spoken] !== undefined) return String(words[spoken]);
  }
  if (field.kind === "money" && /^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value)) return value.replace(/[$,]/g, "");
  return value;
}
export function valueError(field: Field, value: string): string | null {
  if (!value) return null;
  if (value.length > 3000) return "Keep this answer under 3,000 characters.";
  if (field.kind === "number" || field.kind === "money") {
    if (!/^\d+(\.\d{1,2})?$/.test(value) || (field.kind === "number" && !/^\d+$/.test(value))) return field.kind === "number" ? "Use a whole number." : "Use an amount, such as 1200.50.";
    const n = Number(value);
    if (!Number.isFinite(n) || n < (field.min ?? 0) || (field.max !== undefined && n > field.max)) return `Use a value from ${field.min ?? 0}${field.max !== undefined ? ` to ${field.max}` : " upward"}.`;
  }
  if (field.kind === "yesno" && !["Yes", "No"].includes(value)) return "Choose Yes or No.";
  if (field.kind === "email" && !emailPattern.test(value)) return "Check the email address. You can say alex at example dot com.";
  if (field.kind === "date") {
    const date = new Date(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return "Use a real date in YYYY-MM-DD format.";
  }
  return null;
}
export function proposeAnswer(session: Session, fieldId: string, input: string, method: Answer["method"] = "typed"): Proposal {
  const field = session.form.fields.find(f => f.id === fieldId);
  if (!field) throw new Error("That question is not in this form.");
  const value = normalizeValue(field, input);
  const targets = session.form.linksVerified ? session.form.fields.filter(f => f.factKey === field.factKey) : [field];
  for (const target of targets) { const error = valueError(target, value); if (error) throw new Error(error); }
  return { revision: session.revision, changes: targets.map(f => ({ fieldId: f.id, before: session.answers[f.id]?.value ?? "", after: value })), method, transcript: input };
}
export function applyProposal(session: Session, proposal: Proposal): Session {
  if (session.revision !== proposal.revision) throw new Error("An answer changed while this correction was open. Review it again.");
  if (!proposal.changes.length || new Set(proposal.changes.map(c => c.fieldId)).size !== proposal.changes.length) throw new Error("This answer change is invalid.");
  const fields = proposal.changes.map(c => session.form.fields.find(f => f.id === c.fieldId));
  if (fields.some(f => !f)) throw new Error("The proposed question was not found.");
  const factKeys = new Set(fields.map(f => session.form.linksVerified ? f!.factKey : f!.id));
  if (factKeys.size !== 1) throw new Error("Review different facts separately.");
  const expectedTargets = session.form.linksVerified ? session.form.fields.filter(f => f.factKey === fields[0]!.factKey) : [fields[0]!];
  if (expectedTargets.length !== fields.length || expectedTargets.some(f => !proposal.changes.some(c => c.fieldId === f.id))) throw new Error("Review every linked field together.");
  if (new Set(proposal.changes.map(c => c.after)).size !== 1) throw new Error("Linked questions must have the same answer.");
  for (let i = 0; i < proposal.changes.length; i++) {
    const c = proposal.changes[i];
    if ((session.answers[c.fieldId]?.value ?? "") !== c.before) throw new Error("The earlier value changed. Review this correction again.");
    const error = valueError(fields[i]!, c.after); if (error) throw new Error(error);
  }
  const next = structuredClone(session), at = new Date().toISOString();
  for (const c of proposal.changes) next.answers[c.fieldId] = { value: c.after, confirmed: true, method: proposal.method, at };
  next.revision++; next.interactions++;
  next.audit.push({ at, changes: structuredClone(proposal.changes), method: proposal.method });
  return next;
}
export function issues(session: Session): Issue[] {
  const result: Issue[] = [];
  for (const f of session.form.fields) {
    const answer = session.answers[f.id];
    if (isRequired(f, session) && (!answer?.confirmed || !answer.value.trim())) result.push({ fieldId: f.id, message: `${f.label} still needs an answer.` });
    if (answer?.value) { const error = valueError(f, answer.value); if (error) result.push({ fieldId: f.id, message: `${f.label}: ${error}` }); }
  }
  for (const group of groups(session.form)) {
    const values = new Set(group.map(f => session.answers[f.id]?.value).filter(Boolean));
    if (values.size > 1) result.push({ fieldId: group[0].id, message: `Linked answers disagree: ${group.map(f => f.label).join(" / ")}.` });
  }
  const support = session.answers.support?.value;
  if (support === "No" && session.answers.support_details?.value) result.push({ fieldId: "support", message: "You chose No for access support, but support details are filled in. Review these answers." });
  return result;
}
export function exportRows(session: Session) {
  return session.form.fields.map(f => ({ id: f.id, label: f.label, source: f.sourceQuote, page: f.sourcePage, value: session.answers[f.id]?.value ?? "[Not answered]", confirmed: !!session.answers[f.id]?.confirmed }));
}
export function parseCommand(text: string): { command: string; target?: string; value?: string } {
  const clean = text.trim().replace(/[.!?]+$/, "");
  if (/^(stop|pause|stop listening)$/i.test(clean)) return { command: "stop" };
  if (/^(resume|continue|start listening)$/i.test(clean)) return { command: "resume" };
  if (/^(repeat|read|read question|say that again)$/i.test(clean)) return { command: "repeat" };
  if (/^(review|review answers|read my answers)$/i.test(clean)) return { command: "review" };
  if (/^(confirm review|finish review|i have reviewed (?:my|the) answers|i'?ve reviewed (?:my|the) answers)$/i.test(clean)) return { command: "confirm_review" };
  if (/^(download|download (?:my )?(?:pdf|draft|draft pdf)|save (?:my )?pdf)$/i.test(clean)) return { command: "download" };
  if (/^(clear (?:this |my )?answer|remove (?:this |my )?answer)$/i.test(clean)) return { command: "clear_answer" };
  if (/^(skip|skip question)$/i.test(clean)) return { command: "skip" };
  if (/^(back|previous|go back)$/i.test(clean)) return { command: "back" };
  if (/^(confirm|save answer|confirm change|yes confirm)$/i.test(clean)) return { command: "confirm" };
  if (/^(cancel|cancel change|discard change)$/i.test(clean)) return { command: "cancel" };
  const match = clean.match(/^(?:change|correct|update)\s+(.+?)(?:\s+to\s+(.+))?$/i);
  if (match) return { command: "correct", target: match[1], value: match[2] };
  return { command: "answer", value: clean };
}
export function findCorrectionTargets(form: FormDefinition, target: string): Field[] {
  const q = target.toLowerCase().replace(/^(my|the)\s+/, "");
  const tokens = q.split(/\s+/).filter(Boolean);
  const matches = form.fields.filter(f => { const text = `${f.label} ${f.factKey}`.toLowerCase().replace(/[_.]/g, " "); return tokens.length > 0 && tokens.every(token => text.includes(token)); });
  const seen = new Set<string>();
  return matches.filter(f => { const key = form.linksVerified ? f.factKey : f.id; if (seen.has(key)) return false; seen.add(key); return true; });
}
export function resolveClarification(form: FormDefinition, choices: Field[], text: string): Field | null {
  const clean = text.toLowerCase().trim().replace(/[.!?]+$/, "").replace(/^(?:choose|option|question|the)\s+/, "");
  const order: Record<string, number> = { one: 1, first: 1, two: 2, second: 2, three: 3, third: 3, four: 4, fourth: 4 };
  const index = /^\d+$/.test(clean) ? Number(clean) : order[clean.replace(/\s+(?:one|option|question)$/, "")];
  if (index !== undefined && index >= 1 && index <= choices.length) return choices[index - 1];
  const matched = findCorrectionTargets(form, text).filter(f => choices.some(choice => choice.id === f.id));
  return matched.length === 1 ? matched[0] : null;
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const bounded = (value: unknown, min: number, max: number): value is string => typeof value === "string" && value.length >= min && value.length <= max;
const timestamp = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
export function validFormDefinition(value: unknown): value is FormDefinition {
  if (!record(value) || !bounded(value.id, 1, 100) || !bounded(value.title, 1, 160) || !bounded(value.sourceText, 1, 16000)
    || value.fictional !== true || typeof value.linksVerified !== "boolean" || !["prepared", "meta", "manual", "local"].includes(String(value.origin))
    || !Array.isArray(value.warnings) || value.warnings.length > 12 || value.warnings.some(w => !bounded(w, 0, 500))
    || !Array.isArray(value.fields) || !value.fields.length || value.fields.length > 24) return false;
  const fields = value.fields;
  if (fields.some(f => !record(f) || !bounded(f.id, 1, 48) || !/^[a-z][a-z0-9_]{0,47}$/.test(f.id)
    || !bounded(f.label, 1, 160) || !["text", "longtext", "number", "money", "yesno", "email", "date"].includes(String(f.kind))
    || typeof f.required !== "boolean" || !bounded(f.sourceQuote, 1, 500) || !Number.isInteger(f.sourcePage) || Number(f.sourcePage) < 1 || Number(f.sourcePage) > 10
    || !bounded(f.factKey, 1, 100) || !bounded(f.help, 1, 400)
    || (f.min !== undefined && (typeof f.min !== "number" || !Number.isFinite(f.min)))
    || (f.max !== undefined && (typeof f.max !== "number" || !Number.isFinite(f.max)))
    || (typeof f.min === "number" && typeof f.max === "number" && f.min > f.max))) return false;
  if (new Set(fields.map(f => f.id)).size !== fields.length) return false;
  const sections = value.sourceText.split(/\[Page (\d+)\]/), pages = new Map<number, string>();
  if (sections.length === 1) pages.set(1, value.sourceText);
  else for (let i = 1; i < sections.length; i += 2) pages.set(Number(sections[i]), sections[i + 1]);
  for (const field of fields) {
    if (!pages.get(field.sourcePage)?.includes(field.sourceQuote)) return false;
    if (field.requiredWhen !== undefined && (!record(field.requiredWhen) || !bounded(field.requiredWhen.equals, 1, 3000)
      || !fields.some(f => f.id === field.requiredWhen.fieldId) || field.requiredWhen.fieldId === field.id)) return false;
    if (value.linksVerified && fields.some(f => f.factKey === field.factKey && f.kind !== field.kind)) return false;
  }
  return true;
}
export function restoreSession(raw: string | null): Session | null {
  if (!raw || raw.length > 300000) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (s?.version !== 1 || !validFormDefinition(s.form) || !record(s.answers) || !Number.isInteger(s.revision) || s.revision < 0
      || !Array.isArray(s.audit) || s.audit.length > 1000 || s.audit.length !== s.revision || !timestamp(s.startedAt)
      || !Number.isInteger(s.interactions) || s.interactions < 0) return null;
    for (const [id,a] of Object.entries(s.answers)) if (!record(a) || !s.form.fields.some(f => f.id === id) || !bounded(a.value, 0, 3000)
      || a.confirmed !== true || !["typed", "voice", "meta"].includes(String(a.method)) || !timestamp(a.at)) return null;
    for (const entry of s.audit) if (!record(entry) || !timestamp(entry.at) || !["typed", "voice", "meta"].includes(String(entry.method))
      || !Array.isArray(entry.changes) || !entry.changes.length || entry.changes.length > 24
      || entry.changes.some(c => !record(c) || !s.form.fields.some(f => f.id === c.fieldId) || !bounded(c.before, 0, 3000) || !bounded(c.after, 0, 3000))) return null;
    return s;
  } catch { return null; }
}
