import type { Field, FormDefinition } from "./access";
const field = (id: string, label: string, kind: Field["kind"], required: boolean, sourceQuote: string, factKey: string, help: string, extra: Partial<Field> = {}): Field => ({ id, label, kind, required, sourceQuote, factKey, help, sourcePage: 1, ...extra });
export const communityForm: FormDefinition = {
  id: "community-intake-v1", title: "Community Help Intake", fictional: true, linksVerified: true, origin: "prepared", warnings: [],
  sourceText: `FICTIONAL PRACTICE FORM — COMMUNITY HELP INTAKE\nThis example is not an agency application and does not determine eligibility.\n1. Full name (required)\n2. Applicant home address (required)\n3. People in your household, including yourself (required; whole number 1–12)\n4. Total monthly household income in dollars (required; zero is allowed)\n5. Landlord mailing address (optional; a different person's address)\n6. What help are you requesting? (required)\n7. Do you need access support to complete paperwork? Yes or No (required)\n8. If Yes, describe the access support you prefer (required when Yes)\nCONTACT SLIP\n9. Applicant home address again (required; same address as question 2)\n10. Contact email (optional)`,
  fields: [
    field("full_name", "Your full name", "text", true, "Full name (required)", "applicant.name", "Say the name you want printed on this practice form."),
    field("home_address", "Your home address", "longtext", true, "Applicant home address (required)", "applicant.home_address", "Give your home address. This is separate from the landlord's address."),
    field("household_size", "People in your household", "number", true, "People in your household, including yourself (required; whole number 1–12)", "household.size", "Count yourself and the other people in your household.", { min: 1, max: 12 }),
    field("monthly_income", "Monthly household income", "money", true, "Total monthly household income in dollars (required; zero is allowed)", "household.monthly_income", "Enter the total monthly amount in dollars. Zero is a valid answer.", { min: 0 }),
    field("landlord_address", "Landlord mailing address", "longtext", false, "Landlord mailing address (optional; a different person's address)", "landlord.mailing_address", "This is the landlord's mailing address. It will not change when you correct your own address."),
    field("request", "What help are you requesting?", "longtext", true, "What help are you requesting? (required)", "applicant.request", "Explain what you want to ask for in your own words."),
    field("support", "Do you need access support?", "yesno", true, "Do you need access support to complete paperwork? Yes or No (required)", "applicant.access_support", "Choose Yes or No. The form is asking about help to complete paperwork."),
    field("support_details", "What access support do you prefer?", "longtext", false, "If Yes, describe the access support you prefer (required when Yes)", "applicant.support_details", "For example, you can ask for large print or to have questions read aloud.", { requiredWhen: { fieldId: "support", equals: "Yes" } }),
    field("contact_address", "Your home address on the contact slip", "longtext", true, "Applicant home address again (required; same address as question 2)", "applicant.home_address", "This repeats your home address. A confirmed correction updates both applicant address fields."),
    field("email", "Contact email", "email", false, "Contact email (optional)", "applicant.email", "You may provide an email address, or skip this optional question."),
  ]
};
export const secondForm: FormDefinition = {
  id: "equipment-loan-v1", title: "Community Equipment Loan", fictional: true, linksVerified: true, origin: "prepared", warnings: [],
  sourceText: `FICTIONAL PRACTICE FORM — COMMUNITY EQUIPMENT LOAN\nA fictional community program; this is not a real application.\nA. Borrower's name (required)\nB. Borrower's delivery address (required)\nC. Collection venue address (required; do not use the borrower address)\nD. Item requested (required)\nE. Number of items (required; whole number 1–5)\nF. Requested collection date (required; YYYY-MM-DD)\nRETURN LABEL\nG. Borrower's delivery address again (required; repeat B)\nH. Notes for the coordinator (optional)`,
  fields: [
    field("borrower_name", "Borrower's name", "text", true, "Borrower's name (required)", "borrower.name", "Give the name of the person borrowing the item."),
    field("delivery_address", "Borrower's delivery address", "longtext", true, "Borrower's delivery address (required)", "borrower.delivery_address", "This is the borrower's address, not the collection venue."),
    field("venue_address", "Collection venue address", "longtext", true, "Collection venue address (required; do not use the borrower address)", "venue.address", "Give the place where the item will be collected."),
    field("item", "Item requested", "text", true, "Item requested (required)", "loan.item", "Name the item you would like to borrow."),
    field("quantity", "Number of items", "number", true, "Number of items (required; whole number 1–5)", "loan.quantity", "Choose a whole number from one to five.", { min: 1, max: 5 }),
    field("collection_date", "Requested collection date", "date", true, "Requested collection date (required; YYYY-MM-DD)", "loan.collection_date", "Use year, month and day, such as 2026-11-03."),
    field("return_address", "Borrower's address on the return label", "longtext", true, "Borrower's delivery address again (required; repeat B)", "borrower.delivery_address", "This repeats the borrower address. Confirmed changes update both borrower address fields."),
    field("notes", "Notes for the coordinator", "longtext", false, "Notes for the coordinator (optional)", "loan.notes", "Add any details you want the coordinator to see, or skip."),
  ]
};
