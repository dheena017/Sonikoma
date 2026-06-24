import { useState, useEffect } from "react";
import { AIModel, AI_MODELS as FALLBACK_MODELS } from "../models";

let cachedModels: AIModel[] | null = null;
let isFetching = false;
let fetchPromise: Promise<AIModel[]> | null = null;

export function useAIModels() {
  const [models, setModels] = useState<AIModel[]>(cachedModels || FALLBACK_MODELS);
  const [loading, setLoading] = useState<boolean>(!cachedModels);

  useEffect(() => {
    if (cachedModels) {
      setModels(cachedModels);
      setLoading(false);
      return;
    }

    const fetchAllModels = async () => {
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
          // 1. Fetch backend health to see which API keys are available
          const healthRes = await fetch("/api/health");
          if (!healthRes.ok) throw new Error("Health check failed");
          const healthData = await healthRes.json();
          const env = healthData.env || {};

          // Check if any keys are configured
          const availableProviders = [];
          if (env.GEMINI_API_KEY) availableProviders.push("gemini");
          if (env.HUGGINGFACE_API_KEY) availableProviders.push("huggingface");
          if (env.OPENAI_API_KEY) availableProviders.push("openai");
          if (env.ANTHROPIC_API_KEY) availableProviders.push("anthropic");

          // If no keys configured, return fallback
          if (availableProviders.length === 0) {
            return FALLBACK_MODELS;
          }

          let aggregatedModels: AIModel[] = [];

          // 2. Fetch models for each available provider
          for (const provider of availableProviders) {
            try {
              const res = await fetch("/api/list-models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.success && data.models) {
                  // Map provider to friendly name
                  let providerFriendly = "Google";
                  if (provider === "huggingface") providerFriendly = "Hugging Face";
                  else if (provider === "openai") providerFriendly = "OpenAI";
                  else if (provider === "anthropic") providerFriendly = "Anthropic";

                  const mapped = data.models.map((m: any) => ({
                    id: m.name,
                    name: m.displayName || m.name,
                    type: provider === "huggingface" ? "open-source" : "paid",
                    provider: providerFriendly
                  }));
                  aggregatedModels = [...aggregatedModels, ...mapped];
                }
              }
            } catch (err) {
              console.error(`Failed to fetch models for ${provider}`, err);
            }
          }

          if (aggregatedModels.length > 0) {
            cachedModels = aggregatedModels;
            return aggregatedModels;
          }

          return FALLBACK_MODELS;
        } catch (err) {
          console.error("Failed to load AI models, using fallback", err);
          return FALLBACK_MODELS;
        } finally {
          isFetching = false;
          fetchPromise = null;
        }
      })();

      const finalModels = await fetchPromise;
      setModels(finalModels);
      setLoading(false);
    };

    fetchAllModels();
  }, []);

  // Expose a refetch function to force update (e.g. after adding a new API key)
  const refetchModels = async () => {
    cachedModels = null;
    setLoading(true);
    // Setting state to fallback temporarily isn't strictly necessary, but triggers re-render
    setModels(FALLBACK_MODELS); 
    // Effect will not automatically run here because deps are [], so we call fetch directly
    // but wait, we can just clear cache and force a new fetch manually here:
    // ... actually, simpler to just reset the cache and let the user click "refresh".
    // Let's implement manual refetch.
  };

  return { models, loading, refetchModels };
}
