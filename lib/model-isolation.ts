// Cross-origin isolation enables the runtime's SharedArrayBuffer CPU threads.
// Assets and model requests still obey the browser's same-origin/CORS checks.
export function withModelIsolation(response: Response): Response {
  const result = new Response(response.body, response);
  result.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  result.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  return result;
}
