import test from "node:test";
import assert from "node:assert/strict";
import { acquireModelLease, withModelLease } from "../lib/local-model-lease.ts";
import type { ModelLocks } from "../lib/local-model-lease.ts";

function lockFixture() {
  let active = false, acquisitions = 0;
  const locks: ModelLocks = { async request(_name, _options, callback) {
    if (active) return callback(null);
    active = true; acquisitions++;
    try { await callback({}); }
    finally { active = false; }
  } };
  return { locks, active: () => active, acquisitions: () => acquisitions };
}

test("an active model prevents another tab from downloading or allocating a second model", async () => {
  const f = lockFixture(), first = await acquireModelLease(f.locks);
  let secondStarted = false;
  await assert.rejects(withModelLease(f.locks, async () => { secondStarted = true; }), /already active in another/);
  assert.equal(secondStarted, false); assert.equal(f.active(), true); assert.equal(f.acquisitions(), 1);
  first.release(); first.release(); await Promise.resolve(); await Promise.resolve();
  const next = await acquireModelLease(f.locks);
  assert.equal(f.acquisitions(), 2); next.release();
});

test("file removal is refused while another model holds the origin lease", async () => {
  const f = lockFixture(), model = await acquireModelLease(f.locks);
  let removed = false;
  await assert.rejects(withModelLease(f.locks, async () => { removed = true; }), /already active in another/);
  assert.equal(removed, false); model.release();
});

test("a failed storage action releases the lease so a later attempt can proceed", async () => {
  const f = lockFixture();
  await assert.rejects(withModelLease(f.locks, async () => { throw new Error("Storage denied"); }), /Storage denied/);
  assert.equal(f.active(), false);
  assert.equal(await withModelLease(f.locks, async () => "ready"), "ready");
});

test("unavailable or denied lock access fails before any model or storage action", async () => {
  let started = false;
  await assert.rejects(withModelLease(undefined, async () => { started = true; }), /cannot coordinate/);
  await assert.rejects(acquireModelLease({ request() { throw new DOMException("Denied", "SecurityError"); } }), /Denied/);
  assert.equal(started, false);
});
