import { getChatGPTUser } from "../../chatgpt-auth";
import { handleAssist } from "../../../lib/assist";
import { metaConfiguration } from "../../../lib/meta-configuration";
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  const config = metaConfiguration(process.env);
  return handleAssist(request, { authenticated: !!user, key: config.key, provider: config.provider });
}
