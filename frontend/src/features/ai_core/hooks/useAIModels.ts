import { useState, useEffect, useCallback, useMemo } from "react";
import { AIModel, AI_MODELS as FALLBACK_MODELS } from "@/types/models";
import * as api from "@/api/index";

let cachedModels: AIModel[] | null = null;
let isFetching = false;
let fetchPromise: Promise<AIModel[]> | null = null;

export function useAIModels() {
  const [models, setModels] = useState<AIModel[]>(
    cachedModels || FALLBACK_MODELS
  );
  const [loading, setLoading] = useState<boolean>(!cachedModels);

  const fetchAllModels = useCallback(async (force = false) => {
    if (!force && cachedModels && cachedModels.length > 0) {
      setModels(cachedModels);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isFetching && fetchPromise) {
      try {
        const m = await fetchPromise;
        setModels(m);
      } catch (e) {
        console.error("Error waiting for AI models fetch", e);
      } finally {
        setLoading(false);
      }
      return;
    }

    isFetching = true;
    fetchPromise = (async () => {
      try {
        // 1. Collect custom credentials headers from local storage (BYOK)
        const reqHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const sonikoma_token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token");
        if (sonikoma_token)
          reqHeaders["Authorization"] = `Bearer ${sonikoma_token}`;

        const gemini =
          localStorage.getItem("user_gemini_key") ||
          localStorage.getItem("sonikoma_key_gemini") ||
          "";
        const openai =
          localStorage.getItem("user_openai_key") ||
          localStorage.getItem("sonikoma_key_openai") ||
          "";
        const anthropic =
          localStorage.getItem("user_anthropic_key") ||
          localStorage.getItem("sonikoma_key_anthropic") ||
          "";
        const huggingface =
          localStorage.getItem("user_huggingface_key") ||
          localStorage.getItem("sonikoma_key_huggingface") ||
          "";

        if (gemini) reqHeaders["X-User-Gemini-Key"] = gemini;
        if (openai) reqHeaders["X-User-OpenAI-Key"] = openai;
        if (anthropic) reqHeaders["X-User-Anthropic-Key"] = anthropic;
        if (huggingface) reqHeaders["X-User-HuggingFace-Key"] = huggingface;

        // 2. Fetch backend health to see which backend env keys are active
        let env: Record<string, boolean> = {};
        try {
          const healthData = await api.checkHealth();
          env = healthData.env || {};
        } catch {
          // fallback
        }

        const availableProviders: { id: string; name: string; key?: string }[] = [];
        if (gemini || env.GEMINI_API_KEY) {
          availableProviders.push({ id: "gemini", name: "Google", key: gemini || undefined });
        }
        if (openai || env.OPENAI_API_KEY) {
          availableProviders.push({ id: "openai", name: "OpenAI", key: openai || undefined });
        }
        if (anthropic || env.ANTHROPIC_API_KEY) {
          availableProviders.push({ id: "anthropic", name: "Anthropic", key: anthropic || undefined });
        }
        if (huggingface || env.HUGGINGFACE_API_KEY) {
          availableProviders.push({ id: "huggingface", name: "Hugging Face", key: huggingface || undefined });
        }

        // If user has not configured any keys for any provider, return empty list
        if (availableProviders.length === 0) {
          cachedModels = [];
          return [];
        }

        // 3. Query the live API only for configured providers
        let aggregatedLiveModels: AIModel[] = [];

        for (const provider of availableProviders) {
          try {
            const res = await fetch("/api/list-models", {
              method: "POST",
              headers: reqHeaders,
              body: JSON.stringify({
                provider: provider.id,
                apiKey: provider.key,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.success && Array.isArray(data.models) && data.models.length > 0) {
                const liveMapped: AIModel[] = data.models
                  .filter((m: any) => {
                    const name = (m.name || "").toLowerCase();
                    // Exclude raw embeddings or internal experimental models
                    if (name.includes("embedding") || name.includes("bimodal") || name.includes("aqa")) {
                      return false;
                    }
                    return true;
                  })
                  .map((m: any) => ({
                    id: m.name,
                    name: m.displayName || m.name,
                    type: provider.id === "huggingface" ? ("open-source" as const) : ("paid" as const),
                    provider: provider.name,
                    category: m.category || (provider.id === "gemini" ? "Vision & Multimodal" : "Text & Reasoning"),
                    context_window: m.inputTokenLimit || (m.name.includes("pro") ? 2097152 : 1048576),
                    max_output_tokens: m.outputTokenLimit || 8192,
                    speed_rating: m.name.includes("flash") || m.name.includes("mini") ? "Ultra Fast (<300ms)" : "Standard",
                    capabilities: m.name.includes("flash") || m.name.includes("pro") || m.name.includes("4o") || m.name.includes("vision") || m.name.includes("sonnet")
                      ? ["vision", "json_mode", "streaming"]
                      : ["json_mode", "streaming"],
                  }));

                aggregatedLiveModels = [...aggregatedLiveModels, ...liveMapped];
              }
            }
          } catch (err) {
            console.warn(`Failed to dynamically list models for ${provider.id}`, err);
          }
        }

        cachedModels = aggregatedLiveModels;
        return aggregatedLiveModels;
      } catch (err) {
        console.error("Failed to load live AI models for entered API keys", err);
        return [];
      } finally {
        isFetching = false;
        fetchPromise = null;
      }
    })();

    const finalModels = await fetchPromise;
    setModels(finalModels);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllModels();

    const handleKeysUpdated = () => {
      cachedModels = null;
      fetchAllModels(true);
    };

    window.addEventListener("sonikoma-keys-updated", handleKeysUpdated);
    window.addEventListener("storage", handleKeysUpdated);

    return () => {
      window.removeEventListener("sonikoma-keys-updated", handleKeysUpdated);
      window.removeEventListener("storage", handleKeysUpdated);
    };
  }, [fetchAllModels]);

  const refetchModels = async () => {
    cachedModels = null;
    await fetchAllModels(true);
  };

  const visionModels = useMemo(
    () => models.filter((m) => m.capabilities?.includes("vision") || m.id.includes("flash") || m.id.includes("pro") || m.id.includes("4o") || m.id.includes("sonnet")),
    [models]
  );

  const textModels = useMemo(
    () => models.filter((m) => !m.capabilities?.includes("high_res_image")),
    [models]
  );

  const modelsByProvider = useMemo(() => {
    const map: Record<string, AIModel[]> = {};
    for (const m of models) {
      const p = m.provider || "Other";
      if (!map[p]) map[p] = [];
      map[p].push(m);
    }
    return map;
  }, [models]);

  return {
    models,
    loading,
    refetchModels,
    visionModels,
    textModels,
    modelsByProvider,
  };
}
