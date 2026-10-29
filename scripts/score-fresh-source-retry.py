"""Score unchanged live receipts against the expectations saved before testing."""
import argparse
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("receipts", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--fixture",type=Path,help="Optional separately frozen authored-case JSON with source and expected_kinds.")
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
fixture = root / "docs/evidence/fresh-repair-visit"
expected = json.loads((fixture / "frozen-expectations.json").read_text())
original = json.loads((fixture / "browser-observations.json").read_text())["actualExtractedPdfSource"]
if args.fixture:
    alternate=json.loads(args.fixture.read_text())
    original=alternate["source"]
    expected={"expected_rows":[{"id":f"line_{index+2}","kind":kind} for index,kind in enumerate(alternate["expected_kinds"])]}
raw_bytes = args.receipts.read_bytes()
export = json.loads(raw_bytes)
receipts = [item for item in export.get("receipts", []) if item.get("task") == "extract"]
if not receipts:
    raise SystemExit("No live extraction receipt exists; no extraction score can be produced.")
receipt = receipts[-1]
calls = receipt.get("calls", [])
if not calls:
    raise SystemExit("No completed model responses exist; no extraction accuracy score can be produced.")
expected_by_id = {row["id"]: row["kind"] for row in expected["expected_rows"]}
by_id = {}
unit_by_id = {}
staged = receipt.get("contract") in ("source-line-types-v7-numeric-stages", "source-line-types-v8-numeric-verification")
unknown_stages = []
duplicates = []
for call in calls:
    source_id = call["sourceId"]
    stage = call.get("stage", "kind")
    target = unit_by_id if staged and stage == "numeric-unit" else by_id
    if staged and stage not in ("kind", "numeric-unit"):
        unknown_stages.append(stage)
    if source_id in target:
        duplicates.append(f"{source_id}:{stage}" if staged else source_id)
    target[source_id] = call
rows = []
needed_units = set()
for source_id, kind in expected_by_id.items():
    call = by_id.get(source_id)
    try:
        actual = json.loads(call["raw"])["kind"] if call else None
        # v6 names the currency unit on the wire; application canonical type
        # remains money. Preserve the exact raw wire value beside this mapping.
        raw_kind = actual
        if receipt.get("contract") == "source-line-types-v6-answer-units" and actual == "dollars":
            actual = "money"
        if staged and actual in ("number", "money"):
            needed_units.add(source_id)
            unit = json.loads(unit_by_id[source_id]["raw"])["unit"] if source_id in unit_by_id else None
            actual = {"dollars":"money", "count":"number"}.get(unit)
    except (ValueError, KeyError):
        actual = raw_kind = None
    rows.append({"source_id": source_id, "expected_kind": kind, "actual_kind": actual,
                 **({"raw_kind": raw_kind} if raw_kind != actual else {}),
                 **({"numeric_unit_raw": unit_by_id[source_id]["raw"]} if staged and source_id in unit_by_id else {}),
                 "matched": actual == kind, "elapsed_ms": call.get("elapsedMs") if call else None})
same_source = receipt.get("input", {}).get("source") == original
unknown = sorted((set(by_id) | set(unit_by_id)) - set(expected_by_id))
expected_model_calls = len(rows) + len(needed_units) if staged else len(rows)
matches = sum(row["matched"] for row in rows)
score = {"scope": "Repeated fictional development case, not a held-out accuracy benchmark or phone study.",
         "model": receipt.get("model"), "revision": receipt.get("revision"),
         "quantization": receipt.get("quantization"), "contract": receipt.get("contract"),
         "raw_receipt_sha256": hashlib.sha256(raw_bytes).hexdigest(),
         "source_pdf_sha256": expected.get("pdf_sha256"),
         "identical_extracted_source": same_source,
         "completed_model_calls": len(calls), "expected_calls": len(rows),
         "matched_types": matches, "rows": rows, "duplicate_source_ids": duplicates,
         "unknown_source_ids": unknown, "application_accepted": receipt.get("accepted"),
         "elapsed_inference_ms": receipt.get("elapsedMs"),
         "all_expected_types": same_source and matches == len(rows) and not duplicates and not unknown and not unknown_stages and len(calls) == expected_model_calls and (not staged or set(unit_by_id) == needed_units),
         "application_error": receipt.get("error"),
         "not_model_outputs": ["title metadata", "source labels", "source pages", "required flags", "repeated-label links"]}
if staged:
    score.update({"source_questions":len(rows), "kind_calls":len(by_id), "numeric_unit_calls":len(unit_by_id),
                  "expected_model_calls":expected_model_calls, "unknown_stages":unknown_stages,
                  "scoring":"Each final question type is independently reconstructed from its raw kind and, for numeric answers, its separate raw unit decision. No oracle repair or assembledFields scoring."})
args.output.write_text(json.dumps(score, indent=2) + "\n")
print(json.dumps({key: score[key] for key in ["model", "identical_extracted_source", "completed_model_calls", "matched_types", "application_accepted", "all_expected_types"]}))
