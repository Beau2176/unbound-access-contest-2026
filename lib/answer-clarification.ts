type AnswerField = { id: string; label: string; kind: string };
export type AnswerClarification = { fieldId: string; value: ""; needsClarification: true; question: string };

// Treat uncertainty as a request for clarification, never as a missing fact to
// fill in. Free-text descriptions may legitimately discuss uncertainty, so only
// standalone non-answers are intercepted for those fields.
const factualKinds = new Set(["number", "money", "yesno", "date"]);
const uncertainFact = /\b(?:not sure|not certain|unsure|uncertain|don['’]?t know|do not know|can['’]?t remember|cannot remember|no idea|maybe|perhaps|probably|i think|i guess|i believe|could be|might be|approximately|about|around|roughly|undecided)\b/i;
const standalone = [
  /^(?:(?:i'm|i am|we're|we are) )?(?:not sure|not certain|unsure|uncertain)(?: yet| right now)?$/,
  /^(?:(?:i|we) )?(?:do not|don't|dont|cannot|can't|cant) (?:know|remember)(?: yet| right now| the answer)?$/,
  /^(?:(?:i|we) (?:have |have got )?)?no idea(?: yet| right now)?$/,
  /^(?:unknown|undecided|maybe|perhaps|not decided(?: yet)?)$/,
];

export function getAnswerClarification(field: AnswerField, utterance: string): AnswerClarification | null {
  const text = utterance.trim().toLowerCase().replace(/’/g, "'").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
  if (!text || !(standalone.some(pattern => pattern.test(text)) || (factualKinds.has(field.kind) && uncertainFact.test(text)))) return null;
  const answer = field.kind === "number" ? "What exact number should I use"
    : field.kind === "money" ? "What exact amount should I use"
    : field.kind === "date" ? "What exact date should I use"
    : field.kind === "yesno" ? "Should I use Yes or No" : "What answer should I use";
  return { fieldId: field.id, value: "", needsClarification: true,
    question: `${answer} for “${field.label}”? Your saved answers are unchanged. Give a definite answer, or skip this question for now.` };
}
