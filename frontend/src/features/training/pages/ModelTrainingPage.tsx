import React, { useState, useEffect } from "react";
import { 
  Database, 
  Play, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Activity,
  Clock,
  TrendingUp,
  Trash2,
  X
} from "lucide-react";
import * as api from "@/api";

interface ModelTrainingPageProps {
  onNavigateHome: () => void;
  fetchWithInterceptor: any;
  addNotification: (message: string, type: any) => void;
}

const ModelTrainingPage: React.FC<ModelTrainingPageProps> = ({
  onNavigateHome,
  fetchWithInterceptor,
  addNotification
}) => {
  const [sampleCount, setSampleCount] = useState<number | null>(null);
  const [trainingDataList, setTrainingDataList] = useState<any[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingEpoch, setTrainingEpoch] = useState(0);
  const [totalTrainingEpochs, setTotalTrainingEpochs] = useState(0);
  const [trainingElapsed, setTrainingElapsed] = useState(0);
  const [trainingMetrics, setTrainingMetrics] = useState<any>({});
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [epochsToTrain, setEpochsToTrain] = useState(20);
  const [batchSizeToTrain, setBatchSizeToTrain] = useState(4);
  const [previewPair, setPreviewPair] = useState<any | null>(null);
  const [maskOpacity, setMaskOpacity] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);

  // Load sample count and list
  const loadData = async () => {
    try {
      const countRes = await fetchWithInterceptor("/api/image/training-data-count");
      const countData = await countRes.json();
      if (countData && typeof countData.count === "number") {
        setSampleCount(countData.count);
      }

      const list = await api.getYoloTrainingDataList(fetchWithInterceptor);
      setTrainingDataList(list || []);
    } catch (err) {
      console.error("Failed to load training data metrics/list:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Poll training status
  useEffect(() => {
    let intervalId: any = null;

    const checkStatus = async () => {
      try {
        const data = await api.getYoloTrainingStatus(fetchWithInterceptor);
        setStatusData(data);
        setIsTraining(data.is_training);
        setTrainingEpoch(data.epoch);
        setTotalTrainingEpochs(data.total_epochs);
        setTrainingElapsed(data.elapsed_seconds);
        setTrainingMetrics(data.metrics || {});
        setTrainingError(data.error);

        // If training just stopped, refresh the data too
        if (!data.is_training && isTraining) {
          loadData();
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to check training status:", err);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchWithInterceptor, isTraining]);

  const handleStartTraining = async () => {
    try {
      addNotification("Initializing YOLO fine-tuning pipeline...", "info");
      await api.startYoloTraining(fetchWithInterceptor, epochsToTrain, batchSizeToTrain);
      setIsTraining(true);
      addNotification("YOLO fine-tuning started in background!", "success");
    } catch (err: any) {
      addNotification(`Failed to start training: ${err.message}`, "error");
    }
  };

  const handleDeletePair = async (pairId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this training pair sample? This cannot be undone.")) return;
    try {
      await api.deleteYoloTrainingDataPair(fetchWithInterceptor, pairId);
      addNotification("Successfully deleted training sample.", "success");
      loadData();
    } catch (err: any) {
      addNotification(`Failed to delete sample: ${err.message}`, "error");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
            <span className="hover:text-purple-400 cursor-pointer" onClick={onNavigateHome}>
              Dashboard
            </span>
            <span>&gt;</span>
            <span className="text-purple-400">YOLO Model Trainer</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Database className="h-5 w-5" />
            </div>
            AI Model Fine-Tuning Hub
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Fine-tune the speech bubble segmentation engine on your corrected panel datasets
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns - Setup and config */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Dataset status card */}
            <div className="bg-[#111115] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-mono text-purple-400 uppercase font-black tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4" />
                Training Dataset
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                YOLO learns from human-corrected speech bubble masks. Corrections are generated by using the <strong>Eraser</strong> tool on panel layers and clicking <strong>Save Correction</strong>.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-mono block">COLLECTED DATA</span>
                    <span className="text-2xl font-black font-mono text-purple-400">{sampleCount ?? 0}</span>
                    <span className="text-xs text-neutral-400 font-sans ml-1.5">pairs</span>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    (sampleCount ?? 0) >= 10
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : (sampleCount ?? 0) > 0
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                    {(sampleCount ?? 0) >= 10 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                </div>

                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-neutral-500 font-mono block">AUTO-TRIGGER PROGRESS</span>
                      <span className="text-2xl font-black font-mono text-purple-400">
                        {statusData?.new_samples_count ?? 0} / 20
                      </span>
                      <span className="text-[10px] text-neutral-400 font-sans ml-1.5">samples</span>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Clock className="h-5 w-5 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((statusData?.new_samples_count ?? 0) / 20) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-neutral-500 font-mono block text-right">
                      {Math.round(Math.min(100, ((statusData?.new_samples_count ?? 0) / 20) * 100))}% toward next auto-run
                    </span>
                  </div>
                </div>
              </div>

              {(sampleCount ?? 0) < 10 && (
                <div className="bg-amber-950/20 border border-amber-850/40 rounded-xl p-3 flex items-start gap-2 text-amber-400 text-[10px] leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Recommendations:</strong> We recommend collecting at least 10–20 pairs for basic fine-tuning. Training with few samples might cause overfitting.
                  </div>
                </div>
              )}
            </div>

            {/* Fine-Tuning Setup */}
            <div className="bg-[#111115] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-mono text-purple-400 uppercase font-black tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Training Settings
              </h3>

              {/* Safety Lock Info */}
              {statusData?.lock_file_active && (
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-300 font-mono block">Safety Lock Engaged</span>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                      YOLO is fine-tuning under OS process <span className="text-amber-400 font-bold">PID: {statusData.lock_file_pid}</span>. Overlapping runs are blocked.
                    </p>
                  </div>
                </div>
              )}

              {/* GPU auto-detection state */}
              <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 font-mono">GPU ACCELERATION</span>
                {statusData?.gpu_available ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 font-bold uppercase tracking-wider">
                    Available (CUDA)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono text-amber-400 bg-amber-950/30 border border-amber-800/40 font-bold uppercase tracking-wider">
                    CPU Fallback
                  </span>
                )}
              </div>

              {isTraining ? (
                <div className="bg-purple-950/20 border border-purple-800/30 rounded-2xl p-4 text-purple-300 text-xs text-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
                  <p className="font-bold">Training is in progress...</p>
                  <p className="text-[10px] text-neutral-400 font-mono">Settings are locked during runs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider">
                      Epoch count
                    </label>
                    <select
                      value={epochsToTrain}
                      onChange={(e) => setEpochsToTrain(Number(e.target.value))}
                      className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-3 py-2 text-xs font-mono cursor-pointer focus:outline-none focus:border-purple-500"
                    >
                      <option value={5}>5 epochs (Quick Check / CPU)</option>
                      <option value={10}>10 epochs (Short run)</option>
                      <option value={20}>20 epochs (Recommended)</option>
                      <option value={50}>50 epochs (Deep tuning)</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider">
                      Batch size
                    </label>
                    <select
                      value={batchSizeToTrain}
                      onChange={(e) => setBatchSizeToTrain(Number(e.target.value))}
                      className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-3 py-2 text-xs font-mono cursor-pointer focus:outline-none focus:border-purple-500"
                    >
                      <option value={2}>2 (Low RAM / CPU)</option>
                      <option value={4}>4 (Balanced)</option>
                      <option value={8}>8 (High Speed / GPU)</option>
                    </select>
                  </div>

                  <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-3 text-[10px] text-neutral-400 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 text-neutral-300 font-bold">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Platform Details</span>
                    </div>
                    <p>Training runs locally in a non-blocking background process. It will automatically leverage GPU acceleration if available, otherwise it falls back gracefully to CPU.</p>
                  </div>

                  <button
                    disabled={(sampleCount ?? 0) === 0 || statusData?.lock_file_active}
                    onClick={handleStartTraining}
                    className={`w-full py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                      ((sampleCount ?? 0) === 0 || statusData?.lock_file_active)
                        ? "bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40"
                    }`}
                  >
                    <Play className="h-4 w-4" />
                    Start Fine-Tuning
                  </button>
                </div>
              )}
            </div>

            {/* Data Flywheel Cycle */}
            <div className="bg-[#111115] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-mono text-purple-400 uppercase font-black tracking-wider flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Data Flywheel Cycle
              </h3>

              <div className="space-y-3.5 text-[10px] font-mono text-neutral-400">
                <div className="flex gap-2.5 items-start">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 shrink-0 font-bold text-[9px]">1</div>
                  <p className="leading-relaxed">Use the <strong>Eraser tool</strong> on panel layers inside the Image Editor to clean speech bubbles.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 shrink-0 font-bold text-[9px]">2</div>
                  <p className="leading-relaxed">Click <strong>Save Correction</strong> to record the original image and corrected text mask pair.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 shrink-0 font-bold text-[9px]">3</div>
                  <p className="leading-relaxed font-bold text-neutral-300">The system monitors uploads. Reaching <span className="text-purple-400">20 new samples</span> triggers a background training run automatically.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 shrink-0 font-bold text-[9px]">4</div>
                  <p className="leading-relaxed">GPU acceleration is automatically selected if CUDA is available, else CPU defaults are used.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 shrink-0 font-bold text-[9px]">5</div>
                  <p className="leading-relaxed font-bold text-purple-300">After training, the newly trained model hot-swaps dynamically without server restart!</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Monitor */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Monitor Card */}
            <div className="bg-[#111115] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-xs font-mono text-purple-400 uppercase font-black tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Real-time Training Monitor
                </h3>
                {isTraining ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-purple-300 bg-purple-900/30 border border-purple-700/50 flex items-center gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800">
                    IDLE
                  </span>
                )}
              </div>

              {isTraining ? (
                <div className="space-y-6">
                  {/* Status metrics bar */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4 space-y-1">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
                        <Activity className="h-3 w-3" /> Progress
                      </span>
                      <span className="text-lg font-mono font-black text-white">{trainingEpoch} / {totalTrainingEpochs}</span>
                      <span className="text-[10px] text-neutral-400 block">epochs completed</span>
                    </div>

                    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4 space-y-1">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Elapsed
                      </span>
                      <span className="text-lg font-mono font-black text-white">
                        {Math.floor(trainingElapsed / 60)}m {trainingElapsed % 60}s
                      </span>
                      <span className="text-[10px] text-neutral-400 block">total running time</span>
                    </div>

                    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4 space-y-1">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
                        <Database className="h-3 w-3" /> Data Size
                      </span>
                      <span className="text-lg font-mono font-black text-white">{sampleCount ?? 0}</span>
                      <span className="text-[10px] text-neutral-400 block">active training pairs</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(trainingEpoch / (totalTrainingEpochs || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono block text-right">
                      {Math.round((trainingEpoch / (totalTrainingEpochs || 1)) * 100)}% Complete
                    </span>
                  </div>

                  {/* Validation metrics */}
                  {Object.keys(trainingMetrics).length > 0 ? (
                    <div className="space-y-3">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                        Validation Metrics
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(trainingMetrics).map(([k, v]: [string, any]) => (
                          <div key={k} className="bg-neutral-950/80 border border-white/5 p-3 rounded-2xl text-center">
                            <span className="text-[9px] text-neutral-500 font-mono block uppercase">{k.replace("(M)", "")}</span>
                            <span className="text-sm font-mono font-black text-purple-400 mt-1 block">
                              {typeof v === "number" ? v.toFixed(4) : v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-900/20 border border-white/5 p-6 rounded-2xl text-center text-xs text-neutral-500">
                      ⌛ Waiting for the first epoch to finish to gather metrics...
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <Database className="h-10 w-10 text-neutral-600" />
                  
                  {trainingError ? (
                    <div className="max-w-md bg-red-950/20 border border-red-900/30 p-4 rounded-2xl text-center space-y-2">
                      <h4 className="text-xs font-bold text-red-400 font-mono">Last Training Session Failed</h4>
                      <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">{trainingError}</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <h4 className="text-xs font-bold text-neutral-400">Tuner status: Idle</h4>
                      <p className="text-[10px] text-neutral-500 max-w-sm leading-relaxed">
                        Configure epochs and click "Start Fine-Tuning" to begin. The results will compile here as training runs.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
          
        </div>

        {/* Dataset Gallery Section */}
        <div className="bg-[#111115] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6 mt-8">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <h3 className="text-xs font-mono text-purple-400 uppercase font-black tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dataset Sample Viewer
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">
              {trainingDataList.length} human-corrected pairs registered
            </span>
          </div>

          {trainingDataList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingDataList.map((item) => (
                <div 
                  key={item.pair_id} 
                  onClick={() => setPreviewPair(item)}
                  className="group bg-neutral-900/60 hover:bg-neutral-900 border border-white/5 hover:border-purple-500/30 rounded-2xl p-4 transition-all duration-300 flex flex-col space-y-3 cursor-pointer hover:shadow-lg hover:shadow-purple-950/10 active:scale-[0.98]"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                    <span className="group-hover:text-purple-400 transition-colors">SAMPLE #{item.pair_id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeletePair(item.pair_id, e)}
                        className="p-1 hover:text-red-400 text-neutral-500 transition-colors rounded hover:bg-red-500/10"
                        title="Delete sample"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[8px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full uppercase font-bold">
                        Corrected Mask
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 h-36 relative overflow-hidden rounded-xl bg-black">
                    <div className="relative group/img h-full border-r border-white/5 overflow-hidden flex items-center justify-center">
                      <img 
                        src={item.original_url} 
                        alt="Original panel" 
                        className="max-h-full max-w-full object-contain group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-[8px] font-mono px-1.5 py-0.5 rounded text-neutral-400">Original</span>
                    </div>
                    <div className="relative group/img h-full overflow-hidden flex items-center justify-center bg-neutral-950">
                      <img 
                        src={item.mask_url} 
                        alt="Segment mask" 
                        className="max-h-full max-w-full object-contain filter invert opacity-80 group-hover/img:scale-105 transition-transform duration-305"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-[8px] font-mono px-1.5 py-0.5 rounded text-neutral-400">Mask</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <Database className="h-8 w-8 text-neutral-700 animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-400">No samples saved yet</h4>
                <p className="text-[10px] text-neutral-500 max-w-xs leading-relaxed">
                  Correct speech bubbles on panel splits inside the Image Editor, save them, and they'll display here dynamically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lightbox Modal Overlay */}
        {previewPair && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-w-4xl w-full mx-4 bg-[#0a0a0d] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono uppercase">Dataset Lightbox Inspector</h4>
                  <p className="text-[10px] text-neutral-400 font-mono">Sample ID: #{previewPair.pair_id}</p>
                </div>
                <button 
                  onClick={() => setPreviewPair(null)}
                  className="p-1.5 rounded-xl bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 items-center justify-center">
                {/* Interactive Mask Overlay Visualizer */}
                <div className="flex-1 w-full flex flex-col items-center space-y-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block font-bold">
                    Interactive Mask Overlay
                  </span>
                  <div className="relative h-64 md:h-80 w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/5">
                    {/* Original Image */}
                    <img 
                      src={previewPair.original_url} 
                      alt="Original" 
                      className="max-h-full max-w-full object-contain"
                    />
                    {/* Overlaid Mask */}
                    <img 
                      src={previewPair.mask_url} 
                      alt="Mask Overlay" 
                      className="absolute max-h-full max-w-full object-contain mix-blend-screen filter opacity-80"
                      style={{ 
                        opacity: maskOpacity,
                        filter: "invert(40%) sepia(80%) saturate(1000%) hue-rotate(90deg) brightness(1.2)"
                      }}
                    />
                  </div>

                  {/* Opacity Control slider */}
                  <div className="w-full max-w-xs space-y-1 pt-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold">
                      <span>Mask Opacity</span>
                      <span className="text-purple-400">{Math.round(maskOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={maskOpacity}
                      onChange={(e) => setMaskOpacity(Number(e.target.value))}
                      className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>

                {/* Side-by-Side Details */}
                <div className="flex-1 w-full flex flex-col gap-4">
                  <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-2xl space-y-2">
                    <h5 className="text-[10px] font-mono text-neutral-400 uppercase font-black tracking-wider">
                      Annotation Details
                    </h5>
                    <ul className="text-[10px] font-mono text-neutral-400 space-y-1.5 list-disc pl-4">
                      <li>Original Panel Image: <span className="text-neutral-300">original_{previewPair.pair_id}.png</span></li>
                      <li>Binary Segment Mask: <span className="text-neutral-300">mask_{previewPair.pair_id}.png</span></li>
                      <li>YOLO Format: <span className="text-purple-400">Class 0 (Polygon Segments)</span></li>
                      <li>Status: <span className="text-emerald-400 font-bold uppercase">Ready for training</span></li>
                    </ul>
                  </div>

                  <div className="bg-purple-950/10 border border-purple-900/20 p-4 rounded-2xl text-[10px] text-neutral-400 leading-relaxed">
                    <span className="font-bold text-neutral-300 block mb-1">Mask Hot-swap Info</span>
                    During training, this pair is split 80/20 into train/validation lists. The contours are automatically generated from your custom mask coordinates.
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                <button
                  onClick={() => setPreviewPair(null)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-mono transition font-bold border border-white/5 cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
              
            </div>
          </div>
        )}
      </>
      )}

    </div>
  );
};

export default React.memo(ModelTrainingPage);
