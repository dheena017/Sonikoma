import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Zap,
  ShieldCheck,
  Layers,
  Play,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { DynamicModelOption } from "./TierModelCard";
import {
  CapabilityRoute,
  getModelDisplayDetails,
} from "../pages/AIRoutingPage";

export interface SimulationResult {
  resolvedModel: string;
  targetTier: string;
  latency: string;
  status: string;
}

export interface CascadeSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CapabilityRoute | null;
  availableModels: DynamicModelOption[];
  simRunning: boolean;
  simResult: SimulationResult | null;
  onExecuteSimulation: () => void;
}

export default function CascadeSimulatorModal({
  isOpen,
  onClose,
  task,
  availableModels,
  simRunning,
  simResult,
  onExecuteSimulation,
}: CascadeSimulatorModalProps) {
  // Esc key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const p1 = getModelDisplayDetails(task.primary_model, availableModels);
  const p2 = getModelDisplayDetails(task.fallback_model, availableModels);
  const p3 = getModelDisplayDetails(task.tertiary_model, availableModels);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog Window */}
      <div className="relative w-full max-w-xl max-h-[90vh] bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 blur-[1px]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
              {task.emoji}
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Cascade Simulator: {task.name}
              </h2>
              <div className="text-[11px] font-mono text-blue-400">
                Task: {task.task} · {task.required_tag}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-800 p-2 rounded-full transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          <p className="text-xs text-neutral-400 font-sans">
            Simulate a dispatch request through the 3-tier cascade and inspect model resolution.
          </p>

          {/* Configured Execution Path (Model Cards) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-bold">
                Configured Execution Path:
              </span>
              <span className="text-[10px] text-neutral-500">
                Tier 1 &rarr; Tier 2 &rarr; Tier 3
              </span>
            </div>

            {/* Tier 1 (Primary) Card */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                simResult?.targetTier?.includes("Tier 1")
                  ? "bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/40 shadow-lg"
                  : "bg-neutral-900/70 border-white/5 hover:border-blue-500/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                        Tier 1 · Primary
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase"
                        style={{
                          backgroundColor: p1.color.bg,
                          color: p1.color.text,
                          border: `1px solid ${p1.color.border}`,
                        }}
                      >
                        {p1.providerName}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white truncate mt-0.5 font-sans">
                      {p1.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono truncate">
                      ID: {p1.id || "unconfigured"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 text-right">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    DISPATCH 1ST
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono mt-1">
                    {p1.speedRating}
                  </span>
                </div>
              </div>
            </div>

            {/* Failover Arrow Indicator */}
            <div className="flex items-center justify-center py-0.5">
              <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-white/5">
                Failover on rate limit / &gt;2.5s timeout &darr;
              </span>
            </div>

            {/* Tier 2 (Fallback) Card */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                simResult?.targetTier?.includes("Tier 2")
                  ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg"
                  : "bg-neutral-900/70 border-white/5 hover:border-emerald-500/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                        Tier 2 · Fallback
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase"
                        style={{
                          backgroundColor: p2.color.bg,
                          color: p2.color.text,
                          border: `1px solid ${p2.color.border}`,
                        }}
                      >
                        {p2.providerName}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white truncate mt-0.5 font-sans">
                      {p2.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono truncate">
                      ID: {p2.id || "unconfigured"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 text-right">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    HOT STANDBY
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono mt-1">
                    {p2.speedRating}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Arrow Indicator */}
            <div className="flex items-center justify-center py-0.5">
              <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-white/5">
                Emergency backup if secondary fails &darr;
              </span>
            </div>

            {/* Tier 3 (Emergency) Card */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                simResult?.targetTier?.includes("Tier 3")
                  ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40 shadow-lg"
                  : "bg-neutral-900/70 border-white/5 hover:border-amber-500/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                        Tier 3 · Emergency
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase"
                        style={{
                          backgroundColor: p3.color.bg,
                          color: p3.color.text,
                          border: `1px solid ${p3.color.border}`,
                        }}
                      >
                        {p3.providerName}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white truncate mt-0.5 font-sans">
                      {p3.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono truncate">
                      ID: {p3.id || "unconfigured"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 text-right">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    GUARANTEED
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono mt-1">
                    {p3.speedRating}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Result */}
          {simResult && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {simResult.status}
                </span>
                <span className="text-neutral-400 font-mono">
                  Latency: {simResult.latency}
                </span>
              </div>
              <div className="text-xs text-neutral-200 leading-relaxed font-sans">
                Successfully routed to{" "}
                <strong className="text-white font-bold">
                  {simResult.resolvedModel}
                </strong>{" "}
                via <span className="text-emerald-400 font-mono font-bold">{simResult.targetTier}</span>. Cascade heartbeat confirmed active.
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions (Sticky Footer) */}
        <div className="px-6 py-4 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-800"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onExecuteSimulation}
            disabled={simRunning}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md border border-blue-500/30 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
          >
            {simRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Resolving Cascade…</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Execute Dry Run</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
