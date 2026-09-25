import React, { useState, useEffect, useCallback } from "react";
import {
  Brain,
  RefreshCw,
  Play,
  Trash2,
  Database,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  BarChart2,
  Zap,
  Shield,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  Lock,
  Cpu,
} from "lucide-react";
import * as api from "@/api";

interface AdminTrainingTabProps {
  fetchWithInterceptor: typeof fetch;
  addNotification?: (msg: string, type?: string) => void;
}

interface TrainingStatus {
  is_training: boolean;
  epoch: number;
  total_epochs: number;
  elapsed_seconds: number;
  training_pairs: number;
  metrics: Record<string, number>;
  error: string | null;
  last_trained_count: number;
  current_count: number;
  new_samples_since_last_training: number;
  lock_file_exists: boolean;
  lock_file_pid: number | null;
  lock_file_active: boolean;
}

interface TrainingPair {
  pair_id: string;
  original_url: string;
  mask_url: string | null;
}

const AUTO_TRIGGER_THRESHOLD = 20;

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function AdminTrainingTab({
  fetchWithInterceptor,
  addNotification,
}: AdminTrainingTabProps) {
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [pairs, setPairs] = useState<TrainingPair[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [epochsToTrain, setEpochsToTrain] = useState(20);
  const [batchSize, setBatchSize] = useState(4);
  const [startingTraining, setStartingTraining] = useState(false);
  const [deletingPair, setDeletingPair] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [previewPair, setPreviewPair] = useState<TrainingPair | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoadingStatus(true);
      try {
        const data = await api.getYoloTrainingStatus(fetchWithInterceptor);
        setStatus(data as TrainingStatus);
      } catch (err) {
        console.error("Failed to fetch training status:", err);
      } finally {
        if (showLoader) setLoadingStatus(false);
      }
    },
    [fetchWithInterceptor]
  );

  const fetchPairs = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoadingPairs(true);
      try {
        const data = await api.getYoloTrainingDataList(fetchWithInterceptor);
        setPairs(data as TrainingPair[]);
      } catch (err) {
        console.error("Failed to fetch training pairs:", err);
      } finally {
        if (showLoader) setLoadingPairs(false);
      }
    },
    [fetchWithInterceptor]
  );

  useEffect(() => {
    fetchStatus(true);
    fetchPairs(true);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(
      () => {
        fetchStatus(false);
      },
      status?.is_training ? 3000 : 10000
    );
    return () => clearInterval(interval);
  }, [autoRefresh, status?.is_training, fetchStatus]);

  const handleStartTraining = async () => {
    if (status?.is_training) return;
    setStartingTraining(true);
    try {
      await api.startYoloTraining(fetchWithInterceptor, epochsToTrain, batchSize);
      addNotification?.(
        `YOLO fine-tuning started — ${epochsToTrain} epochs, batch ${batchSize}`,
        "success"
      );
      await fetchStatus(false);
    } catch (err: any) {
      addNotification?.(`Failed to start training: ${err.message}`, "error");
    } finally {
      setStartingTraining(false);
    }
  };

  const handleDeletePair = async (pairId: string) => {
    setDeletingPair(pairId);
    try {
      await api.deleteYoloTrainingDataPair(fetchWithInterceptor, pairId);
      setPairs((prev) => prev.filter((p) => p.pair_id !== pairId));
      addNotification?.("Training pair deleted", "success");
      await fetchStatus(false);
    } catch (err: any) {
      addNotification?.(`Failed to delete pair: ${err.message}`, "error");
    } finally {
      setDeletingPair(null);
    }
  };

  const progress =
    status && status.total_epochs > 0
      ? Math.round((status.epoch / status.total_epochs) * 100)
      : 0;

  const samplesUntilAutoTrigger = status
    ? Math.max(0, AUTO_TRIGGER_THRESHOLD - status.new_samples_since_last_training)
    : AUTO_TRIGGER_THRESHOLD;

  const autoTriggerProgress = status
    ? Math.min(
        100,
        (status.new_samples_since_last_training / AUTO_TRIGGER_THRESHOLD) * 100
      )
    : 0;

  const StatCard = ({
    label,
    value,
    sub,
    icon: Icon,
    iconColor,
    glowColor,
    pulse,
  }: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    iconColor: string;
    glowColor: string;
    pulse?: boolean;
  }) => (
    <div className="relative bg-gradient-to-br from-[#111117] to-[#0d0d12] border border-white/[0.07] rounded-2xl p-5 overflow-hidden hover:border-white/[0.12] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 ${glowColor} pointer-events-none`} />
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.07] shrink-0">
          <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
        </div>
        {pulse && (
          <span className="flex h-2.5 w-2.5 relative mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400" />
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white mt-1 tracking-tight">{value}</p>
        {sub && <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Brain className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">YOLO Fine-Tuning Engine</h2>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">YOLOv8-seg · Speech Bubble Detector · Data Flywheel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchStatus(false); fetchPairs(false); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-neutral-400 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${autoRefresh ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/[0.04] border-white/[0.07] text-neutral-400"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"}`} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Dataset Pairs"
          value={loadingStatus ? "—" : (status?.current_count ?? 0)}
          sub="correction samples total"
          icon={Database}
          iconColor="text-blue-400"
          glowColor="bg-blue-500"
        />
        <StatCard
          label="Training Status"
          value={loadingStatus ? "—" : status?.is_training ? `Epoch ${status.epoch}/${status.total_epochs}` : "Idle"}
          sub={status?.is_training ? `${formatElapsed(status.elapsed_seconds)} elapsed` : "Ready to fine-tune"}
          icon={status?.is_training ? Cpu : Shield}
          iconColor={status?.is_training ? "text-purple-400" : "text-emerald-400"}
          glowColor={status?.is_training ? "bg-purple-500" : "bg-emerald-500"}
          pulse={status?.is_training}
        />
        <StatCard
          label="New Since Last Run"
          value={loadingStatus ? "—" : (status?.new_samples_since_last_training ?? 0)}
          sub={`${samplesUntilAutoTrigger} until auto-trigger`}
          icon={TrendingUp}
          iconColor="text-amber-400"
          glowColor="bg-amber-500"
        />
        <StatCard
          label="Last Run Dataset Size"
          value={loadingStatus ? "—" : `${status?.last_trained_count ?? 0}`}
          sub="pairs at last training run"
          icon={Clock}
          iconColor="text-cyan-400"
          glowColor="bg-cyan-500"
        />
      </div>

      {/* Training in Progress Banner */}
      {status?.is_training && (
        <div className="relative bg-gradient-to-r from-[#1a1025] via-[#151030] to-[#1a1025] border border-purple-500/30 rounded-2xl p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-blue-600/5 to-purple-600/5 pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <div className="w-3 h-3 rounded-full bg-purple-400 absolute top-0 left-0 animate-ping opacity-75" />
              </div>
              <span className="text-sm font-black text-white tracking-wide">Training in Progress</span>
            </div>
            <span className="text-xs text-purple-300 font-mono bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              {formatElapsed(status.elapsed_seconds)} elapsed
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>Epoch {status.epoch} / {status.total_epochs}</span>
              <span className="text-purple-300 font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {Object.keys(status.metrics).length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(status.metrics).map(([k, v]) => (
                <div key={k} className="bg-black/30 border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest truncate">{k}</p>
                  <p className="text-sm font-black text-purple-300 mt-1">{typeof v === "number" ? v.toFixed(4) : String(v)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {status?.error && !status.is_training && (
        <div className="bg-red-950/30 border border-red-900/40 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-300">Last Training Failed</p>
            <p className="text-[11px] text-red-400/80 font-mono mt-1 leading-relaxed">{status.error}</p>
          </div>
        </div>
      )}

      {/* Auto-Trigger Progress */}
      <div className="bg-gradient-to-br from-[#111117] to-[#0d0d12] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white tracking-wide">Auto-Trigger Progress</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">Fires at {AUTO_TRIGGER_THRESHOLD} new samples</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-neutral-400">
              {status?.new_samples_since_last_training ?? 0} / {AUTO_TRIGGER_THRESHOLD} new samples
            </span>
            <span className={autoTriggerProgress >= 100 ? "text-emerald-400 font-bold" : "text-amber-400"}>
              {samplesUntilAutoTrigger === 0 ? "✓ Threshold reached" : `${samplesUntilAutoTrigger} to go`}
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${autoTriggerProgress}%` }}
            />
          </div>
        </div>
        {status?.lock_file_active && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-400 font-mono">
            <Lock className="w-3 h-3" />
            Lock file active — PID {status.lock_file_pid} — may need manual cleanup
          </div>
        )}
      </div>

      {/* Fine-Tuning Controls */}
      <div className="bg-gradient-to-br from-[#111117] to-[#0d0d12] border border-white/[0.07] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white tracking-wide">Fine-Tuning Controls</span>
        </div>

        {status?.is_training ? (
          <div className="flex items-center gap-3 py-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 absolute top-0 left-0 animate-ping" />
            </div>
            <p className="text-sm text-neutral-300">Training job is running — controls locked</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Fine-tune the YOLOv8 speech-bubble segmentation model on human-corrected masks.
              The server hot-swaps the new weights immediately after training completes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">Epochs</label>
                <select
                  value={epochsToTrain}
                  onChange={(e) => setEpochsToTrain(Number(e.target.value))}
                  className="w-full bg-[#0d0d12] border border-white/[0.08] hover:border-white/[0.15] text-neutral-200 rounded-xl px-4 py-2.5 text-xs font-mono cursor-pointer focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  <option value={5}>5 epochs — Quick Test</option>
                  <option value={10}>10 epochs — Light Run</option>
                  <option value={20}>20 epochs — Recommended</option>
                  <option value={30}>30 epochs — Extended</option>
                  <option value={50}>50 epochs — Deep Train</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">Batch Size</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full bg-[#0d0d12] border border-white/[0.08] hover:border-white/[0.15] text-neutral-200 rounded-xl px-4 py-2.5 text-xs font-mono cursor-pointer focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  <option value={2}>2 — Minimal RAM</option>
                  <option value={4}>4 — Default</option>
                  <option value={8}>8 — GPU-heavy</option>
                  <option value={16}>16 — High VRAM</option>
                </select>
              </div>
            </div>

            {(status?.current_count ?? 0) === 0 ? (
              <div className="flex items-start gap-3 bg-blue-950/30 border border-blue-900/30 rounded-xl p-4">
                <Layers className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-300">No dataset yet</p>
                  <p className="text-[11px] text-blue-400/70 mt-0.5">
                    Users save corrections in the Image Editor's Eraser tool. Starter pairs will be auto-seeded if you trigger training now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-900/25 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300">
                  <strong>{status?.current_count}</strong> correction pairs ready for training
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={startingTraining}
              onClick={handleStartTraining}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.5)] border border-blue-400/30 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {startingTraining ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Starting…</>
              ) : (
                <><Play className="w-4 h-4 fill-white" />Start Fine-Tuning</>
              )}
            </button>
          </>
        )}
      </div>

      {/* Dataset Gallery */}
      <div className="bg-gradient-to-br from-[#111117] to-[#0d0d12] border border-white/[0.07] rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => { setShowGallery((v) => { if (!v) fetchPairs(true); return !v; }); }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <ImageIcon className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold text-white tracking-wide">Dataset Gallery</span>
            <span className="text-[10px] font-mono bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-full text-neutral-400">
              {loadingPairs ? "…" : `${pairs.length} pairs`}
            </span>
          </div>
          {showGallery ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>

        {showGallery && (
          <div className="border-t border-white/[0.06] p-5">
            {loadingPairs ? (
              <div className="flex items-center justify-center py-12 gap-3 text-neutral-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs font-mono">Loading pairs…</span>
              </div>
            ) : pairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-600">
                <Database className="w-8 h-8" />
                <p className="text-xs font-mono">No correction pairs saved yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {pairs.map((pair) => (
                  <div
                    key={pair.pair_id}
                    className="group relative bg-black/30 border border-white/[0.06] rounded-xl overflow-hidden aspect-square hover:border-white/[0.15] transition-all duration-200"
                  >
                    <img
                      src={pair.original_url}
                      alt={`Pair ${pair.pair_id}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewPair(pair)}
                        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                      >
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePair(pair.pair_id)}
                        disabled={deletingPair === pair.pair_id}
                        className="w-8 h-8 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 flex items-center justify-center cursor-pointer transition-all active:scale-90 disabled:opacity-50"
                      >
                        {deletingPair === pair.pair_id ? (
                          <RefreshCw className="w-3.5 h-3.5 text-red-400 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                      <p className="text-[8px] font-mono text-neutral-400 truncate">{pair.pair_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewPair && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewPair(null)}
        >
          <div
            className="bg-[#111117] border border-white/[0.08] rounded-3xl p-6 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-black text-white">Correction Pair</h3>
                <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{previewPair.pair_id}</p>
              </div>
              <button
                onClick={() => setPreviewPair(null)}
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Original Panel</p>
                <div className="rounded-xl overflow-hidden border border-white/[0.06] aspect-square bg-black/30">
                  <img src={previewPair.original_url} alt="Original" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Corrected Mask</p>
                <div className="rounded-xl overflow-hidden border border-white/[0.06] aspect-square bg-black/30">
                  {previewPair.mask_url ? (
                    <img src={previewPair.mask_url} alt="Mask" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs font-mono text-neutral-600">No mask saved</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => { setPreviewPair(null); handleDeletePair(previewPair.pair_id); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete This Pair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Engine Info Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-mono text-neutral-600">
        <div className="bg-[#0d0d12] border border-white/[0.04] rounded-xl px-4 py-3 flex items-center gap-2.5">
          <BarChart2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
          <span>80/20 train/val split · auto-seeded if dataset is empty</span>
        </div>
        <div className="bg-[#0d0d12] border border-white/[0.04] rounded-xl px-4 py-3 flex items-center gap-2.5">
          <Zap className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
          <span>GPU auto-detected · fallback CPU training</span>
        </div>
        <div className="bg-[#0d0d12] border border-white/[0.04] rounded-xl px-4 py-3 flex items-center gap-2.5">
          <CheckCircle className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
          <span>Weights hot-swapped to manga_finetuned.pt on completion</span>
        </div>
      </div>
    </div>
  );
}

export default AdminTrainingTab;
