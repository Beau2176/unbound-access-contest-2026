"""Score unchanged live receipts against the expectations saved before testing."""
import argparse
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("receipts", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
fixture = root / "docs/evidence/fresh-repair-visit"
expected = json.loads((fixture / "frozen-expectations.json").read_text())
original = json.loads((fixture / "browser-observations.json").read_text())["actualExtractedPdfSource"]
raw_bytes = args.receipts.read_bytes()
export = json.loads(raw_bytes)
receipts = [item for item in export.get("receipts", []) if item.get("task") == "extract"]
if not receipts:
    raise SystemExit("No live extraction receipt exists; no extraction score can be produced.")
receipt = receipts[-1]
calls = receipt.get("calls", [])
expected_by_id = {row["id"]: row["kind"] for row in expected["expected_rows"]}
by_id = {}
duplicates = []
for call in calls:
    source_id = call["sourceId"]
    if source_id in by_id:
        duplicates.append(source_id)
    by_id[source_id] = call
rows = []
for source_id, kind in expected_by_id.items():
    call = by_id.get(source_id)
    try:
        actual = json.loads(call["raw"])["kind"] if call else None
    except (ValueError, KeyError):
        actual = None
    rows.append({"source_id": source_id, "expected_kind": kind, "actual_kind": actual,
                 "matched": actual == kind, "elapsed_ms": call.get("elapsedMs") if call else None})
same_source = receipt.get("input", {}).get("source") == original
unknown = sorted(set(by_id) - set(expected_by_id))
matches = sum(row["matched"] for row in rows)
score = {"scope": "Repeated fictional development case, not a held-out accuracy benchmark or phone study.",
         "model": receipt.get("model"), "revision": receipt.get("revision"),
         "quantization": receipt.get("quantization"), "contract": receipt.get("contract"),
         "raw_receipt_sha256": hashlib.sha256(raw_bytes).hexdigest(),
         "source_pdf_sha256": expected["pdf_sha256"],
         "identical_extracted_source": same_source,
         "completed_model_calls": len(calls), "expected_calls": len(rows),
         "matched_types": matches, "rows": rows, "duplicate_source_ids": duplicates,
         "unknown_source_ids": unknown, "application_accepted": receipt.get("accepted"),
         "elapsed_inference_ms": receipt.get("elapsedMs"),
         "all_expected_types": same_source and matches == len(rows) and not duplicates and not unknown and len(calls) == len(rows),
         "application_error": receipt.get("error"),
         "not_model_outputs": ["title metadata", "source labels", "source pages", "required flags", "repeated-label links"]}
args.output.write_text(json.dumps(score, indent=2) + "\n")
print(json.dumps({key: score[key] for key in ["model", "identical_extracted_source", "completed_model_calls", "matched_types", "application_accepted", "all_expected_types"]}))
