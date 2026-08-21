import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ChevronDown,
  Check,
  RotateCcw,
  Search,
  Zap,
  Layers,
  Cpu,
  Bot,
  SlidersHorizontal,
} from "lucide-react";
import {
  useAIModelStore,
  AVAILABLE_AI_MODELS,
  AIModelInfo,
  SYSTEM_DEFAULT_MODEL,
} from "@/features/ai_core/hooks/useAIModelStore";

export interface AIModelSelectorProps {
  className?: string;
  compact?: boolean;
  value?: string;
  selectedModel?: string;
  onChange?: (modelId: string) => void;
  fullWidth?: boolean;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  className = "",
  compact = false,
  value,
  selectedModel: propSelectedModel,
  onChange,
  fullWidth = false,
}) => {
  const {
    selectedModel: storeSelectedModel,
    selectionMode,
    configuredProviders,
    loadCatalogFromBackend,
    setSelectedModel,
    resetToSystemDefault,
    getCurrentModelInfo,
    getAvailableModels,
  } = useAIModelStore();

  useEffect(() => {
    loadCatalogFromBackend();
  }, [loadCatalogFromBackend]);

  const activeModelId =
    value !== undefined
      ? value
      : propSelectedModel !== undefined
      ? propSelectedModel
      : storeSelectedModel;

  const currentModel = getCurrentModelInfo();

  const handleSelectModel = (modelId: string) => {
    if (onChange) {
      onChange(modelId);
    }
    setSelectedModel(modelId, "manual");
  };

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Only display models for configured/entered API keys
  const availableModelsForKeys = getAvailableModels();

  const filteredModels = availableModelsForKeys.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.capabilities.some((c) => c.toLowerCase().includes(q))
    );
  });

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "gemini":
        return <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />;
      case "openai":
        return <Bot className="w-3.5 h-3.5 text-emerald-400" />;
      case "anthropic":
        return <Cpu className="w-3.5 h-3.5 text-amber-400" />;
      case "groq":
        return <Zap className="w-3.5 h-3.5 text-orange-400" />;
      case "deepseek":
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      case "elevenlabs":
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      case "deepl":
        return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
      case "huggingface":
        return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "gemini":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded">
            Google
          </span>
        );
      case "openai":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
            OpenAI
          </span>
        );
      case "anthropic":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded">
            Anthropic
          </span>
        );
      case "huggingface":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30 rounded">
            HF Open
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-flex items-center select-none ${className}`} ref={dropdownRef}>
      {/* ── Global Header Pill Selector ─────────────────────────────────── */}
      <div className="inline-flex items-center rounded-lg border border-neutral-800 bg-neutral-900/90 shadow-inner hover:border-neutral-700 transition-all p-0.5 gap-0.5">
        {/* Model Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          title={`Active AI Model: ${currentModel.name} (${selectionMode === "system" ? "System Mode" : "Manual Override"})`}
        >
          {getProviderIcon(currentModel.provider)}
          <span className="truncate max-w-[130px] font-semibold tracking-tight text-neutral-100">
            {currentModel.name}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-purple-400" : ""
            }`}
          />
        </button>

        {/* System / Manual Status Badge */}
        <div
          className={`flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase transition-all ${
            selectionMode === "system"
              ? "bg-purple-950/60 text-purple-300 border border-purple-800/40"
              : "bg-amber-950/60 text-amber-300 border border-amber-800/40"
          }`}
          title={
            selectionMode === "system"
              ? "System Mode: AI Orchestrator selects optimal models dynamically per capability"
              : "Manual Mode: User has explicitly forced a specific AI model"
          }
        >
          {selectionMode === "system" ? "System" : "Manual"}
        </div>
      </div>

      {/* ── Popover Dropdown Menu ────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-84 sm:w-96 rounded-xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
          {/* Header & Reset Action */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800/80 bg-neutral-900/50">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-neutral-200">
                AI Model Orchestration
              </span>
            </div>
            {selectionMode === "manual" && (
              <button
                type="button"
                onClick={() => {
                  resetToSystemDefault();
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded transition-colors"
                title="Reset to automated System mode"
              >
                <RotateCcw className="w-3 h-3" />
                Reset System
              </button>
            )}
          </div>

          {/* Search Filter */}
          <div className="p-2 border-b border-neutral-850">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search models, capabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Models List */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {filteredModels.length === 0 ? (
              <div className="py-6 px-4 text-center">
                {configuredProviders.size === 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-400">
                      No AI provider API keys entered yet.
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Enter your Gemini, OpenAI, Anthropic, or Hugging Face API key to enable models.
                    </p>
                    <a
                      href="/ai-core?tab=api-keys"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      Configure API Keys
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500">
                    No matching models found for your active API keys.
                  </div>
                )}
              </div>
            ) : (
              filteredModels.map((model: AIModelInfo) => {
                const isSelected = activeModelId === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      handleSelectModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start justify-between p-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? "bg-purple-950/40 border border-purple-700/50 text-white"
                        : "hover:bg-neutral-900/80 text-neutral-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="mt-0.5">{getProviderIcon(model.provider)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-neutral-100">
                            {model.name}
                          </span>
                          {getProviderBadge(model.provider)}
                          {model.badge && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        {model.description && (
                          <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                            {model.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {model.capabilities.map((cap) => (
                            <span
                              key={cap}
                              className="px-1.5 py-0.2 text-[9px] bg-neutral-850 text-neutral-400 rounded"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="px-3 py-2 border-t border-neutral-850 bg-neutral-900/30 text-[10px] text-neutral-500 flex items-center justify-between">
            <span>
              Mode:{" "}
              <strong className="text-neutral-300 capitalize">
                {selectionMode}
              </strong>
            </span>
            <span className="text-neutral-500">Sonikoma AI Orchestrator v2.5</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIModelSelector;
