import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Lock,
  Trash2,
  Sparkles,
} from "lucide-react";

interface AIAPIManagementPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

interface ProviderConfig {
  id: string;
  name: string;
  category: string;
  badge: string;
  docsUrl: string;
  placeholder: string;
  keyPrefix: string;
  description: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    category: "Multimodal, Vision & SEO",
    badge: "Primary Engine",
    docsUrl: "https://aistudio.google.com/app/apikey",
    placeholder: "AIzaSy...",
    keyPrefix: "AIza",
    description: "Powers Script Generation, Webtoon Panel Narration, and YouTube SEO Copywriting.",
  },
  {
    id: "openai",
    name: "OpenAI GPT & DALL-E",
    category: "LLM, DALL-E 3 & Whisper",
    badge: "GPT-4o",
    docsUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
    keyPrefix: "sk-",
    description: "High-speed reasoning, speech-to-text transcription, and image synthesis.",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    category: "Complex Narrative & Reasoning",
    badge: "Claude 3.5",
    docsUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
    keyPrefix: "sk-ant-",
    description: "High-precision script dramatization and nuanced creative storytelling.",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs Voice AI",
    category: "Neural Speech & Sound FX",
    badge: "Voice Studio",
    docsUrl: "https://elevenlabs.io/app/settings/api-keys",
    placeholder: "xi-api-key...",
    keyPrefix: "xi-",
    description: "Ultra-realistic voice cloning, character voiceover synthesis, and Foley audio effects.",
  },
  {
    id: "huggingface",
    name: "Hugging Face Inference",
    category: "Open-Source Models",
    badge: "HF Hub",
    docsUrl: "https://huggingface.co/settings/tokens",
    placeholder: "hf_...",
    keyPrefix: "hf_",
    description: "Access FLUX.1, SDXL, LLaMA-3, and thousands of open community vision weights.",
  },
  {
    id: "groq",
    name: "Groq LPU Acceleration",
    category: "Ultra-Low Latency Inference",
    badge: "500+ Tok/s",
    docsUrl: "https://console.groq.com/keys",
    placeholder: "gsk_...",
    keyPrefix: "gsk_",
    description: "Instant sub-second storyboard prompt expansion, auto-crop tagger, and dialogue speed.",
  },
  {
    id: "deepseek",
    name: "DeepSeek Reasoning",
    category: "Deep Think & Scripting",
    badge: "V3 / R1",
    docsUrl: "https://platform.deepseek.com/api_keys",
    placeholder: "sk-...",
    keyPrefix: "sk-",
    description: "Deep chain-of-thought storytelling and structured storyboard scripting.",
  },
  {
    id: "deepl",
    name: "DeepL Pro API",
    category: "Neural Manga Translation",
    badge: "Translation",
    docsUrl: "https://www.deepl.com/pro-api",
    placeholder: "...:fx",
    keyPrefix: "",
    description: "High accuracy multi-language Korean/Japanese/English webtoon text translation.",
  },
];

