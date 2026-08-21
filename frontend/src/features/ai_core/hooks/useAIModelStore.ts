import { create } from "zustand";

export type SelectionMode = "system" | "manual";

export interface AIModelInfo {
  id: string;
  name: string;
  provider: "gemini" | "openai" | "anthropic" | "groq" | "deepseek" | "elevenlabs" | "deepl" | "huggingface" | "local" | string;
  capabilities: string[];
  speedRating: "ultra-fast" | "fast" | "medium" | "slow";
  badge?: string;
  description?: string;
}

export const SYSTEM_DEFAULT_MODEL = "gemini-3.7-flash";

export const AVAILABLE_AI_MODELS: AIModelInfo[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "gemini",
    capabilities: ["Vision", "Coding", "Agentic", "Deep-Reasoning", "Fast"],
    speedRating: "ultra-fast",
    badge: "Flagship / Recommended",
    description: "Google's most capable Flash model for complex agentic workflows and coding.",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "gemini",
    capabilities: ["Vision", "JSON", "Multimodal", "Fast"],
    speedRating: "ultra-fast",
    description: "Balanced multimodal intelligence for general comic analysis.",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "gemini",
    capabilities: ["Vision", "JSON", "High-Throughput"],
    speedRating: "ultra-fast",
    description: "High-throughput foundational processing for bulk chapters.",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    provider: "gemini",
    capabilities: ["Vision", "Speed-Optimized", "Low-Cost"],
    speedRating: "ultra-fast",
    badge: "Fastest",
    description: "Cost-effective high-throughput model (<180ms latency).",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro (Preview)",
    provider: "gemini",
    capabilities: ["Deep-Reasoning", "2M-Context", "Vibe-Coding", "Vision"],
    speedRating: "medium",
    badge: "2M Context",
    description: "Deep reasoning and massive 2M token context window.",
  },
  {
    id: "gemini-3.1-flash-image",
    name: "Nano Banana 2 (Image)",
    provider: "gemini",
    capabilities: ["Image-Gen", "Diffusion", "Inpainting", "Visual"],
    speedRating: "fast",
    badge: "Visual AI",
    description: "High-efficiency visual creation and panel inpainting.",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    capabilities: ["Vision", "JSON", "Fast", "Long-Context"],
    speedRating: "ultra-fast",
    description: "Google price-performance workhorse model with 1M token context.",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "gemini",
    capabilities: ["Vision", "Complex-Reasoning", "Code", "High-Fidelity"],
    speedRating: "medium",
    description: "Deep narrative reasoning and intricate panel breakdown.",
  },
  {
    id: "deep-research-preview-04-2026",
    name: "Gemini Deep Research",
    provider: "gemini",
    capabilities: ["Agentic", "Multi-Source", "Research", "Synthesis"],
    speedRating: "slow",
    badge: "Agentic",
    description: "Autonomous multi-step research agent across hundreds of sources.",
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
    id: "o3-mini",
    name: "OpenAI o3-mini",
    provider: "openai",
    capabilities: ["Reasoning", "Coding", "Math", "Script"],
    speedRating: "fast",
    badge: "Reasoning",
    description: "OpenAI specialized fast reasoning model.",
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
    id: "llama-3.3-70b-versatile",
    name: "Groq Llama 3.3 70B",
    provider: "groq",
    capabilities: ["Ultra-Fast", "LPU", "Dialogue", "Script"],
    speedRating: "ultra-fast",
    badge: "750 Tok/s",
    description: "Groq ultra-fast 750 tokens/sec inference for real-time script adaptation.",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "deepseek",
    capabilities: ["Deep-Reasoning", "Low-Cost", "Code", "Script"],
    speedRating: "fast",
    badge: "Ultra Low Cost",
    description: "High-performance low-cost general intelligence model.",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "deepseek",
    capabilities: ["Deep-Thinking", "Reasoning", "Math", "Logic"],
    speedRating: "medium",
    badge: "Chain of Thought",
    description: "DeepSeek open reasoning model with explicit chain of thought.",
  },
  {
    id: "eleven_multilingual_v2",
    name: "ElevenLabs Multilingual V2",
    provider: "elevenlabs",
    capabilities: ["Voice", "TTS", "Emotion", "Multilingual"],
    speedRating: "fast",
    badge: "Studio Voice",
    description: "State-of-the-art cinematic emotional voice acting synthesis.",
  },
  {
    id: "deepl-translate",
    name: "DeepL Pro Translation",
    provider: "deepl",
    capabilities: ["Translation", "Localization", "Multi-Language"],
    speedRating: "ultra-fast",
    badge: "Neural Translate",
    description: "Industry standard neural comic dialogue translation and localization.",
  },
  {
    id: "edge-tts-neural",
    name: "Edge TTS Neural",
    provider: "local",
    capabilities: ["Local", "Free", "TTS", "Zero-Cost"],
    speedRating: "ultra-fast",
    badge: "Free Built-In",
    description: "Built-in zero-cost multi-voice narration synthesizer.",
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
  }

  return {
    selectedModel: initialModel,
    selectionMode: initialMode,
    configuredProviders: initialProviders,
    dynamicModels: AVAILABLE_AI_MODELS,

    loadCatalogFromBackend: async () => {
      try {
        const res = await fetch("/api/v1/ai/models");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.models_breakdown)) {
            const mapped: AIModelInfo[] = data.models_breakdown.map((m: any) => ({
              id: m.id,
              name: m.name,
              provider: m.provider,
              capabilities: m.capabilities || ["Text"],
              speedRating: m.speed_rating?.includes("<200ms") ? "ultra-fast" : m.speed_rating?.includes("Deliberate") ? "medium" : "fast",
              badge: m.provider === "gemini" && m.id.includes("3.7") ? "Flagship" : m.speed_rating,
              description: m.category,
            }));
            set({ dynamicModels: mapped });
          }
        }
      } catch {
        // Fallback to static catalog
      }
    },

    refreshConfiguredProviders: () => {
      set({ configuredProviders: getConfiguredProviders() });
    },

    setSelectedModel: (modelId: string, mode: SelectionMode = "manual") => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODEL, modelId);
        localStorage.setItem(STORAGE_KEY_MODE, mode);
        window.dispatchEvent(new CustomEvent("sonikoma_model_changed", { detail: { modelId, mode } }));
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
        window.dispatchEvent(new CustomEvent("sonikoma_model_changed", { detail: { modelId: SYSTEM_DEFAULT_MODEL, mode: "system" } }));
      }
      set({ selectedModel: SYSTEM_DEFAULT_MODEL, selectionMode: "system" });
    },

    getCurrentModelInfo: () => {
      const state = get();
      const allList = state.dynamicModels.length > 0 ? state.dynamicModels : AVAILABLE_AI_MODELS;
      const found = allList.find((m) => m.id === state.selectedModel);
      return (
        found ||
        allList.find((m) => m.id === SYSTEM_DEFAULT_MODEL) ||
        allList[0]
      );
    },

    getAvailableModels: () => {
      const state = get();
      const allList = state.dynamicModels.length > 0 ? state.dynamicModels : AVAILABLE_AI_MODELS;
      return allList;
    },
  };
});
