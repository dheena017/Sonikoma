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
  Activity,
  Cpu,
  Mic,
  Languages,
  Flame,
  Layers,
  Pencil,
} from "lucide-react";

interface AIAPIKeysPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

interface ProviderItem {
  id: string;
  name: string;
  company?: string;
  category: string;
  badge: string;
  docs_url: string;
  console_url?: string;
  pricing_page_url?: string;
  placeholder?: string;
  keyPrefix?: string;
  description?: string;
  is_configured?: boolean;
  health_status?: string;
  latency_ms?: number | null;
  supported_capabilities?: string[];
  models_count?: number;
  primary_recommended_model?: string;
}

const ICON_MAP: Record<string, any> = {
  gemini: Sparkles,
  openai: Zap,
  anthropic: ShieldCheck,
  groq: Activity,
  deepseek: Cpu,
  elevenlabs: Mic,
  deepl: Languages,
  huggingface: Flame,
  edgetts: Layers,
  stable_diffusion: Sparkles,
};

export default function AIAPIKeysPage({ addNotification }: AIAPIKeysPageProps) {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingStatus, setTestingStatus] = useState<
    Record<string, { loading: boolean; success?: boolean; message?: string; latency?: number; project_name?: string }>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load providers dynamically from backend REST API
  const loadProviders = async () => {
    try {
      const res = await fetch("/api/v1/ai/providers");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();

    // Load saved API keys & Project Names from LocalStorage
    const loadedKeys: Record<string, string> = {};
    const loadedProjects: Record<string, string> = {};
    const providerIds = [
      "gemini",
      "openai",
      "anthropic",
      "groq",
      "deepseek",
      "elevenlabs",
      "deepl",
      "huggingface",
    ];
    for (const pid of providerIds) {
      const val =
        localStorage.getItem(`sonikoma_key_${pid}`) ||
        localStorage.getItem(`user_${pid}_key`) ||
        "";
      loadedKeys[pid] = val;
      loadedProjects[pid] =
        localStorage.getItem(`sonikoma_project_${pid}`) ||
        localStorage.getItem(`user_${pid}_project`) ||
        (pid === "gemini" ? "gen-lang-client-0621007149" : "");
    }
    setKeys(loadedKeys);
    setProjectNames(loadedProjects);

    // Auto-discover live project info directly from backend / Google API
    const geminiKey = loadedKeys["gemini"] || "";
    fetch("/api/v1/ai/providers/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "gemini", api_key: geminiKey }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.project_name) {
          setProjectNames((prev) => ({ ...prev, gemini: data.project_name }));
          localStorage.setItem("sonikoma_project_gemini", data.project_name);
        }
      })
      .catch(() => {});
  }, []);

  const handleKeyChange = (providerId: string, val: string) => {
    setKeys((prev) => ({ ...prev, [providerId]: val }));
  };

  const handleProjectChange = (providerId: string, val: string) => {
    setProjectNames((prev) => ({ ...prev, [providerId]: val }));
  };

  const toggleVisibility = (providerId: string) => {
    setVisibleKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleClearKey = (providerId: string) => {
    setKeys((prev) => ({ ...prev, [providerId]: "" }));
    localStorage.removeItem(`sonikoma_key_${providerId}`);
    localStorage.removeItem(`user_${providerId}_key`);
    window.dispatchEvent(new Event("sonikoma-keys-updated"));
    addNotification?.(`Cleared ${providerId.toUpperCase()} API key`, "info");
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    for (const [pid, val] of Object.entries(keys)) {
      if (val && val.trim()) {
        localStorage.setItem(`sonikoma_key_${pid}`, val.trim());
        localStorage.setItem(`user_${pid}_key`, val.trim());
      } else {
        localStorage.removeItem(`sonikoma_key_${pid}`);
        localStorage.removeItem(`user_${pid}_key`);
      }
    }
    for (const [pid, proj] of Object.entries(projectNames)) {
      if (proj && proj.trim()) {
        localStorage.setItem(`sonikoma_project_${pid}`, proj.trim());
        localStorage.setItem(`user_${pid}_project`, proj.trim());
      } else {
        localStorage.removeItem(`sonikoma_project_${pid}`);
        localStorage.removeItem(`user_${pid}_project`);
      }
    }
    window.dispatchEvent(new Event("sonikoma-keys-updated"));
    window.dispatchEvent(new Event("api-key-updated"));
    setTimeout(() => {
      setIsSaving(false);
      addNotification?.("🔑 All API credentials securely saved!", "success");
    }, 400);
  };
  const handleTestKey = async (providerId: string) => {
    setTestingStatus((prev) => ({
      ...prev,
      [providerId]: { loading: true },
    }));

    const keyToTest = keys[providerId] || "";

    try {
      const res = await fetch("/api/v1/ai/providers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          api_key: keyToTest,
          project_name: projectNames[providerId] || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.project_name && !projectNames[providerId]) {
          setProjectNames((prev) => ({ ...prev, [providerId]: data.project_name }));
          localStorage.setItem(`sonikoma_project_${providerId}`, data.project_name);
        }

        setTestingStatus((prev) => ({
          ...prev,
          [providerId]: {
            loading: false,
            success: true,
            message: `Connected (${data.latency_ms}ms)`,
            latency: data.latency_ms,
            project_name: data.project_name,
          },
        }));
        addNotification?.(`⚡ ${providerId.toUpperCase()} ping successful (${data.latency_ms}ms)`, "success");
      } else {
        setTestingStatus((prev) => ({
          ...prev,
          [providerId]: {
            loading: false,
            success: false,
            message: data.error || "Connection failed",
          },
        }));
        addNotification?.(`Failed to connect to ${providerId.toUpperCase()}: ${data.error}`, "error");
      }
    } catch (err: any) {
      setTestingStatus((prev) => ({
        ...prev,
        [providerId]: {
          loading: false,
          success: false,
          message: "Network request failed",
        },
      }));
      addNotification?.(`Error testing ${providerId.toUpperCase()} key`, "error");
    }
  };

  const configuredCount = Object.values(keys).filter((k) => k && k.trim()).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight font-sans">
            API Keys &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500">
              Provider Vault
            </span>
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed max-w-2xl">
            Connect your own API keys (BYOK) for Google Gemini, OpenAI, Claude, Groq, and more. Keys and configurations remain securely stored in your local browser storage.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-purple-900/40 border border-purple-400/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
          >
            <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
            <span>Save All Keys</span>
          </button>
        </div>
      </div>

      {/* ── PROVIDER CARDS GRID ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const Icon = ICON_MAP[provider.id] || Sparkles;
          const userKey = keys[provider.id] || "";
          const isVisible = Boolean(visibleKeys[provider.id]);
          const testState = testingStatus[provider.id];
          const isLocal = provider.id === "edgetts" || provider.id === "stable_diffusion";
          const currentProject = projectNames[provider.id] || "";

          return (
            <div
              key={provider.id}
              className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 space-y-4 hover:border-neutral-700 transition-all text-left"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-purple-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-sans">{provider.name}</h3>
                      <span className="text-[9px] font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800 text-neutral-300">
                        {provider.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">{provider.category}</span>
                  </div>
                </div>

                {provider.console_url && provider.console_url !== "#" && (
                  <a
                    href={provider.console_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-purple-300 transition-colors"
                    title="Get API Key from provider console"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Input & Action Row */}
              {!isLocal ? (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Key className="w-3 h-3 text-purple-400" /> {provider.name} API Key
                    </label>
                    <div className="relative">
                      <input
                        type={isVisible ? "text" : "password"}
                        placeholder={`Enter ${provider.name} API Key...`}
                        value={userKey}
                        onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3 pr-20 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleVisibility(provider.id)}
                          className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                          title={isVisible ? "Hide Key" : "Reveal Key"}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {userKey && (
                          <button
                            type="button"
                            onClick={() => handleClearKey(provider.id)}
                            className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                            title="Clear Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Google AI Studio Project Auto-Linked Info */}
                  {provider.id === "gemini" && (
                    <div className="space-y-1.5 pt-1 bg-neutral-950/60 p-2.5 rounded-xl border border-indigo-950/60 shadow-inner">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" /> Google AI Studio Project:
                        </span>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-950/50 hover:bg-indigo-900/50 px-2 py-0.5 rounded-lg border border-indigo-800/40"
                        >
                          Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-indigo-200 font-bold tracking-tight">
                            {projectNames.gemini || testState?.project_name || "gen-lang-client-0621007149"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                          Free tier · Active
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Test Connection Button & Status */}
                  <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                    <button
                      onClick={() => handleTestKey(provider.id)}
                      disabled={testState?.loading}
                      className="px-3 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 text-purple-400 ${testState?.loading ? "animate-spin" : ""}`} />
                      <span>{testState?.loading ? "Testing..." : "Test Connection"}</span>
                    </button>

                    {testState && !testState.loading && (
                      <span
                        className={`flex items-center gap-1 font-bold ${testState.success ? "text-emerald-400" : "text-rose-400"
                          }`}
                      >
                        {testState.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{testState.message}</span>
                      </span>
                    )}

                    {!testState && userKey && (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Configured
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-850 flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-mono">Built-in local engine (No API Key needed)</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    Ready
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
