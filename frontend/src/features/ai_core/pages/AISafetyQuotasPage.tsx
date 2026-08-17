import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Zap,
  Save,
  Activity,
  Tv,
} from "lucide-react";

interface AISafetyQuotasPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

export default function AISafetyQuotasPage({ addNotification }: AISafetyQuotasPageProps) {
  const [rpmLimit, setRpmLimit] = useState<number>(120);
  const [dailySpendCapUSD, setDailySpendCapUSD] = useState<number>(5.0);
  const [enableCopyrightGuard, setEnableCopyrightGuard] = useState<boolean>(true);
  const [enableContentIdScan, setEnableContentIdScan] = useState<boolean>(true);
  const [profanityFilter, setProfanityFilter] = useState<string>("moderate");

  const handleSaveSafety = () => {
    localStorage.setItem("sonikoma_rpm_limit", String(rpmLimit));
    localStorage.setItem("sonikoma_spend_cap", String(dailySpendCapUSD));
    addNotification?.("🛡️ Safety guardrails & quota throttles saved!", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP HERO HEADER BANNER (UNIFIED SUITE STYLE) ─────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md text-left">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-purple-400 opacity-90" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Governance &amp; Compliance
              </h3>
              <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                Content ID Shield Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Safety, Guardrails &amp; Quotas
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Prevent quota runaways, rate limit spikes, and automate copyright &amp; fair-use compliance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSaveSafety}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer font-sans"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Guardrails</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SAFETY CONTROLS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Rate Limiting & Spending */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-850 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-white font-sans">Rate Limits &amp; Spend Caps</span>
            <span className="text-[9px] font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800 text-purple-300">
              Throttles
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-300 font-bold">Requests Per Minute (RPM) Limit</span>
                <span className="text-purple-400 font-bold">{rpmLimit} RPM</span>
              </div>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={rpmLimit}
                onChange={(e) => setRpmLimit(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-300 font-bold">Daily API Spend Cap</span>
                <span className="text-emerald-400 font-bold">${dailySpendCapUSD.toFixed(2)} USD</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={dailySpendCapUSD}
                onChange={(e) => setDailySpendCapUSD(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Copyright & YouTube Compliance */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-850 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-white font-sans">YouTube Compliance Guards</span>
            <span className="text-[9px] font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800 text-emerald-400">
              Automated
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-850 cursor-pointer hover:border-neutral-700 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white font-sans">Content ID Audio Pre-Scan</span>
                <p className="text-[10px] text-neutral-500 font-mono">Verify BGM music tracks before uploading to YouTube</p>
              </div>
              <input
                type="checkbox"
                checked={enableContentIdScan}
                onChange={(e) => setEnableContentIdScan(e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-850 cursor-pointer hover:border-neutral-700 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white font-sans">Fair-Use Disclaimer Auto-Append</span>
                <p className="text-[10px] text-neutral-500 font-mono">Include Section 107 copyright notice in export metadata</p>
              </div>
              <input
                type="checkbox"
                checked={enableCopyrightGuard}
                onChange={(e) => setEnableCopyrightGuard(e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer rounded"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