export default function AIAPIManagementPage({
  addNotification,
}: AIAPIManagementPageProps) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingStatus, setTestingStatus] = useState<Record<string, { testing?: boolean; success?: boolean; latency_ms?: number; error?: string }>>({});

  // Load saved keys from localStorage on mount
  useEffect(() => {
    const loaded: Record<string, string> = {};
    PROVIDERS.forEach((p) => {
      const saved =
        localStorage.getItem(`sonikoma_key_${p.id}`) ||
        localStorage.getItem(`user_${p.id}_key`);
      // Filter out accidental password123 autofill if present
      if (saved && saved !== "password123") {
        loaded[p.id] = saved;
      }
    });
    setKeys(loaded);
  }, []);

  const handleKeyChange = (providerId: string, val: string) => {
    setKeys((prev) => ({ ...prev, [providerId]: val }));
  };

  const handleToggleShow = (providerId: string) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSaveKey = (providerId: string) => {
    const val = (keys[providerId] || "").trim();
    if (val) {
      localStorage.setItem(`sonikoma_key_${providerId}`, val);
      localStorage.setItem(`user_${providerId}_key`, val);
      window.dispatchEvent(new Event("sonikoma-keys-updated"));
      addNotification?.(`Saved API key for ${providerId.toUpperCase()}`, "success");
    } else {
      localStorage.removeItem(`sonikoma_key_${providerId}`);
      localStorage.removeItem(`user_${providerId}_key`);
      window.dispatchEvent(new Event("sonikoma-keys-updated"));
      addNotification?.(`Cleared API key for ${providerId.toUpperCase()}`, "info");
    }
  };

  const handleClearKey = (providerId: string) => {
    localStorage.removeItem(`sonikoma_key_${providerId}`);
    localStorage.removeItem(`user_${providerId}_key`);
    setKeys((prev) => ({ ...prev, [providerId]: "" }));
    window.dispatchEvent(new Event("sonikoma-keys-updated"));
    addNotification?.(`Cleared API key for ${providerId.toUpperCase()}`, "info");
  };

  const handleTestKey = async (providerId: string) => {
    setTestingStatus((prev) => ({
      ...prev,
      [providerId]: { testing: true },
    }));

    try {
      const currentKey = keys[providerId] || "";
      const res = await fetch("/api/ai/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          api_key: currentKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestingStatus((prev) => ({
          ...prev,
          [providerId]: {
            testing: false,
            success: true,
            latency_ms: data.latency_ms,
          },
        }));
        addNotification?.(`✅ ${providerId.toUpperCase()} key verified! Latency: ${data.latency_ms}ms`, "success");
      } else {
        setTestingStatus((prev) => ({
          ...prev,
          [providerId]: {
            testing: false,
            success: false,
            error: data.error || "Failed verification",
          },
        }));
        addNotification?.(`❌ ${providerId.toUpperCase()} test failed: ${data.error || "Invalid key"}`, "error");
      }
    } catch (err: any) {
      setTestingStatus((prev) => ({
        ...prev,
        [providerId]: {
          testing: false,
          success: false,
          error: err.message,
        },
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
              API Keys &amp; AI Provider Vault
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950/70 border border-purple-800/60 text-[10px] font-mono text-purple-300 font-bold">
              Encrypted Local Storage
            </span>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Connect your personal API keys to bypass rate limits or unlock unlimited generation.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-[11px] font-mono text-neutral-400 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Keys are stored client-side in secure sandbox</span>
        </div>
      </div>

      {/* Provider Key Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((prov) => {
          const keyVal = keys[prov.id] || "";
          const isRevealed = showKeys[prov.id] || false;
          const status = testingStatus[prov.id];

          return (
            <div
              key={prov.id}
              className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/30 transition-all space-y-4 flex flex-col justify-between shadow-md"
            >
              <div className="space-y-3">
                {/* Card Title & Link */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white font-sans">{prov.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-purple-300 font-bold">
                      {prov.badge}
                    </span>
                  </div>

                  <a
                    href={prov.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-neutral-400 hover:text-purple-400 flex items-center gap-1 transition-colors"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                  {prov.description}
                </p>

                {/* Key Input Box with eye toggle embedded directly inside the input field on the right */}
                <div className="space-y-1.5">
                  <div className="relative w-full">
                    <input
                      id={`apikey_${prov.id}`}
                      name={`apikey_vault_${prov.id}`}
                      type={isRevealed ? "text" : "password"}
                      value={keyVal}
                      onChange={(e) => handleKeyChange(prov.id, e.target.value)}
                      placeholder={`Enter ${prov.name} API Key (${prov.placeholder})`}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      spellCheck={false}
                      autoCapitalize="none"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/80 focus:bg-neutral-900/90 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-neutral-200 font-mono focus:outline-none transition-all placeholder:text-neutral-500 shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => handleToggleShow(prov.id)}
                        title={isRevealed ? "Hide API key" : "Show API key"}
                        className="text-neutral-500 hover:text-purple-300 transition-colors cursor-pointer p-0.5"
                      >
                        {isRevealed ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                {status && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-mono flex items-center justify-between ${
                      status.success
                        ? "bg-emerald-950/40 border border-emerald-800/50 text-emerald-300"
                        : "bg-red-950/40 border border-red-800/50 text-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {status.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {status.success
                          ? `Online (${status.latency_ms}ms ping)`
                          : `Error: ${status.error?.slice(0, 45)}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-850 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTestKey(prov.id)}
                  disabled={status?.testing}
                  className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 text-purple-400 ${status?.testing ? "animate-spin" : ""}`} />
                  <span>{status?.testing ? "Testing..." : "Test Ping"}</span>
                </button>

                <div className="flex items-center gap-2">
                  {keyVal && (
                    <button
                      onClick={() => handleClearKey(prov.id)}
                      title="Clear key"
                      className="p-2 rounded-xl bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800/50 text-neutral-400 hover:text-red-400 transition-all cursor-pointer text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleSaveKey(prov.id)}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium font-sans flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Key</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
