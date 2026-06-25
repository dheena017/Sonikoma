import { useState, useEffect, useCallback } from "react";
import { AIModel, AI_MODELS as FALLBACK_MODELS } from "../models";

let cachedModels: AIModel[] | null = null;
let isFetching = false;
let fetchPromise: Promise<AIModel[]> | null = null;

export function useAIModels() {
  const [models, setModels] = useState<AIModel[]>(
    cachedModels || FALLBACK_MODELS
  );
  const [loading, setLoading] = useState<boolean>(!cachedModels);

  const fetchAllModels = useCallback(async (force = false) => {
    if (!force && cachedModels) {
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
        // Collect custom credentials headers from local storage (BYOK)
        const reqHeaders: Record<string, string> = {};
        const gemini = localStorage.getItem("user_gemini_key");
        const openai = localStorage.getItem("user_openai_key");
        const anthropic = localStorage.getItem("user_anthropic_key");
        const huggingface = localStorage.getItem("user_huggingface_key");
        
        if (gemini) reqHeaders["X-User-Gemini-Key"] = gemini;
        if (openai) reqHeaders["X-User-OpenAI-Key"] = openai;
        if (anthropic) reqHeaders["X-User-Anthropic-Key"] = anthropic;
        if (huggingface) reqHeaders["X-User-HuggingFace-Key"] = huggingface;

        // 1. Fetch backend health to see which API keys are available
        const healthRes = await fetch("/api/health", { headers: reqHeaders });
        if (!healthRes.ok) throw new Error("Health check failed");
        const healthData = await healthRes.json();
        const env = healthData.env || {};

        // Check if any keys are configured (either in backend env or local browser storage)
        const availableProviders = [];
        if (env.GEMINI_API_KEY || gemini) availableProviders.push("gemini");
        if (env.HUGGINGFACE_API_KEY || huggingface) availableProviders.push("huggingface");
        if (env.OPENAI_API_KEY || openai) availableProviders.push("openai");
        if (env.ANTHROPIC_API_KEY || anthropic) availableProviders.push("anthropic");

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
              headers: { 
                "Content-Type": "application/json",
                ...reqHeaders
              },
              body: JSON.stringify({ provider }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.models) {
                let providerFriendly = "Google";
                if (provider === "huggingface")
                  providerFriendly = "Hugging Face";
                else if (provider === "openai") providerFriendly = "OpenAI";
                else if (provider === "anthropic")
                  providerFriendly = "Anthropic";

                const mapped = data.models.map((m: any) => ({
                  id: m.name,
                  name: m.displayName || m.name,
                  type: provider === "huggingface" ? "open-source" : "paid",
                  provider: providerFriendly,
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
  }, []);

  useEffect(() => {
    fetchAllModels();
  }, [fetchAllModels]);

  const refetchModels = async () => {
    cachedModels = null;
    await fetchAllModels(true);
  };

  return { models, loading, refetchModels };
}
