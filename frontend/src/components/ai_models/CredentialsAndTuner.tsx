import React from "react";
import {
  Key,
  Eye,
  EyeOff,
  Save,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  Languages,
  Cpu,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface CredentialsAndTunerProps {
  geminiKey: string;
  setGeminiKey: (v: string) => void;
  openAiKey: string;
  setOpenAiKey: (v: string) => void;
  anthropicKey: string;
  setAnthropicKey: (v: string) => void;
  huggingFaceKey: string;
  setHuggingFaceKey: (v: string) => void;
  showKey: Record<string, boolean>;
  setShowKey: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  savedStatus: Record<string, boolean>;
  envKeys: Record<string, boolean>;
  verifyingProvider: string | null;
  verificationResult: Record<string, { success: boolean; message: string } | null>;
  verifyKey: (provider: string, keyValue: string) => Promise<void>;
  handleClearKeys: () => Promise<void>;
  handleSaveKeys: () => Promise<void>;
  temperature: number;
  setTemperature: (v: number) => void;
  topP: number;
  setTopP: (v: number) => void;
  maxTokens: number;
  setMaxTokens: (v: number) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  applyPreset: (presetName: string) => void;
  handleSaveParameters: () => void;
}

export default function CredentialsAndTuner({
  geminiKey,
  setGeminiKey,
  openAiKey,
  setOpenAiKey,
  anthropicKey,
  setAnthropicKey,
  huggingFaceKey,
  setHuggingFaceKey,
  showKey,
  setShowKey,
  savedStatus,
  envKeys,
  verifyingProvider,
  verificationResult,
  verifyKey,
  handleClearKeys,
  handleSaveKeys,
  temperature,
  setTemperature,
  topP,
  setTopP,
  maxTokens,
  setMaxTokens,
  systemPrompt,
  setSystemPrompt,
  applyPreset,
  handleSaveParameters,
}: CredentialsAndTunerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* COLUMN 1: CREDENTIALS MANAGER */}
      <div className="bg-neutral-955/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-purple-600/5 blur-[85px] rounded-full pointer-events-none" />

        <div className="space-y-6">
          <div className="flex items-start justify-between border-b border-neutral-900 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-400" />
                AI Provider Credentials (BYOK)
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                Credentials are saved inside your local browser storage and processed client-side.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearKeys}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-455 border border-neutral-800 hover:border-rose-500/20 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
              <button
                onClick={handleSaveKeys}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all shadow-lg shadow-purple-950/30 cursor-pointer"
              >
                <Save className="h-3 w-3" /> Save Changes
              </button>
            </div>
          </div>

          {/* API INPUT FIELD LIST */}
          <div className="space-y-4">
            {[
              {
                id: "gemini",
                name: "Google Gemini",
                val: geminiKey,
                setter: setGeminiKey,
                link: "https://aistudio.google.com/app/apikey",
                placeholder: "e.g. AIzaSy...",
                prefix: "AIza",
              },
              {
                id: "openai",
                name: "OpenAI",
                val: openAiKey,
                setter: setOpenAiKey,
                link: "https://platform.openai.com/api-keys",
                placeholder: "e.g. sk-proj-...",
                prefix: "sk-",
              },
              {
                id: "anthropic",
                name: "Anthropic",
                val: anthropicKey,
                setter: setAnthropicKey,
                link: "https://console.anthropic.com/settings/keys",
                placeholder: "e.g. sk-ant-...",
                prefix: "sk-ant",
              },
              {
                id: "huggingface",
                name: "Hugging Face",
                val: huggingFaceKey,
                setter: setHuggingFaceKey,
                link: "https://huggingface.co/settings/tokens",
                placeholder: "e.g. hf_...",
                prefix: "hf_",
              },
            ].map((prov) => {
              const isSaved = savedStatus[prov.id];
              const hasEnv = envKeys[prov.id];
              const isInvalid = prov.val.length > 0 && !prov.val.startsWith(prov.prefix);
              const verification = verificationResult[prov.id];

              return (
                <div key={prov.id} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                      {prov.name}
                    </label>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <a
                        href={prov.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors mr-2"
                      >
                        Get Key ↗
                      </a>
                      {isSaved ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                          Stored
                        </span>
                      ) : hasEnv ? (
                        <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                          Active (Env)
                        </span>
                      ) : (
                        <span className="text-neutral-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded uppercase">
                          Missing
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative flex gap-2">
                    <div className="relative flex-1 group">
                      <input
                        type="text"
                        value={prov.val}
                        onChange={(e) => prov.setter(e.target.value)}
                        placeholder={hasEnv ? "Active via backend configuration (.env)" : prov.placeholder}
                        style={{ WebkitTextSecurity: showKey[prov.id] ? "none" : "disc" } as React.CSSProperties}
                        className={`w-full pl-3 pr-10 py-2 bg-neutral-955/60 border rounded-xl text-xs text-white focus:outline-none focus:ring-1 transition-all placeholder:text-neutral-600 ${
                          isInvalid
                            ? "border-rose-500/40 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-neutral-800 focus:border-purple-500 focus:ring-purple-500/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {showKey[prov.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <button
                      onClick={() => verifyKey(prov.id, prov.val)}
                      disabled={verifyingProvider !== null || (!prov.val.trim() && !hasEnv)}
                      className="px-3 py-2 bg-neutral-900 hover:bg-neutral-855 border border-neutral-800 text-neutral-300 rounded-xl text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                    >
                      {verifyingProvider === prov.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
                      ) : (
                        "Verify"
                      )}
                    </button>
                  </div>

                  {/* Validation Warn / Verification Response */}
                  {isInvalid && (
                    <p className="text-[9px] text-rose-455">
                      ⚠️ Warning: Expected prefix "{prov.prefix}" not found. Key may fail.
                    </p>
                  )}

                  {verification && (
                    <div className={`p-2 rounded-xl text-[9px] flex items-start gap-1.5 ${
                      verification.success
                        ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400"
                        : "bg-rose-950/20 border border-rose-900/40 text-rose-400"
                    }`}>
                      {verification.success ? (
                        <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      )}
                      <span>{verification.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* COLUMN 2: ADVANCED GENERATION PARAMETERS */}
      <div className="bg-neutral-955/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-3/4 h-24 bg-purple-600/5 blur-[85px] rounded-full pointer-events-none" />

        <div className="space-y-6">
          <div className="flex items-start justify-between border-b border-neutral-900 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-purple-400" />
                Advanced Generation Tuner
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                Configure generation presets, temperature, limits, and system prompt tuning.
              </p>
            </div>
            <button
              onClick={handleSaveParameters}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all shadow-lg shadow-purple-950/30 cursor-pointer"
            >
              <Save className="h-3 w-3" /> Save Params
            </button>
          </div>

          {/* SLIDERS & PARAMETERS FORM */}
          <div className="space-y-5">

            {/* Temperature slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-300 font-bold">Temperature (Creativity)</span>
                <span className="text-purple-400 font-bold">{temperature.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                <span>Precise & Analytical (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Highly Creative (1.5)</span>
              </div>
            </div>

            {/* Top P slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-300 font-bold">Top-P (Nucleus Sampling)</span>
                <span className="text-purple-400 font-bold">{topP.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                <span>Narrow Vocabulary (0.1)</span>
                <span>Broad & Natural (1.0)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-300 font-bold">Max Output Limit (Tokens)</span>
                <span className="text-purple-400 font-bold">{maxTokens} tokens</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                <span>Short Snippets (256)</span>
                <span>Standard Responses (2048)</span>
                <span>Long Narration (8192)</span>
              </div>
            </div>

            {/* Tuning Presets */}
            <div className="space-y-2 border-t border-neutral-900 pt-4">
              <label className="block text-[10px] font-mono font-bold text-neutral-450 uppercase tracking-wider">
                Quick-Select Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => applyPreset("creative")}
                  className="px-2 py-1.5 bg-neutral-900/60 hover:bg-purple-950/20 border border-neutral-850 hover:border-purple-500/30 rounded-xl text-[10px] text-neutral-300 font-mono font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-purple-400" /> Creative Recaps
                </button>
                <button
                  onClick={() => applyPreset("translation")}
                  className="px-2 py-1.5 bg-neutral-900/60 hover:bg-purple-950/20 border border-neutral-850 hover:border-purple-500/30 rounded-xl text-[10px] text-neutral-300 font-mono font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <Languages className="h-3 w-3 text-purple-400" /> Translation
                </button>
                <button
                  onClick={() => applyPreset("json")}
                  className="px-2 py-1.5 bg-neutral-900/60 hover:bg-purple-950/20 border border-neutral-855 hover:border-purple-500/30 rounded-xl text-[10px] text-neutral-300 font-mono font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="h-3 w-3 text-purple-400" /> JSON / Strict
                </button>
                <button
                  onClick={() => applyPreset("default")}
                  className="px-2 py-1.5 bg-neutral-900/60 hover:bg-purple-950/20 border border-neutral-850 hover:border-purple-500/30 rounded-xl text-[10px] text-neutral-300 font-mono font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3 text-purple-400" /> Default Tuner
                </button>
              </div>
            </div>

            {/* System Prompt tuning */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-neutral-300">
                System Instruction Override
              </label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Provide standard instructions for the AI behavior..."
                className="w-full p-3 bg-neutral-955/60 border border-neutral-900 rounded-2xl text-xs font-mono text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 placeholder:text-neutral-600 resize-none leading-relaxed"
              />
              <p className="text-[9px] text-neutral-500 leading-normal">
                Tip: Overriding instructions forces models to conform to strict format targets, dialogue structure, or translation styles during comic compilation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
