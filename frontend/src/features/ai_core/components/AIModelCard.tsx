import React, { useState } from "react";
import { Copy, Check, Sparkles, ArrowUpRight, Activity } from "lucide-react";

export interface AIModelCardData {
  id: string;
  name: string;
  provider: string;
  category: string;
  limit_rpm: number;
  limit_tpm: number;
  limit_rpd: number;
  rpm_used?: number;
  tpm_used?: number;
  rpd_used?: number;
  utilization_pct_rpm?: number;
  utilization_pct_tpm?: number;
  free_tier?: { rpm: number; tpm: number; rpd: number };
  paid_tier?: { rpm: number; tpm: number; rpd: number };
  cost_per_1m_prompt: number;
  cost_per_1m_completion: number;
  price_per_image?: number;
  price_per_1k_chars?: number;
  price_per_audio_minute?: number;
  price_per_video_second?: number;
  context_window: number | string;
  max_output_tokens?: number;
  speed_rating: string;
  capabilities?: string[];
  recommended_for?: string[];
  batch_enqueued_tokens?: { tier1: number; tier2: number; tier3: number };
  special_quotas?: { name: string; limit: string; used?: string }[];
  status?: string;
}

interface AIModelCardProps {
  model: AIModelCardData;
  tier?: "free" | "tier1" | "tier2" | "tier3";
  isPriorityInference?: boolean;
  onSelect?: (modelId: string) => void;
}

