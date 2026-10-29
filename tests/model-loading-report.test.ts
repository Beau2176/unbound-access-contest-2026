import test from "node:test";
import assert from "node:assert/strict";
import { boundLoadEvents, recoverLoadReports } from "../lib/model-loading-report.ts";
import type { LoadEvent } from "../lib/model-loading-report.ts";
const events:LoadEvent[]=Array.from({length:600},(_,index)=>({elapsedMs:index,stage:"loading",detail:`read-${index}`}));
const report={at:"2026-10-29T05:00:00Z",model:"Fictional model test",revision:"test-only",outcome:"interrupted",elapsedMs:600,events};
test("many successful file reads cannot erase the interrupted load report on reload",()=>{
  const saved=recoverLoadReports(JSON.stringify([report]));
  assert.equal(saved.length,1);assert.equal(saved[0].events.length,160);
  assert.equal(saved[0].events[0].detail,"read-0");assert.equal(saved[0].events[19].detail,"read-19");
  assert.equal(saved[0].events.at(-1)?.detail,"read-599");
  assert.deepEqual(saved,recoverLoadReports(JSON.stringify(saved)));
});
test("bounded loading checkpoints keep the initial stages and newest failure without modifying the original events",()=>{
  const bounded=boundLoadEvents(events);assert.equal(events.length,600);assert.equal(bounded.length,160);
  bounded.push({stage:"loading",detail:"file-read-error",elapsedMs:601});
  assert.equal(boundLoadEvents(bounded).at(-1)?.detail,"file-read-error");
});
test("malformed or oversized loading diagnostics are ignored without hiding other valid reports",()=>{
  assert.deepEqual(recoverLoadReports("{broken"),[]);assert.deepEqual(recoverLoadReports(" ".repeat(1000001)),[]);
  const saved=recoverLoadReports(JSON.stringify([{...report,events:[null]},{...report,events:[{stage:"wrong",elapsedMs:0}]},report]));
  assert.equal(saved.length,1);assert.equal(saved[0].events.length,160);
});
