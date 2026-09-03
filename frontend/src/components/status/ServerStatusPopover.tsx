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
    <div className="w-[340px] sm:w-[380px] bg-[#111115]/95 backdrop-blur-xl border border-neutral-800/90 rounded-2xl shadow-2xl p-4 text-white font-sans z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isOnline 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {server.service || "Computational Backend"}
              </span>
              <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded border ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}>
                {status}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
              {isOnline ? `Uptime: ${server.uptime || "0s"} • Port ${server.backend_port || 8000}` : "FastAPI Engine Offline"}
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          title="Re-check status"
          className="p-1.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 transition active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      {/* Offline Action Banner */}
      {!isOnline && (
        <div className="mb-3 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Backend process is not running.</span>
          </div>
          <button
            onClick={handleStartBackend}
            disabled={isStarting}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow transition"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {isStarting ? "Starting Backend..." : "Start Backend Server"}
          </button>
        </div>
      )}

      {/* Live Resources Grid */}
      {isOnline && (
        <div className="space-y-3 mb-3">
          {/* CPU & Memory meters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0b0b0e] border border-neutral-800/80 rounded-xl p-2.5">
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase mb-1">
                <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-[#3B82F6]" /> CPU Load</span>
                <span className="font-mono text-white">{cpu.usage_percent ?? 0}%</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#2A2A2A] h-full transition-all duration-500"
                  style={{ width: `${Math.min(cpu.usage_percent || 0, 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-neutral-500 mt-1 font-mono">{cpu.cores_logical || 1} Cores Active</div>
            </div>

            <div className="bg-[#0b0b0e] border border-neutral-800/80 rounded-xl p-2.5">
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase mb-1">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-blue-400" /> RAM (RSS)</span>
                <span className="font-mono text-white">{memory.rss_mb ?? 0} MB</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(memory.used_percent || 0, 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-neutral-500 mt-1 font-mono">System: {Math.round((memory.used_mb || 0) / 1024 * 10) / 10} GB</div>
            </div>
          </div>

          {/* Database & GPU Row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#0b0b0e] border border-neutral-800/80 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase mb-1">
                <span className="flex items-center gap-1"><Database className="w-3 h-3 text-emerald-400" /> SQLite</span>
                <span className="font-mono text-emerald-400">{database.latency_ms ?? 0}ms</span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-300 font-mono mt-1">
                <span>{counts.panels ?? 0} Panels</span>
                <span>{counts.chapters ?? 0} Chapters</span>
              </div>
            </div>

            <div className="bg-[#0b0b0e] border border-neutral-800/80 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase mb-1">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> GPU</span>
                <span className={`text-[9px] font-bold uppercase px-1 rounded ${gpu.available ? "text-emerald-400 bg-emerald-500/10" : "text-neutral-400 bg-neutral-800"}`}>
                  {gpu.available ? "CUDA" : "CPU"}
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 truncate mt-1">
                {gpu.devices && gpu.devices.length > 0 ? gpu.devices[0].name : "CPU Inference Engine"}
              </div>
            </div>
          </div>

          {/* AI Providers & Engines Quick Badges */}
          <div className="bg-[#0b0b0e] border border-neutral-800/80 rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-400" /> AI & Engines</span>
              <span className="text-[9px] font-mono text-neutral-500">{jobQueue.running || 0} active jobs</span>
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
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    item.ok
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                      : "bg-neutral-800 text-neutral-500 border-neutral-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-emerald-400" : "bg-neutral-600"}`} />
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Link to Full Health Dashboard */}
      <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-xs">
        <span className="text-[10px] text-neutral-500 font-mono">
          PID {server.process_id || "N/A"} • Python {server.python_version || "3.12"}
        </span>
        <a
          href="/admin/health"
          onClick={() => { if (onClose) onClose(); }}
          className="flex items-center gap-1 text-indigo-400 hover:text-neutral-300 font-semibold transition text-[11px]"
        >
          Full Diagnostics <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default ServerStatusPopover;
