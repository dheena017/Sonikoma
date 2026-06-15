import React, { useState, useCallback, useEffect } from "react";
import { Info, Activity, RefreshCw, Clock } from "lucide-react";
import { useBackendHealth } from "../../hooks/useBackendHealth";

export function BubbleCleanerDiagnosticDashboard({
  addNotification,
}: {
  addNotification?: (msg: string, type: any) => void;
}) {
  const { status, latency, version, checkHealth } = useBackendHealth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setUptime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualCheck = useCallback(async () => {
    setIsSyncing(true);
    await checkHealth();
    setTimeout(() => setIsSyncing(false), 600);
  }, [checkHealth]);

  return (
    <div
      className={`border rounded-3xl p-5 space-y-3.5 transition-all duration-500 ${
        status === "online"
          ? "border-neutral-800 bg-neutral-950/20"
          : "border-red-900 bg-red-950/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 text-[10px] font-bold font-mono ${
            status === "online" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          <Activity
            className={`h-4.5 w-4.5 ${isSyncing ? "animate-pulse" : ""}`}
          />
          <span>BACKEND CONNECTIVITY & PERFORMANCE DIAGNOSTICS</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[8px] font-mono text-neutral-500">
            <Clock className="h-3 w-3" />
            <span>
              SESS: {Math.floor(uptime / 60)}m {uptime % 60}s
            </span>
          </div>
          <button
            onClick={handleManualCheck}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <RefreshCw
              className={`h-3 w-3 text-neutral-500 ${
                isSyncing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800 text-[8px] font-mono">
          <span className="text-neutral-500 block uppercase">API STATUS</span>
          <span
            className={`font-bold ${
              status === "online" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {status === "online"
              ? "STABLE (200 OK)"
              : status === "checking"
              ? "CHECKING..."
              : "UNREACHABLE"}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800 text-[8px] font-mono">
          <span className="text-neutral-500 block uppercase">LATENCY</span>
          <span className="text-indigo-400 font-bold">
            {latency ? `${latency}ms` : "--"}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800 text-[8px] font-mono">
          <span className="text-neutral-500 block uppercase">VERSION</span>
          <span className="text-neutral-300 font-bold">{version || "--"}</span>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-neutral-900/30 p-3 rounded-xl border border-neutral-800/50">
        <Info className="h-4 w-4 text-indigo-400 mt-0.5" />
        <p className="text-[9px] text-neutral-500 font-sans leading-normal">
          Diagnostic logs indicate the Python bridge is{" "}
          {status === "online" ? "successfully" : "not"} connected.
          {status === "online"
            ? " Gemini Vision API is ready for high-precision semantic cleaning."
            : " Falling back to local OpenCV adaptive thresholding for safety."}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          addNotification?.(
            "API Exception Simulator: Gemini AI went offline. Speech bubble cleaning fell back to local OpenCV threshold filters.",
            "error"
          )
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-900/40 bg-red-900/20 hover:bg-red-900/35 text-red-400 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer"
      >
        Trigger API Failure Alert simulation
      </button>
    </div>
  );
}
