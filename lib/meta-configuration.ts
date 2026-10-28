import { FREE_META_MODEL } from "./meta.ts";
import { NVIDIA_META_MODEL } from "./nvidia.ts";
export function metaConfiguration(env: Record<string, string | undefined>) {
  const provider = env.META_PROVIDER ?? "nvidia";
  if (provider === "nvidia") return { provider, label: "NVIDIA API Catalog", model: NVIDIA_META_MODEL, key: env.NVIDIA_API_KEY, configured: !!env.NVIDIA_API_KEY } as const;
  if (provider === "openrouter") return { provider, label: "OpenRouter", model: FREE_META_MODEL, key: env.OPENROUTER_API_KEY, configured: !!env.OPENROUTER_API_KEY } as const;
  return { provider: "unavailable", label: "No AI provider", model: null, key: undefined, configured: false } as const;
}
