import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const pairs = [
  ["node_modules/@wllama/wllama/esm/wasm/wllama.wasm", "public/wasm/wllama.wasm"],
  ["node_modules/@wllama/wllama-compat/wasm/wllama.wasm", "public/wasm/compat/wllama.wasm"],
  ["node_modules/@wllama/wllama-compat/wasm/wllama.js", "public/wasm/compat/wllama.js"],
];
for (const [from, to] of pairs) { await mkdir(resolve(to, ".."), { recursive: true }); await copyFile(resolve(from), resolve(to)); }
