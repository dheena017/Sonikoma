import React, { useState, useEffect } from "react";
import { Database, Play, Sparkles } from "lucide-react";
import * as api from "@/api";

interface YoloTrainingPanelProps {
  activeTab: string;
  addNotification: (msg: string, type: any) => void;
  fetchWithInterceptor: any;
}

export const YoloTrainingPanel: React.FC<YoloTrainingPanelProps> = ({
  activeTab,
  addNotification,
  fetchWithInterceptor,
}) => {
  const [sampleCount, setSampleCount] = useState<number | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingEpoch, setTrainingEpoch] = useState(0);
  const [totalTrainingEpochs, setTotalTrainingEpochs] = useState(0);
  const [trainingElapsed, setTrainingElapsed] = useState(0);
  const [trainingMetrics, setTrainingMetrics] = useState<any>({});
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [epochsToTrain, setEpochsToTrain] = useState(20);

  useEffect(() => {
    if (activeTab === "train") {
      const fetchCount = async () => {
        try {
          const res = await fetchWithInterceptor(
            "/api/image/training-data-count"
          );
          const data = await res.json();
          if (data && typeof data.count === "number") {
            setSampleCount(data.count);
          }
        } catch (err) {
          console.error("Failed to load training count:", err);
        }
      };
      fetchCount();
    }
  }, [activeTab, fetchWithInterceptor]);

  useEffect(() => {
    let intervalId: any = null;

    const checkStatus = async () => {
      try {
        const data = await api.getYoloTrainingStatus(fetchWithInterceptor);
        setIsTraining(data.is_training);
        setTrainingEpoch(data.epoch);
        setTotalTrainingEpochs(data.total_epochs);
        setTrainingElapsed(data.elapsed_seconds);
        setTrainingMetrics(data.metrics || {});
        setTrainingError(data.error);

        if (!data.is_training && isTraining) {
          const countRes = await fetchWithInterceptor(
            "/api/image/training-data-count"
          );
          const countData = await countRes.json();
          if (countData && typeof countData.count === "number") {
            setSampleCount(countData.count);
          }
        }
      } catch (err) {
        console.error("Failed to check training status:", err);
      }
    };

    checkStatus();

    if (activeTab === "train" || isTraining) {
      intervalId = setInterval(checkStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchWithInterceptor, isTraining, activeTab]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-neutral-800/80">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-purple-500/60 flex items-center justify-center shadow-[0_0_18px_rgba(168,85,247,0.35)] shrink-0">
          <Database className="h-5 w-5 text-purple-300" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            AI Model Fine-Tuning
          </h4>
          <p className="text-[9px] text-purple-300/80 font-mono mt-0.5">
            YOLO v8 Segment Neural Engine
          </p>
        </div>
      </div>

      {/* Stats / Flywheel Card */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-4 flex items-center justify-between shadow-xl">
        <div className="space-y-0.5">
          <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold tracking-wider block">
            Training Dataset
          </span>
          <span className="text-xs text-neutral-300 font-sans font-medium">
            Saved correction pairs:
          </span>
        </div>
        <div className="bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
          <span className="text-sm font-mono font-black text-purple-300">
            {sampleCount !== null ? sampleCount : "..."}
          </span>
          <span className="text-[9px] font-mono text-purple-400 uppercase font-bold">
            PAIRS
          </span>
        </div>
      </div>

      {/* Fine-Tuning Controller */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider block">
            Fine-Tuning Controls
          </span>
          {isTraining && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
          )}
        </div>

        {isTraining ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-neutral-300 font-mono">
              <span>
                Epoch {trainingEpoch} / {totalTrainingEpochs}
              </span>
              <span className="text-neutral-400">
                {Math.floor(trainingElapsed / 60)}m {trainingElapsed % 60}s
              </span>
            </div>
            <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800 p-0.5">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                style={{
                  width: `${
                    (trainingEpoch / (totalTrainingEpochs || 1)) * 100
                  }%`,
                }}
              ></div>
            </div>
            {Object.keys(trainingMetrics).length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-neutral-400 bg-neutral-950/90 p-3 rounded-2xl border border-neutral-800">
                {Object.entries(trainingMetrics).map(
                  ([k, v]: [string, any]) => (
                    <div key={k} className="flex justify-between">
                      <span>{k}:</span>
                      <span className="text-purple-400 font-bold">
                        {v.toFixed(4)}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Fine-tune the YOLO segmentation model directly on your corrected
              dataset. The server will hot-swap the fine-tuned weights
              automatically.
            </p>

            {trainingError && (
              <div className="text-[10px] text-red-400 bg-red-950/30 border border-red-900/40 p-3 rounded-2xl font-mono leading-relaxed">
                ⚠️ Error: {trainingError}
              </div>
            )}

            {!sampleCount || sampleCount === 0 ? (
              <div className="text-xs text-purple-300/90 bg-purple-950/30 border border-purple-900/40 p-3 rounded-2xl leading-relaxed">
                💡 <strong>Get started:</strong> Save at least 1 mask correction
                in the <strong>Eraser</strong> tool to unlock fine-tuning.
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold tracking-wider">
                    Epochs
                  </label>
                  <select
                    value={epochsToTrain}
                    onChange={(e) => setEpochsToTrain(Number(e.target.value))}
                    className="bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-2xl px-3 py-2.5 text-xs font-mono cursor-pointer focus:outline-none focus:border-purple-500/60"
                  >
                    <option value={5}>5 epochs (Fast)</option>
                    <option value={10}>10 epochs</option>
                    <option value={20}>20 epochs (Recommended)</option>
                    <option value={50}>50 epochs (Deep)</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      addNotification("Starting YOLO fine-tuning...", "info");
                      await api.startYoloTraining(
                        fetchWithInterceptor,
                        epochsToTrain
                      );
                      setIsTraining(true);
                    } catch (err: any) {
                      addNotification(
                        `Failed to start training: ${err.message}`,
                        "error"
                      );
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] border border-purple-400/30 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-purple-200 text-purple-200" />
                  <span>Start Fine-Tuning</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YoloTrainingPanel;
