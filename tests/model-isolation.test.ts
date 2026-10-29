import test from "node:test";
import assert from "node:assert/strict";
import { withModelIsolation } from "../lib/model-isolation.ts";

test("CPU-thread isolation preserves response data, status and unrelated headers",async()=>{
  const input=new Response("unchanged asset",{status:206,headers:{"Content-Type":"text/plain","Content-Range":"bytes 0-14/15","Cache-Control":"private"}});
  const result=withModelIsolation(input);
  assert.equal(result.status,206);assert.equal(await result.text(),"unchanged asset");
  assert.equal(result.headers.get("Cross-Origin-Opener-Policy"),"same-origin");
  assert.equal(result.headers.get("Cross-Origin-Embedder-Policy"),"require-corp");
  assert.equal(result.headers.get("Content-Range"),"bytes 0-14/15");
  assert.equal(result.headers.get("Cache-Control"),"private");
});
