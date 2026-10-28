import { applyProposal, createSession, proposeAnswer } from "./access.ts";
import { communityForm } from "./forms.ts";
export function phoneCheckSession() {
  let session = createSession(communityForm);
  const values = { full_name: "Alex Example", home_address: "10 Example Road, Sampletown", household_size: "2", monthly_income: "0", landlord_address: "90 Venue Lane, Sampletown", request: "Large-print fictional community information.", support: "No", email: "alex@example.invalid" };
  for (const [id, value] of Object.entries(values)) session = applyProposal(session, proposeAnswer(session, id, value));
  return session;
}
export function heardPhoneTestPhrase(text: string) {
  return text.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim() === "blue bicycle";
}
