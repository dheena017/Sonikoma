import { create } from "zustand";

export type SelectionMode = "system" | "manual";

export interface AIModelInfo {
  id: string;
  name: string;
  provider:
    | "gemini"
    | "openai"
    | "anthropic"
    | "groq"
    | "deepseek"
    | "elevenlabs"
    | "deepl"
    | "huggingface"
    | "local"
    | string;
  capabilities: string[];
  tags?: string[];
  is_free_tier?: boolean;
  speedRating: "ultra-fast" | "fast" | "medium" | "slow";
  badge?: string;
  description?: string;
}

export const SYSTEM_DEFAULT_MODEL = "gemini-2.5-flash";

let _catalogLoaded = false;
let _isCatalogFetching = false;
let _lastCatalogFetch = 0;

export const AVAILABLE_AI_MODELS: AIModelInfo[] = [];

export const getConfiguredProviders = (): Set<string> => {
  const configured = new Set<string>();
  configured.add("local"); // Local edge-tts and local tools always available

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
  const elevenlabs =
    localStorage.getItem("sonikoma_key_elevenlabs") ||
    localStorage.getItem("user_elevenlabs_key");
  const deepl =
    localStorage.getItem("sonikoma_key_deepl") ||
    localStorage.getItem("user_deepl_key");

  if (gemini && gemini.trim()) configured.add("gemini");
  if (openai && openai.trim()) configured.add("openai");
  if (anthropic && anthropic.trim()) configured.add("anthropic");
  if (huggingface && huggingface.trim()) configured.add("huggingface");
  if (deepseek && deepseek.trim()) configured.add("deepseek");
  if (groq && groq.trim()) configured.add("groq");
  if (elevenlabs && elevenlabs.trim()) configured.add("elevenlabs");
  if (deepl && deepl.trim()) configured.add("deepl");

  // Default fallback: allow gemini
  if (configured.size === 1 && configured.has("local")) {
    configured.add("gemini");
  }

  return configured;
};

interface AIModelState {
  selectedModel: string;
  selectionMode: SelectionMode;
  configuredProviders: Set<string>;
  dynamicModels: AIModelInfo[];
  loadCatalogFromBackend: () => Promise<void>;
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
      if (e.key?.startsWith("sonikoma_key_") || e.key?.startsWith("user_")) {
        handleSync();
      }
    });

    window.addEventListener("sonikoma_api_keys_updated", handleSync);

    // Automatically trigger catalog hydration from backend
    setTimeout(() => {
      get().loadCatalogFromBackend();
    }, 0);
  }

  return {
    selectedModel: initialModel,
    selectionMode: initialMode,
    configuredProviders: initialProviders,
    dynamicModels: [],

    loadCatalogFromBackend: async () => {
      // Prevent duplicate fetches if already loaded recently or currently fetching
      if (_catalogLoaded && Date.now() - _lastCatalogFetch < 30000) return;
      if (_isCatalogFetching) return;
      _isCatalogFetching = true;

      try {
        const res = await fetch("/api/v1/ai/models");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.models_breakdown)) {
            const mapped: AIModelInfo[] = data.models_breakdown.map(
              (m: any) => ({
                id: m.id,
                name: m.name,
                provider: m.provider,
                capabilities: m.capabilities || ["Text"],
                speedRating: m.speed_rating?.includes("<200ms")
                  ? "ultra-fast"
                  : m.speed_rating?.includes("Deliberate")
                  ? "medium"
                  : "fast",
                badge:
                  m.provider === "gemini" && m.id.includes("3.7")
                    ? "Flagship"
                    : m.speed_rating,
                description: m.category,
                tags: m.tags || [],
                is_free_tier: Boolean(m.is_free_tier || m.free_tier === true),
              })
            );
            set({ dynamicModels: mapped });
            _catalogLoaded = true;
            _lastCatalogFetch = Date.now();
          }
        }
      } catch {
        // Fallback
      } finally {
        _isCatalogFetching = false;
      }
    },

    refreshConfiguredProviders: () => {
      set({ configuredProviders: getConfiguredProviders() });
    },

    setSelectedModel: (modelId: string, mode: SelectionMode = "manual") => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODEL, modelId);
        localStorage.setItem(STORAGE_KEY_MODE, mode);
        window.dispatchEvent(
          new CustomEvent("sonikoma_model_changed", {
            detail: { modelId, mode },
          })
        );
      }
      set({ selectedModel: modelId, selectionMode: mode });
    },

    setSelectionMode: (mode: SelectionMode) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODE, mode);
      }
      set({ selectionMode: mode });
    },

    resetToSystemDefault: () => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODEL, SYSTEM_DEFAULT_MODEL);
        localStorage.setItem(STORAGE_KEY_MODE, "system");
        window.dispatchEvent(
          new CustomEvent("sonikoma_model_changed", {
            detail: { modelId: SYSTEM_DEFAULT_MODEL, mode: "system" },
          })
        );
      }
      set({ selectedModel: SYSTEM_DEFAULT_MODEL, selectionMode: "system" });
    },

    getCurrentModelInfo: () => {
      const state = get();
      const allList = state.dynamicModels;
      const found = allList.find((m) => m.id === state.selectedModel);
      if (found) return found;
      const defaultFound = allList.find((m) => m.id === SYSTEM_DEFAULT_MODEL);
      if (defaultFound) return defaultFound;
      if (allList.length > 0) return allList[0];
      return {
        id: state.selectedModel || SYSTEM_DEFAULT_MODEL,
        name: (state.selectedModel || SYSTEM_DEFAULT_MODEL)
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        provider: "gemini",
        capabilities: ["General"],
        speedRating: "fast",
      };
    },

    getAvailableModels: () => {
      const state = get();
      return state.dynamicModels;
    },
  };
});
