import { create } from "zustand";

export type SelectionMode = "system" | "manual";

export interface AIModelInfo {
  id: string;
  name: string;
  provider: "gemini" | "openai" | "anthropic" | "huggingface" | "local";
  capabilities: string[];
  speedRating: "ultra-fast" | "fast" | "medium" | "slow";
  badge?: string;
  description?: string;
}

export const SYSTEM_DEFAULT_MODEL = "gemini-2.5-flash";

export const AVAILABLE_AI_MODELS: AIModelInfo[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    capabilities: ["Vision", "JSON", "Fast", "Long-Context"],
    speedRating: "ultra-fast",
    badge: "Recommended",
    description: "Google's ultra-fast multimodal model with 1M token context.",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    capabilities: ["Vision", "Complex-Reasoning", "Code", "High-Fidelity"],
    speedRating: "medium",
    description: "Deep narrative reasoning and intricate panel breakdown.",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    capabilities: ["Vision", "JSON", "High-Throughput"],
    speedRating: "ultra-fast",
    description: "High-throughput fallback for fast storyboarding.",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    capabilities: ["Vision", "Dialogue", "Reasoning"],
    speedRating: "fast",
    description: "OpenAI flagship omni-model for expressive script dramatization.",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    capabilities: ["Fast", "Dialogue", "JSON"],
    speedRating: "ultra-fast",
    description: "Cost-efficient lightweight model for fast metadata & SEO.",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    capabilities: ["Vision", "Creative-Writing", "Nuance"],
    speedRating: "fast",
    description: "Anthropic's leading model for sophisticated comic storytelling.",
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    capabilities: ["Fast", "Narrative", "JSON"],
    speedRating: "ultra-fast",
    description: "Rapid latency-optimized script generation.",
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B Instruct",
    provider: "huggingface",
    capabilities: ["Open-Weights", "Script", "Low-Cost"],
    speedRating: "fast",
    description: "Efficient open-weights instruction model via Hugging Face.",
  },
  {
    id: "FLUX.1-schnell",
    name: "FLUX.1 Schnell",
    provider: "huggingface",
    capabilities: ["Image-Gen", "Diffusion", "4-Step"],
    speedRating: "fast",
    description: "Fast 4-step image synthesis for thumbnail and panel art.",
  },
];

export const getConfiguredProviders = (): Set<string> => {
  const configured = new Set<string>();
  if (typeof window === "undefined") {
    configured.add("gemini");
    return configured;
  }

  // Check LocalStorage API Keys
  const gemini =
    localStorage.getItem("sonikoma_key_gemini") ||
    localStorage.getItem("user_gemini_key");
  const openai =
    localStorage.getItem("sonikoma_key_openai") ||
    localStorage.getItem("user_openai_key");
  const anthropic =
    localStorage.getItem("sonikoma_key_anthropic") ||
    localStorage.getItem("user_anthropic_key");
  const huggingface =
    localStorage.getItem("sonikoma_key_huggingface") ||
    localStorage.getItem("user_huggingface_key");
  const deepseek =
    localStorage.getItem("sonikoma_key_deepseek") ||
    localStorage.getItem("user_deepseek_key");
  const groq =
    localStorage.getItem("sonikoma_key_groq") ||
    localStorage.getItem("user_groq_key");

  if (gemini && gemini.trim()) configured.add("gemini");
  if (openai && openai.trim()) configured.add("openai");
  if (anthropic && anthropic.trim()) configured.add("anthropic");
  if (huggingface && huggingface.trim()) configured.add("huggingface");
  if (deepseek && deepseek.trim()) configured.add("deepseek");
  if (groq && groq.trim()) configured.add("groq");

  return configured;
};

interface AIModelState {
  selectedModel: string;
  selectionMode: SelectionMode;
  configuredProviders: Set<string>;
  refreshConfiguredProviders: () => void;
  setSelectedModel: (modelId: string, mode?: SelectionMode) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  resetToSystemDefault: () => void;
  getCurrentModelInfo: () => AIModelInfo;
  getAvailableModels: () => AIModelInfo[];
}

