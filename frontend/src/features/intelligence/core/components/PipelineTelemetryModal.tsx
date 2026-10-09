import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Activity, Cpu, ShieldCheck, Sparkles } from "lucide-react";

export interface PipelineTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  routesCount: number;
  totalRoutes?: number;
  engineCount: number;
}

export default function PipelineTelemetryModal({
  isOpen,
  onClose,
  routesCount,
  totalRoutes = 11,
  engineCount,
}: PipelineTelemetryModalProps) {
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

  if (!isOpen) return null;

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
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 blur-[1px]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Pipeline Architecture &amp; Telemetry
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Live multi-tier cascade telemetry, health redundancy, and orchestrator bindings.
              </p>
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
          {/* 4 Telemetry Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Detail 1: Routed Pipelines */}
            <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                  Routed Pipelines
                </span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-mono">
                  {routesCount} / {totalRoutes}
                </div>
                <div className="text-xs text-neutral-400 mt-1 font-mono">
                  Full comic workflow coverage across all specialized generative tasks
                </div>
              </div>
            </div>

            {/* Detail 2: Cascade Redundancy */}
            <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                  Cascade Redundancy
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  100% 3-Tier
                </div>
                <div className="text-xs text-neutral-400 mt-1 font-mono">
                  Auto-failover enabled on rate limit and latency spikes
                </div>
              </div>
            </div>

            {/* Detail 3: Model Catalog */}
            <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                  Model Catalog
                </span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-mono">
                  {engineCount} Engines
                </div>
                <div className="text-xs text-neutral-400 mt-1 font-mono">
                  Active across 3-tier routing pipelines
                </div>
              </div>
            </div>

            {/* Detail 4: Orchestrator Sync */}
            <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                  Orchestrator Sync
                </span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  SYNCHRONIZED
                </div>
                <div className="text-xs text-neutral-400 mt-1 font-mono">
                  Live Central AI Core binding with active health monitoring
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Explainer */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-neutral-400">
              Cascade Architecture Mechanics
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="font-bold text-blue-400 mb-0.5">Tier 1: Primary</div>
                <p className="text-[11px] text-neutral-400">
                  Dispatched first for highest fidelity results.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="font-bold text-emerald-400 mb-0.5">Tier 2: High-Speed</div>
                <p className="text-[11px] text-neutral-400">
                  Auto-fallback on rate limits or timeout errors.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="font-bold text-amber-400 mb-0.5">Tier 3: Emergency</div>
                <p className="text-[11px] text-neutral-400">
                  Guaranteed uptime backup so jobs never fail.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions (Sticky Footer) */}
        <div className="px-6 py-4 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
