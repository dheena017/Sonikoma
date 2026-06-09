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
    <section className="max-w-7xl mx-auto px-6 py-4">
      <div
        className={`rounded-3xl border p-4 shadow-lg shadow-black/20 transition-colors duration-200 ${
          online
            ? "border-emerald-500/30 bg-emerald-950/10"
            : "border-rose-500/30 bg-rose-950/10"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Backend status
            </p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                online ? "text-emerald-200" : "text-rose-200"
              }`}
            >
              {online ? "ONLINE" : "OFFLINE"}
            </p>
          </div>

          <div className="flex flex-col items-start gap-1 text-right sm:items-end text-sm text-neutral-400">
            <span>Last checked</span>
            <span className="font-mono text-xs text-neutral-300">
              {lastChecked ?? "not available"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              Uptime
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {metrics?.server?.uptime ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              Requests
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {metrics?.requests?.total ?? "—"} total
            </p>
            <p className="text-xs text-neutral-400">
              Errors {metrics?.requests?.errors ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              Memory
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {metrics?.memory?.heapUsedMB ?? "—"} MB used
            </p>
            <p className="text-xs text-neutral-400">
              RSS {metrics?.memory?.rssMB ?? "—"} MB
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-300">
            <p>
              Port:{" "}
              <span className="font-mono text-white">
                {metrics?.config?.port ?? "5173"}
              </span>
            </p>
            <p>
              Env:{" "}
              <span className="font-mono text-white">
                {metrics?.server?.env ?? "development"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center rounded-full bg-neutral-800/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Refresh status
          </button>
        </div>
      </div>
    </section>
  );
}