const STORAGE_KEY_MODEL = "sonikoma_selected_model";
const STORAGE_KEY_MODE = "sonikoma_model_selection_mode";

export const useAIModelStore = create<AIModelState>((set, get) => {
  // Initialize from storage or defaults
  const initialModel =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY_MODEL) || SYSTEM_DEFAULT_MODEL
      : SYSTEM_DEFAULT_MODEL;

  const initialMode =
    typeof window !== "undefined"
      ? (localStorage.getItem(STORAGE_KEY_MODE) as SelectionMode) || "system"
      : "system";

  const initialProviders = getConfiguredProviders();

  // Listen for storage and API key update events across browser tabs
  if (typeof window !== "undefined") {
    const handleSync = () => {
      set({ configuredProviders: getConfiguredProviders() });
    };

    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY_MODEL && e.newValue) {
        set({ selectedModel: e.newValue });
      }
      if (e.key === STORAGE_KEY_MODE && e.newValue) {
        set({ selectionMode: e.newValue as SelectionMode });
      }
      if (e.key && e.key.startsWith("sonikoma_key_")) {
        handleSync();
      }
    });

    window.addEventListener("api-key-updated", handleSync);
    window.addEventListener("sonikoma-keys-updated", handleSync);

    // Sync system default model from backend routing configuration
    fetch("/api/ai/models/routing")
      .then((res) => res.json())
      .then((data) => {
        if (
          data.routing?.vision_narration?.primary &&
          !localStorage.getItem(STORAGE_KEY_MODEL)
        ) {
          set({ selectedModel: data.routing.vision_narration.primary });
        }
      })
      .catch(() => {});
  }

  return {
    selectedModel: initialModel,
    selectionMode: initialMode,
    configuredProviders: initialProviders,

    refreshConfiguredProviders: () => {
      set({ configuredProviders: getConfiguredProviders() });
    },

    setSelectedModel: (modelId: string, mode: SelectionMode = "manual") => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODEL, modelId);
        localStorage.setItem(STORAGE_KEY_MODE, mode);
        window.dispatchEvent(
          new CustomEvent("ai-model-changed", {
            detail: { model: modelId, mode },
          })
        );
      }
      set({ selectedModel: modelId, selectionMode: mode });
    },

    setSelectionMode: (mode: SelectionMode) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODE, mode);
        window.dispatchEvent(
          new CustomEvent("ai-model-changed", {
            detail: { model: get().selectedModel, mode },
          })
        );
      }
      set({ selectionMode: mode });
    },

    resetToSystemDefault: () => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODEL, SYSTEM_DEFAULT_MODEL);
        localStorage.setItem(STORAGE_KEY_MODE, "system");
        window.dispatchEvent(
          new CustomEvent("ai-model-changed", {
            detail: { model: SYSTEM_DEFAULT_MODEL, mode: "system" },
          })
        );
      }
      set({ selectedModel: SYSTEM_DEFAULT_MODEL, selectionMode: "system" });
    },

    getAvailableModels: () => {
      const providers = get().configuredProviders;
      // If user has entered keys, strictly show ONLY models for entered keys!
      if (providers.size > 0) {
        return AVAILABLE_AI_MODELS.filter((m) => providers.has(m.provider));
      }
      // If no keys configured yet, return empty list so prompt to add key is shown
      return [];
    },

    getCurrentModelInfo: () => {
      const currentId = get().selectedModel;
      const found = AVAILABLE_AI_MODELS.find((m) => m.id === currentId);
      if (found) return found;
      return {
        id: currentId,
        name: currentId.replace(/^(models\/|google\/|openai\/)/, ""),
        provider: currentId.includes("gpt")
          ? "openai"
          : currentId.includes("claude")
          ? "anthropic"
          : currentId.includes("flux") || currentId.includes("/")
          ? "huggingface"
          : "gemini",
        capabilities: ["Custom-Model"],
        speedRating: "fast",
      };
    },
  };
});
