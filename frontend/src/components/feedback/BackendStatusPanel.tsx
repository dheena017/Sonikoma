import React from "react";

interface BackendStatusPanelProps {
  online: boolean;
  metrics: Record<string, any> | null;
  lastChecked: string | null;
  onRefresh: () => void;
}

export default function BackendStatusPanel({
  online,
  metrics,
  lastChecked,
  onRefresh,
}: BackendStatusPanelProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-4 animate-fade-in">
      <div
        className={`rounded-[28px] border p-6 shadow-2xl transition-colors duration-200 ${
          online
            ? "border-[#10B981]/30 bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E]"
            : "border-[#EF4444]/30 bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E]"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#2F2F2F] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#9CA3AF] font-mono font-bold">
              Backend status
            </p>
            <p
              className={`mt-1 text-2xl font-black font-mono tracking-tight ${
                online ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {online ? "ONLINE" : "OFFLINE"}
            </p>
          </div>

          <div className="flex flex-col items-start gap-1 text-right sm:items-end text-sm text-[#9CA3AF]">
            <span className="text-xs">Last checked</span>
            <span className="font-mono text-xs text-[#E5E5E5]">
              {lastChecked ?? "not available"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[#2F2F2F] bg-[#121212] p-4 shadow-inner">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#9CA3AF] font-mono font-bold">
              Uptime
            </p>
            <p className="mt-2 text-sm font-bold text-[#E5E5E5] font-mono">
              {metrics?.server?.uptime ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#2F2F2F] bg-[#121212] p-4 shadow-inner">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#9CA3AF] font-mono font-bold">
              Requests
            </p>
            <p className="mt-2 text-sm font-bold text-[#E5E5E5] font-mono">
              {metrics?.requests?.total ?? "—"} total
            </p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Errors {metrics?.requests?.errors ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#2F2F2F] bg-[#121212] p-4 shadow-inner">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#9CA3AF] font-mono font-bold">
              Memory
            </p>
            <p className="mt-2 text-sm font-bold text-[#E5E5E5] font-mono">
              {metrics?.memory?.heapUsedMB ?? "—"} MB used
            </p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              RSS {metrics?.memory?.rssMB ?? "—"} MB
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3">
          <div className="text-xs text-[#9CA3AF] space-y-0.5 font-mono">
            <p>
              Port:{" "}
              <span className="font-mono text-[#E5E5E5] font-bold">
                {metrics?.config?.port ?? "—"}
              </span>
            </p>
            <p>
              Env:{" "}
              <span className="font-mono text-[#E5E5E5] font-bold">
                {metrics?.server?.env ?? "development"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="btn-secondary px-5 py-2 text-xs font-bold font-mono"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </section>
  );
}
