import React, { useState, useEffect } from "react";
import { Key, Eye, EyeOff, ShieldCheck, Save, Trash2 } from "lucide-react";

export default function AIProviderKeysConfig() {
  const [geminiKey, setGeminiKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [huggingFaceKey, setHuggingFaceKey] = useState("");

  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [envKeys, setEnvKeys] = useState<Record<string, boolean>>({
    gemini: false,
    openai: false,
    anthropic: false,
    huggingface: false,
  });

  const checkSaved = () => {
    setSavedStatus({
      gemini: !!localStorage.getItem("user_gemini_key"),
      openai: !!localStorage.getItem("user_openai_key"),
      anthropic: !!localStorage.getItem("user_anthropic_key"),
      huggingface: !!localStorage.getItem("user_huggingface_key"),
    });
  };

  useEffect(() => {
    setGeminiKey(localStorage.getItem("user_gemini_key") || "");
    setOpenAiKey(localStorage.getItem("user_openai_key") || "");
    setAnthropicKey(localStorage.getItem("user_anthropic_key") || "");
    setHuggingFaceKey(localStorage.getItem("user_huggingface_key") || "");
    checkSaved();

    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.env) {
          setEnvKeys({
            gemini: !!data.env.GEMINI_API_KEY,
            openai: !!data.env.OPENAI_API_KEY,
            anthropic: !!data.env.ANTHROPIC_API_KEY,
            huggingface: !!data.env.HUGGINGFACE_API_KEY,
          });
        }
      })
      .catch((err) => console.error("Failed to fetch health for env API keys:", err));
  }, []);

  const handleSaveKeys = async () => {
    const keys = {
      user_gemini_key: geminiKey,
      user_openai_key: openAiKey,
      user_anthropic_key: anthropicKey,
      user_huggingface_key: huggingFaceKey,
    };

    let savedCount = 0;
    for (const [keyName, value] of Object.entries(keys)) {
      if (value.trim() === "") {
        localStorage.removeItem(keyName);
      } else {
        localStorage.setItem(keyName, value.trim());
        savedCount++;
      }
    }
    checkSaved();
    await (window as any).alertAsync(
      `Successfully updated! ${savedCount} API keys saved securely to your browser.`
    );
  };

  const handleClearAll = async () => {
    let confirmed = false;
    if (typeof (window as any).confirmAsync === "function") {
      confirmed = await (window as any).confirmAsync(
        "Are you sure you want to delete all saved API keys?",
        "Clear Keys",
        "red"
      );
    } else {
      confirmed = await (window as any).confirmAsync(
        "Are you sure you want to delete all saved API keys?"
      );
    }

    if (!confirmed) return;

    setGeminiKey("");
    setOpenAiKey("");
    setAnthropicKey("");
    setHuggingFaceKey("");
    localStorage.removeItem("user_gemini_key");
    localStorage.removeItem("user_openai_key");
    localStorage.removeItem("user_anthropic_key");
    localStorage.removeItem("user_huggingface_key");
    checkSaved();
  };

  const toggleShow = (provider: string) => {
    setShowKey((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const KeyInput = ({
    label,
    value,
    setter,
    provider,
    placeholder,
    isSaved,
    getLink,
    prefix,
  }: {
    label: string;
    value: string;
    setter: (v: string) => void;
    provider: string;
    placeholder: string;
    isSaved: boolean;
    getLink: string;
    prefix: string;
  }) => {
    const isInvalid = value.length > 0 && !value.startsWith(prefix);
    return (
      <div className="flex flex-col gap-2 relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <a
              href={getLink}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
            >
              Get Key ↗
            </a>
            {isSaved ? (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                <ShieldCheck className="h-3 w-3" /> Stored
              </span>
            ) : envKeys[provider] ? (
              <span className="flex items-center gap-1 text-[9px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                <ShieldCheck className="h-3 w-3" /> Active (Env)
              </span>
            ) : null}
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key
              className={`h-4 w-4 ${
                isSaved || envKeys[provider]
                  ? "text-emerald-500"
                  : isInvalid
                  ? "text-rose-500"
                  : "text-neutral-500 group-focus-within:text-purple-400"
              } transition-colors`}
            />
          </div>
          <input
            type={showKey[provider] ? "text" : "password"}
            value={value}
            onChange={(e) => setter(e.target.value)}
            autoComplete="new-password"
            placeholder={envKeys[provider] ? "Active via environment (.env)" : placeholder}
            className={`w-full pl-9 pr-10 py-2.5 bg-black/40 border rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 transition-all placeholder:text-neutral-500 ${
              isInvalid
                ? "border-rose-500/50 focus:border-rose-500/80 focus:ring-rose-500/50"
                : "border-white/5 focus:border-purple-500/50 focus:ring-purple-500/50"
            }`}
          />
          <button
            type="button"
            onClick={() => toggleShow(provider)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {showKey[provider] ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {isInvalid && (
          <p className="text-[10px] text-rose-400 animate-pulse">
            Key format appears invalid (should start with "{prefix}")
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-neutral-950/40 border border-neutral-850 rounded-3xl p-6 relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-start justify-between border-b border-neutral-800 pb-4 mb-5 relative">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            AI Provider Credentials (BYOK)
          </h2>
          <p className="text-[10px] text-neutral-500 font-mono mt-1">
            Keys are encrypted in transit and securely stored in your local
            browser storage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/20 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
        <KeyInput
          label="Google Gemini"
          value={geminiKey}
          setter={setGeminiKey}
          provider="gemini"
          placeholder="e.g. AIzaSy..."
          isSaved={savedStatus.gemini}
          getLink="https://aistudio.google.com/app/apikey"
          prefix="AIza"
        />
        <KeyInput
          label="OpenAI"
          value={openAiKey}
          setter={setOpenAiKey}
          provider="openai"
          placeholder="e.g. sk-proj-..."
          isSaved={savedStatus.openai}
          getLink="https://platform.openai.com/api-keys"
          prefix="sk-"
        />
        <KeyInput
          label="Anthropic"
          value={anthropicKey}
          setter={setAnthropicKey}
          provider="anthropic"
          placeholder="e.g. sk-ant-..."
          isSaved={savedStatus.anthropic}
          getLink="https://console.anthropic.com/settings/keys"
          prefix="sk-ant"
        />
        <KeyInput
          label="Hugging Face"
          value={huggingFaceKey}
          setter={setHuggingFaceKey}
          provider="huggingface"
          placeholder="e.g. hf_..."
          isSaved={savedStatus.huggingface}
          getLink="https://huggingface.co/settings/tokens"
          prefix="hf_"
        />
      </div>
    </div>
  );
}
