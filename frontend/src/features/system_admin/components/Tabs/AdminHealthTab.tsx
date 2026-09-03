import React, { useState, useEffect } from "react";
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
  Radio,
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  FolderArchive,
  Network
} from "lucide-react";
import { getBackendStatus } from "@/api";

export function AdminHealthTab({ fetchWithInterceptor }: any) {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getBackendStatus(fetchWithInterceptor);
      if (res && res.success) {
        setStatusData(res);
        setLastUpdated(new Date());
      } else if (res) {
        setStatusData(res);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch backend status:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(false), 8000); // Auto-refresh every 8s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-sm font-medium text-neutral-400">Loading authentic backend diagnostics...</span>
      </div>
    );
  }

  const server = statusData?.server || {};
  const resources = statusData?.resources || {};
  const cpu = resources?.cpu || {};
  const memory = resources?.memory || {};
  const gpu = resources?.gpu || {};
  const database = statusData?.database || {};
  const counts = database?.counts || {};
  const storage = statusData?.storage || {};
  const partition = storage?.disk_partition || {};
  const directories = storage?.directories || {};
  const caches = statusData?.caches || {};
  const ai = statusData?.ai_providers || {};
  const capabilities = statusData?.capabilities || {};
  const jobQueue = statusData?.job_queue || {};
  const network = statusData?.network || {};

  const isOperational = server.status === "operational";

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111115] border border-neutral-800/80 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOperational ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" : "bg-amber-500"}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">{server.service || "Sonikoma Backend"}</span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-300 rounded border border-neutral-700">
                v{server.version || "1.0.0"}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                isOperational 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {server.status || "operational"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {server.platform} • Python {server.python_version} • PID {server.process_id} • Port {server.backend_port}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" /> Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1: Core Vital Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Load */}
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5 font-mono">
              <Cpu className="w-4 h-4 text-[#3B82F6]" /> CPU Load
            </span>
            <span className="text-lg font-bold text-[#E5E5E5] font-mono">{cpu.usage_percent || 0}%</span>
          </div>
          <div className="w-full bg-[#121212] border border-[#2F2F2F] h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-700 ${
                (cpu.usage_percent || 0) > 80 ? "bg-[#EF4444]" : "bg-[#3B82F6]"
              }`}
              style={{ width: `${Math.min(cpu.usage_percent || 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#9CA3AF] font-mono">
            <span>{cpu.cores_logical || 1} Logical Cores</span>
            <span>{cpu.cores_physical ? `${cpu.cores_physical} Physical` : "Active"}</span>
          </div>
        </div>

        {/* RAM Usage */}
        <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-400" /> Memory RSS
            </span>
            <span className="text-lg font-bold text-white font-mono">{memory.rss_mb || 0} MB</span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700"
              style={{ width: `${Math.min(memory.used_percent || 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>System: {Math.round((memory.used_mb || 0) / 1024 * 10) / 10} GB Used</span>
            <span>{Math.round((memory.total_mb || 0) / 1024 * 10) / 10} GB Total</span>
          </div>
        </div>

        {/* Database Telemetry */}
        <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" /> Database Latency
            </span>
            <span className={`text-lg font-bold font-mono ${
              (database.latency_ms || 0) < 30 ? "text-emerald-400" : "text-amber-400"
            }`}>
              {database.latency_ms || 0} ms
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-500">Engine</span>
              <span className="font-mono text-neutral-200">{database.engine || "SQLite"} ({database.journal_mode || "WAL"})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Integrity</span>
              <span className="text-emerald-400 font-semibold uppercase text-[10px]">{database.integrity || "OK"}</span>
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
            <span>DB Size: {Math.round((database.file_size_bytes || 0) / 1024)} KB</span>
            <span>{database.page_count || 0} Pages</span>
          </div>
        </div>

        {/* GPU & Hardware Acceleration */}
        <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> GPU Acceleration
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
              gpu.available 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-neutral-800 text-neutral-400 border-neutral-700"
            }`}>
              {gpu.available ? "CUDA Active" : "CPU Fallback"}
            </span>
          </div>
          <div className="text-xs text-neutral-300 mb-2 truncate">
            {gpu.devices && gpu.devices.length > 0 ? (
              <span className="font-medium">{gpu.devices[0].name}</span>
            ) : (
              <span className="text-neutral-500">No discrete CUDA GPU attached</span>
            )}
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
            <span>CUDA: {gpu.cuda_version || "N/A"}</span>
            <span>{gpu.device_count || 0} Device(s)</span>
          </div>
        </div>
      </div>

      {/* Row 2: Database Table Records & Background Jobs Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Database Table Records Matrix */}
        <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" /> Database Live Table Records
            </h3>
            <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
              {Math.round((database.file_size_bytes || 0) / 1024)} KB on disk
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
            {[
              { label: "Users", count: counts.users, color: "text-blue-400" },
              { label: "Series", count: counts.series, color: "text-[#3B82F6]" },
              { label: "Chapters", count: counts.chapters, color: "text-indigo-400" },
              { label: "Panels", count: counts.panels, color: "text-emerald-400" },
              { label: "Jobs", count: counts.jobs, color: "text-amber-400" },
              { label: "Scrapes", count: counts.scrape_sessions, color: "text-rose-400" },
              { label: "Logs", count: counts.system_logs, color: "text-blue-400" },
              { label: "Token Logs", count: counts.token_usage_logs, color: "text-violet-400" },
              { label: "Transactions", count: counts.credit_transactions, color: "text-teal-400" },
            ].map((item) => (
              <div key={item.label} className="bg-[#0b0b0e] border border-neutral-800/80 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold font-mono ${item.color}`}>{item.count ?? 0}</div>
                <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Jobs Queue State */}
        <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Background Job Queue
              </h3>
              <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                {jobQueue.total_jobs || 0} Lifetime Tasks
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-[#0b0b0e] border border-neutral-800 rounded-lg p-2.5 text-center">
                <div className="text-xs text-neutral-500 uppercase font-bold">Queued</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-1">{jobQueue.queued || 0}</div>
              </div>
              <div className="bg-[#0b0b0e] border border-neutral-800 rounded-lg p-2.5 text-center">
                <div className="text-xs text-neutral-500 uppercase font-bold">Running</div>
                <div className="text-lg font-bold text-blue-400 font-mono mt-1">{jobQueue.running || 0}</div>
              </div>
              <div className="bg-[#0b0b0e] border border-neutral-800 rounded-lg p-2.5 text-center">
                <div className="text-xs text-neutral-500 uppercase font-bold">Completed</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1">{jobQueue.completed || 0}</div>
              </div>
              <div className="bg-[#0b0b0e] border border-neutral-800 rounded-lg p-2.5 text-center">
                <div className="text-xs text-neutral-500 uppercase font-bold">Failed</div>
                <div className="text-lg font-bold text-rose-400 font-mono mt-1">{jobQueue.failed || 0}</div>
              </div>
            </div>

            {/* Recent Jobs Sub-table */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Recent Job Executions</div>
              {jobQueue.recent_jobs && jobQueue.recent_jobs.length > 0 ? (
                jobQueue.recent_jobs.slice(0, 3).map((job: any) => (
                  <div key={job.job_id} className="flex items-center justify-between p-2 bg-[#0b0b0e] border border-neutral-800/80 rounded text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-neutral-400 text-[11px] truncate max-w-[120px]">{job.job_id}</span>
                      <span className="text-neutral-300 font-medium">{job.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500">{job.progress}%</span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                        job.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        job.status === "FAILED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-neutral-500 italic p-3 text-center bg-[#0b0b0e] rounded">No background jobs executed yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Processing Engines, Tools & AI Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Processing Capabilities & Binaries */}
        <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-6">
          <h3 className="font-bold text-white mb-5 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" /> Core Computational Engines
          </h3>
          <div className="space-y-2.5">
            {[
              { name: "FFmpeg Media Encoder", cap: capabilities.ffmpeg, desc: capabilities.ffmpeg?.version || "System video rendering" },
              { name: "OpenCV (cv2)", cap: capabilities.opencv, desc: `Vision engine v${capabilities.opencv?.version || "installed"}` },
              { name: "PyTorch Deep Learning", cap: capabilities.torch, desc: `Inference runtime v${capabilities.torch?.version || "installed"}` },
              { name: "YOLO Segmentation", cap: capabilities.ultralytics, desc: capabilities.models?.yolov8n_seg?.exists ? "yolov8n-seg.pt loaded" : "Model ready" },
              { name: "EasyOCR Vision Model", cap: capabilities.easyocr, desc: "Speech bubble text reader" },
              { name: "Edge-TTS Speech Synth", cap: capabilities.edge_tts, desc: "Neural audio synthesis" },
              { name: "MoviePy Video FX", cap: capabilities.moviepy, desc: "Compositing timeline renderer" },
            ].map((tool) => (
              <div key={tool.name} className="flex items-center justify-between p-2.5 bg-[#0b0b0e] border border-neutral-800/80 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  {tool.cap?.available ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-200">{tool.name}</div>
                    <div className="text-[10px] text-neutral-500 truncate max-w-[280px]">{tool.desc}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  tool.cap?.available 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-neutral-800 text-neutral-500 border-neutral-700"
                }`}>
                  {tool.cap?.available ? "Ready" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Providers & Storage Directories */}
        <div className="space-y-6">
          {/* AI Providers Integration Status */}
          <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> AI Provider API Keys
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { name: "Google Gemini", active: ai.gemini },
                { name: "Hugging Face", active: ai.huggingface },
                { name: "OpenAI GPT", active: ai.openai },
                { name: "Anthropic Claude", active: ai.anthropic },
                { name: "YouTube OAuth", active: ai.youtube_oauth },
                { name: "Internet DNS", active: network.online },
              ].map((provider) => (
                <div key={provider.name} className="flex items-center justify-between p-2.5 bg-[#0b0b0e] border border-neutral-800/80 rounded-lg">
                  <span className="text-xs text-neutral-300 font-medium">{provider.name}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    provider.active ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-neutral-700"
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Storage Directories & Partition */}
          <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-400" /> Storage Breakdown
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">
                {Math.round((storage.total_app_storage_bytes || 0) / (1024 * 1024) * 10) / 10} MB App Total
              </span>
            </div>

            {/* Disk Partition Bar */}
            <div className="bg-[#0b0b0e] border border-neutral-800 p-3 rounded-lg mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400">Drive Partition Free</span>
                <span className="font-mono text-neutral-200 font-semibold">
                  {Math.round((partition.free_bytes || 0) / (1024 * 1024 * 1024) * 10) / 10} GB Free / {Math.round((partition.total_bytes || 0) / (1024 * 1024 * 1024) * 10) / 10} GB
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-700"
                  style={{ width: `${partition.used_percent || 0}%` }}
                />
              </div>
            </div>

            {/* Sub-directories list */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(directories).map(([name, dir]: [string, any]) => (
                <div key={name} className="flex justify-between p-2 bg-[#0b0b0e] border border-neutral-800/60 rounded">
                  <span className="text-neutral-400 capitalize">{name.replace("_", " ")}</span>
                  <span className="font-mono text-neutral-200">{Math.round((dir.size_bytes || 0) / 1024)} KB</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
