import React, { useState } from "react";
import { Copy, Check, Sparkles, ArrowUpRight } from "lucide-react";

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

function formatContextWindow(ctx: number | string): string {
  if (typeof ctx !== "number") return String(ctx);
  // Check common binary/decimal LLM context sizes
  if (ctx >= 1_000_000 || ctx >= 1024 * 1024) {
    const inMeg = ctx / (1024 * 1024);
    if (Math.abs(inMeg - Math.round(inMeg)) < 0.05) {
      return `${Math.round(inMeg)}M tokens`;
    }
    const inDecMeg = ctx / 1_000_000;
    if (Math.abs(inDecMeg - Math.round(inDecMeg)) < 0.05) {
      return `${Math.round(inDecMeg)}M tokens`;
    }
    return `${inDecMeg.toFixed(1)}M tokens`;
  }
  if (ctx >= 1000) {
    const inK = ctx / 1024;
    if (Math.abs(inK - Math.round(inK)) < 0.05) {
      return `${Math.round(inK)}k tokens`;
    }
    return `${Math.round(ctx / 1000)}k tokens`;
  }
  return `${ctx} tokens`;
}

function formatTPM(val: number): string {
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return val.toLocaleString();
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
    (tier === "free"
      ? model.free_tier?.rpm || model.limit_rpm
      : model.paid_tier?.rpm || model.limit_rpm) * factor
  );
  const tpmLimit = Math.round(
    (tier === "free"
      ? model.free_tier?.tpm || model.limit_tpm
      : model.paid_tier?.tpm || model.limit_tpm) * factor
  );
  const rpdLimit = Math.round(
    (tier === "free"
      ? model.free_tier?.rpd || model.limit_rpd
      : model.paid_tier?.rpd || model.limit_rpd) * factor
  );

  const rpmUsed = model.rpm_used || 0;
  const tpmUsed = model.tpm_used || 0;
  const rpdUsed = model.rpd_used || 0;

  const rpmPct =
    rpmLimit > 0 ? Math.min(100, Math.round((rpmUsed / rpmLimit) * 100)) : 0;
  const tpmPct =
    tpmLimit > 0 ? Math.min(100, Math.round((tpmUsed / tpmLimit) * 100)) : 0;
  const rpdPct =
    rpdLimit > 0 ? Math.min(100, Math.round((rpdUsed / rpdLimit) * 100)) : 0;

  const handleCopyEndpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(model.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Curate display tags: prioritize recommended_for, otherwise show non-generic capabilities
  const displayTags =
    model.recommended_for && model.recommended_for.length > 0
      ? model.recommended_for.slice(0, 3)
      : (model.capabilities || [])
          .filter(
            (c) =>
              !["text", "batch_api", "json_mode", "streaming", "multilingual"].includes(
                c.toLowerCase()
              )
          )
          .slice(0, 3)
          .map((c) => c.replace(/_/g, " "));

  return (
    <div
      onClick={() => onSelect?.(model.id)}
      className="group relative rounded-2xl border border-[#2F2F2F] bg-[#141414] p-5 space-y-4 hover:border-neutral-600 hover:bg-[#181818] transition-all duration-200 text-left shadow-sm flex flex-col justify-between"
    >
      {/* ── CARD HEADER ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white font-sans group-hover:text-blue-400 transition-colors truncate">
              {model.name}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className="text-[11px] text-neutral-400 font-normal">
                {model.category}
              </span>
              <span className="text-neutral-600 text-xs">·</span>
              {/* Compact Model ID Chip */}
              <button
                type="button"
                onClick={handleCopyEndpoint}
                title="Click to copy model ID"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1C1C1C] border border-[#2F2F2F] text-[10px] font-mono text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
              >
                <span>{model.id}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Telemetry Dot */}
            <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>LIVE</span>
            </span>

            {model.speed_rating && (
              <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] border border-[#2F2F2F] text-blue-400 px-2 py-0.5 rounded-full">
                {model.speed_rating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── RATE LIMIT METERS & USAGE (RPM / TPM / RPD) ──────────────────── */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* RPM Meter */}
        <div className="bg-[#181818] border border-[#262626] p-2.5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono font-bold uppercase mb-0.5">
              <span>RPM</span>
              <span
                className={
                  rpmPct >= 85
                    ? "text-rose-400 font-bold"
                    : "text-blue-400 font-bold"
                }
              >
                {rpmPct}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-white font-mono text-left">
              <span className="text-white">{rpmUsed.toLocaleString()}</span>
              <span className="text-neutral-500 text-[10px] font-normal">
                {" "}
                / {rpmLimit.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-full h-1 bg-[#242424] rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                rpmPct >= 85
                  ? "bg-rose-500"
                  : rpmPct >= 60
                  ? "bg-amber-500"
                  : "bg-blue-500"
              } transition-all duration-300`}
              style={{ width: `${rpmPct}%` }}
            />
          </div>
        </div>

        {/* TPM Meter */}
        <div className="bg-[#181818] border border-[#262626] p-2.5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono font-bold uppercase mb-0.5">
              <span>TPM</span>
              <span
                className={
                  tpmPct >= 85
                    ? "text-rose-400 font-bold"
                    : "text-blue-400 font-bold"
                }
              >
                {tpmPct}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-white font-mono text-left">
              <span className="text-white">{formatTPM(tpmUsed)}</span>
              <span className="text-neutral-500 text-[10px] font-normal">
                {" "}
                / {formatTPM(tpmLimit)}
              </span>
            </div>
          </div>
          <div className="w-full h-1 bg-[#242424] rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                tpmPct >= 85
                  ? "bg-rose-500"
                  : tpmPct >= 60
                  ? "bg-amber-500"
                  : "bg-blue-500"
              } transition-all duration-300`}
              style={{ width: `${tpmPct}%` }}
            />
          </div>
        </div>

        {/* RPD Meter */}
        <div className="bg-[#181818] border border-[#262626] p-2.5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono font-bold uppercase mb-0.5">
              <span>RPD</span>
              <span
                className={
                  rpdPct >= 85
                    ? "text-rose-400 font-bold"
                    : "text-emerald-400 font-bold"
                }
              >
                {rpdPct}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-white font-mono text-left">
              <span className="text-white">{rpdUsed.toLocaleString()}</span>
              <span className="text-neutral-500 text-[10px] font-normal">
                {" "}
                / {rpdLimit.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-full h-1 bg-[#242424] rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                rpdPct >= 85
                  ? "bg-rose-500"
                  : rpdPct >= 60
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              } transition-all duration-300`}
              style={{ width: `${rpdPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CURATED HIGHLIGHT TAGS ────────────────────────────────────────── */}
      {displayTags.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Recommended For</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-mono bg-[#1C1C1C] border border-[#2F2F2F] text-neutral-300 px-2 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── PRICING & ROUTING ACTION FOOTER ───────────────────────────────── */}
      <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-[11px] font-mono text-neutral-400">
        <div className="space-y-0.5">
          {model.cost_per_1m_prompt > 0 ? (
            <div>
              Prompt:{" "}
              <strong className="text-white font-bold">
                ${model.cost_per_1m_prompt}/1M
              </strong>{" "}
              · Output:{" "}
              <strong className="text-white font-bold">
                ${model.cost_per_1m_completion}/1M
              </strong>
            </div>
          ) : model.price_per_image ? (
            <div>
              Cost:{" "}
              <strong className="text-white font-bold">
                ${model.price_per_image} / image
              </strong>
            </div>
          ) : model.price_per_1k_chars ? (
            <div>
              Cost:{" "}
              <strong className="text-white font-bold">
                ${model.price_per_1k_chars} / 1k chars
              </strong>
            </div>
          ) : model.price_per_audio_minute ? (
            <div>
              Cost:{" "}
              <strong className="text-white font-bold">
                ${model.price_per_audio_minute} / min
              </strong>
            </div>
          ) : (
            <div>
              Cost:{" "}
              <strong className="text-emerald-400 font-bold">Free Tier</strong>
            </div>
          )}
          <span className="text-[10px] text-neutral-400">
            Context: {formatContextWindow(model.context_window)}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/ai-core/routing`;
          }}
          className="px-3 py-1.5 rounded-xl bg-[#1E1E1E] hover:bg-blue-600 text-neutral-200 hover:text-white border border-[#2F2F2F] hover:border-blue-500 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span>Route</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
