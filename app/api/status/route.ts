import { metaConfiguration } from "../../../lib/meta-configuration";
export async function GET() {
  const config = metaConfiguration(process.env);
  return Response.json({ configured: config.configured, provider: config.label, model: config.model, freeOnly: true, liveTested: false }, { headers: { "Cache-Control": "no-store" } });
}