export default function AIModelCard({
  model,
  tier = "tier1",
  isPriorityInference = false,
  onSelect,
}: AIModelCardProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const factor = isPriorityInference ? 0.3 : 1.0;
  const rpmLimit = Math.round(
    (tier === "free" ? model.free_tier?.rpm || model.limit_rpm : model.paid_tier?.rpm || model.limit_rpm) * factor
  );
  const tpmLimit = Math.round(
    (tier === "free" ? model.free_tier?.tpm || model.limit_tpm : model.paid_tier?.tpm || model.limit_tpm) * factor
  );
  const rpdLimit = Math.round(
    (tier === "free" ? model.free_tier?.rpd || model.limit_rpd : model.paid_tier?.rpd || model.limit_rpd) * factor
  );

  const rpmUsed = model.rpm_used || 0;
  const tpmUsed = model.tpm_used || 0;
  const rpdUsed = model.rpd_used || 0;

  const rpmPct = rpmLimit > 0 ? Math.min(100, Math.round((rpmUsed / rpmLimit) * 100)) : 0;
  const tpmPct = tpmLimit > 0 ? Math.min(100, Math.round((tpmUsed / tpmLimit) * 100)) : 0;
  const rpdPct = rpdLimit > 0 ? Math.min(100, Math.round((rpdUsed / rpdLimit) * 100)) : 0;

  const getUsageColor = (pct: number) => {
    if (pct >= 85) return "bg-rose-500 text-rose-400";
    if (pct >= 60) return "bg-amber-500 text-amber-400";
    return "bg-[#2A2A2A] text-[#3B82F6]";
  };

  const handleCopyEndpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(model.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div
      onClick={() => onSelect?.(model.id)}
      className="group relative rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-4 hover:border-[#3B82F6]/60 hover:bg-[#1a1a1a] transition-all duration-200 text-left shadow-sm flex flex-col justify-between"
    >
      {/* ── CARD HEADER ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-sans group-hover:text-[#93C5FD] transition-colors">
                {model.name}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
              {model.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Telemetry Dot */}
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>LIVE</span>
            </span>

            <span className="text-[9px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-[#3B82F6] px-2 py-0.5 rounded-full">
              {model.speed_rating}
            </span>
          </div>
        </div>

        {/* Model ID Pill with Copy button */}
        <div className="flex items-center justify-between bg-neutral-950/80 border border-neutral-850 px-2.5 py-1 rounded-lg">
          <code className="text-[11px] font-mono text-neutral-300 truncate">
            {model.id}
          </code>
          <button
            onClick={handleCopyEndpoint}
            title="Copy model endpoint ID"
            className="text-neutral-400 hover:text-white p-1 transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── LIVE RATE LIMIT METERS & USAGE (RPM / TPM / RPD) ──────────────── */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        {/* RPM Meter */}
        <div className="bg-neutral-900/90 border border-neutral-800/70 p-2.5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono font-bold uppercase mb-0.5">
              <span>Live RPM</span>
              <span className={rpmPct >= 85 ? "text-rose-400 font-bold" : "text-[#3B82F6] font-bold"}>
                {rpmPct}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-white font-mono">
              <span className="text-[#60A5FA]">{rpmUsed}</span>
              <span className="text-neutral-500 text-[10px] font-normal"> / {rpmLimit}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${getUsageColor(rpmPct).split(" ")[0]} transition-all duration-300`}
              style={{ width: `${Math.max(4, rpmPct)}%` }}
            />
          </div>
        </div>

        {/* TPM Meter */}
        <div className="bg-neutral-900/90 border border-neutral-800/70 p-2.5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono font-bold uppercase mb-0.5">
              <span>Live TPM</span>
              <span className={tpmPct >= 85 ? "text-rose-400 font-bold" : "text-[#3B82F6] font-bold"}>
                {tpmPct}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-[#3B82F6] font-mono">
              <span>{tpmUsed >= 1000 ? `${(tpmUsed / 1000).toFixed(1)}k` : tpmUsed}</span>
              <span className="text-neutral-500 text-[10px] font-normal">
                {" "}
                / {tpmLimit >= 1_000_000 ? `${(tpmLimit / 1_000_000).toFixed(1)}M` : `${(tpmLimit / 1000).toLocaleString()}k`}
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${getUsageColor(tpmPct).split(" ")[0]} transition-all duration-300`}
              style={{ width: `${Math.max(4, tpmPct)}%` }}
            />
          </div>
        </div>

        {/* RPD Meter */}
        <div className="bg-neutral-900/90 border border-neutral-800/70 p-2.5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono font-bold uppercase mb-0.5">
              <span>Live RPD</span>
              <span className={rpdPct >= 85 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                {rpdPct}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
              <span>{rpdUsed}</span>
              <span className="text-neutral-500 text-[10px] font-normal">
                {" "}
                / {rpdLimit.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${getUsageColor(rpdPct).split(" ")[0]} transition-all duration-300`}
              style={{ width: `${Math.max(4, rpdPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── RECOMMENDED FOR BADGES ────────────────────────────────────────── */}
      {model.recommended_for && model.recommended_for.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-mono uppercase text-neutral-400 flex items-center gap-1 font-bold">
            <Sparkles className="w-2.5 h-2.5 text-[#3B82F6]" /> Recommended For
          </span>
          <div className="flex flex-wrap gap-1">
            {model.recommended_for.slice(0, 3).map((rec, i) => (
              <span
                key={i}
                className="text-[9px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded"
              >
                {rec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── CAPABILITIES TAGS ─────────────────────────────────────────────── */}
      {model.capabilities && model.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {model.capabilities.map((cap, i) => (
            <span
              key={i}
              className="text-[8px] font-mono bg-neutral-950 border border-neutral-850 text-neutral-400 px-1.5 py-0.5 rounded capitalize"
            >
              {cap.replace("_", " ")}
            </span>
          ))}
        </div>
      )}

      {/* ── PRICING & PLAYGROUND ACTION FOOTER ────────────────────────────── */}
      <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-[10px] font-mono text-neutral-400">
        <div className="space-y-0.5">
          {model.cost_per_1m_prompt > 0 ? (
            <div>
              Prompt: <strong className="text-white">${model.cost_per_1m_prompt}/1M</strong> · Output:{" "}
              <strong className="text-white">${model.cost_per_1m_completion}/1M</strong>
            </div>
          ) : model.price_per_image ? (
            <div>
              Cost: <strong className="text-white">${model.price_per_image} / image</strong>
            </div>
          ) : model.price_per_1k_chars ? (
            <div>
              Cost: <strong className="text-white">${model.price_per_1k_chars} / 1k chars</strong>
            </div>
          ) : model.price_per_audio_minute ? (
            <div>
              Cost: <strong className="text-white">${model.price_per_audio_minute} / audio min</strong>
            </div>
          ) : (
            <div>
              Cost: <strong className="text-emerald-400">Zero-Cost Free Tier</strong>
            </div>
          )}
          <span className="text-[9px] text-neutral-400">
            Context: {typeof model.context_window === "number" ? `${(model.context_window / 1000).toFixed(0)}k` : model.context_window}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/ai-core/routing`;
          }}
          className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-[#3B82F6] text-neutral-300 hover:text-white border border-neutral-800 text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer shadow-sm"
        >
          <span>Route</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
