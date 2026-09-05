import React, { useState, useEffect, useRef } from "react";
import {
  Server,
  Activity,
  Database,
  Cpu,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Play,
  Clock,
  Terminal,
  Layers,
  Sparkles,
} from "lucide-react";
import { getBackendStatus, startBackend } from "@/api";

interface ServerStatusPopoverProps {
  status: "online" | "offline" | "checking";
  onClose?: () => void;
  onRecheck?: () => void;
}

export const ServerStatusPopover: React.FC<ServerStatusPopoverProps> = ({
  status,
  onClose,
  onRecheck,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getBackendStatus();
      if (res && res.success) {
        setData(res);
      } else if (res) {
        setData(res);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Cannot reach backend status API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleStartBackend = async () => {
    setIsStarting(true);
    try {
      await startBackend();
      if (onRecheck) onRecheck();
      await fetchDetails();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to start backend process");
    } finally {
      setIsStarting(false);
    }
  };

  const handleRefresh = async () => {
    if (onRecheck) onRecheck();
    await fetchDetails();
  };

  const server = data?.server || {};
  const resources = data?.resources || {};
  const cpu = resources?.cpu || {};
  const memory = resources?.memory || {};
  const gpu = resources?.gpu || {};
  const database = data?.database || {};
  const counts = database?.counts || {};
  const storage = data?.storage || {};
  const ai = data?.ai_providers || {};
  const capabilities = data?.capabilities || {};
  const jobQueue = data?.job_queue || {};

  const isOnline = status === "online" || server.status === "operational";

  return (
    <div className="w-[340px] sm:w-[385px] bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-5 text-white font-sans z-50 animate-in fade-in zoom-in-95 duration-150 select-none relative">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 blur-[1px]" />

      {/* Top Banner Header */}
      <div className="flex items-center justify-between border-b border-neutral-850 pb-3.5 mb-3.5 pt-1">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center shrink-0 ${
            isOnline 
              ? "bg-white/10 border-white/20 text-white" 
              : "bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border-rose-500/30 text-rose-400"
          }`}>
            <Server className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {server.service || "Computational Backend"}
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full border ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}>
                {status}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 font-normal">
              {isOnline ? `Uptime: ${server.uptime || "0s"} • Port ${server.backend_port || 8000}` : "FastAPI Engine Offline"}
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          title="Re-check status"
          className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
        </button>
      </div>

      {/* Offline Action Banner */}
      {!isOnline && (
        <div className="mb-3.5 p-3.5 bg-rose-950/40 border border-rose-800/40 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Backend process is currently offline.</span>
          </div>
          <button
            onClick={handleStartBackend}
            disabled={isStarting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-550 hover:to-amber-550 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {isStarting ? "Starting Backend..." : "Start Backend Server"}
          </button>
        </div>
      )}

      {/* Live Resources Grid */}
      {isOnline && (
        <div className="space-y-3 mb-3.5">
          {/* CPU & Memory meters */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-white" /> CPU Load</span>
                <span className="font-mono text-white font-bold">{cpu.usage_percent ?? 0}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(cpu.usage_percent || 0, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-neutral-400 font-sans">{cpu.cores_logical || 1} Cores Active</div>
            </div>

            <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-400" /> RAM (RSS)</span>
                <span className="font-mono text-white font-bold">{memory.rss_mb ?? 0} MB</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(memory.used_percent || 0, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-neutral-400 font-sans">System: {Math.round((memory.used_mb || 0) / 1024 * 10) / 10} GB</div>
            </div>
          </div>

          {/* Database & GPU Row */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-3 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-400" /> SQLite</span>
                <span className="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">{database.latency_ms ?? 0}ms</span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-300 font-medium pt-0.5">
                <span>{counts.panels ?? 0} Panels</span>
                <span>{counts.chapters ?? 0} Chapters</span>
              </div>
            </div>

            <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-3 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> GPU</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border ${gpu.available ? "text-purple-300 bg-purple-500/10 border-purple-500/20" : "text-neutral-400 bg-neutral-800 border-white/5"}`}>
                  {gpu.available ? "CUDA" : "CPU"}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 truncate pt-0.5">
                {gpu.devices && gpu.devices.length > 0 ? gpu.devices[0].name : "CPU Inference Engine"}
              </div>
            </div>
          </div>

          {/* AI Providers & Engines Quick Badges */}
          <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-3.5">
            <div className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI & Engines</span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">{jobQueue.running || 0} active jobs</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: "Gemini", ok: ai.gemini },
                { name: "HuggingFace", ok: ai.huggingface },
                { name: "FFmpeg", ok: capabilities.ffmpeg?.available },
                { name: "OpenCV", ok: capabilities.opencv?.available },
                { name: "PyTorch", ok: capabilities.torch?.available },
                { name: "YOLO", ok: capabilities.models?.yolov8n_seg?.exists || capabilities.ultralytics?.available },
                { name: "EasyOCR", ok: capabilities.easyocr?.available },
                { name: "Edge-TTS", ok: capabilities.edge_tts?.available },
              ].map((item) => (
                <span
                  key={item.name}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                    item.ok
                      ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 text-neutral-100 border-white/10 shadow-xs hover:border-white/20"
                      : "bg-neutral-900/80 text-neutral-500 border-white/5"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse" : "bg-neutral-600"}`} />
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Link to Full Health Dashboard */}
      <div className="pt-3 border-t border-neutral-850 flex items-center justify-between text-xs">
        <span className="text-[11px] text-neutral-400 font-sans">
          PID {server.process_id || "N/A"} • Python {server.python_version || "3.12"}
        </span>
        <a
          href="/admin/health"
          onClick={() => { if (onClose) onClose(); }}
          className="flex items-center gap-1.5 text-white hover:text-neutral-300 font-bold transition-all text-xs hover:underline cursor-pointer"
        >
          Full Diagnostics <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default ServerStatusPopover;
