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
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] flex items-center justify-center  shrink-0">
          <Database className="h-5 w-5 text-[#3B82F6]" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            AI Model Fine-Tuning
          </h4>
          <p className="text-[9.5px] text-neutral-400 font-mono mt-0.5">
            YOLO v8 Segment Neural Engine
          </p>
        </div>
      </div>

      {/* Stats / Training Dataset Card */}
      <div className="bg-[#181924]/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="space-y-0.5">
          <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold tracking-wider block">
            Training Dataset
          </span>
          <span className="text-xs text-neutral-300 font-sans font-medium">
            Saved correction pairs:
          </span>
        </div>
        <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/40 px-2.5 py-1 rounded-full flex items-center gap-1.5 ">
          <span className="text-xs font-mono font-black text-[#60A5FA]">
            {sampleCount !== null ? sampleCount : "0"}
          </span>
          <span className="text-[9px] font-mono text-[#3B82F6] uppercase font-bold">
            PAIRS
          </span>
        </div>
      </div>

      {/* Fine-Tuning Controller Card */}
      <div className="bg-[#181924]/60 border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#3B82F6] uppercase font-bold tracking-wider block">
            Fine-Tuning Controls
          </span>
          {isTraining && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2A2A2A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2A2A2A]"></span>
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
                className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500 "
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
                      <span className="text-[#3B82F6] font-bold">
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
              <div className="text-xs text-[#60A5FA]/90 bg-[#2A2A2A] border border-[#2F2F2F] p-3 rounded-2xl leading-relaxed">
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
                    className="bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-2xl px-3 py-2.5 text-xs font-mono cursor-pointer focus:outline-none focus:border-[#3B82F6]/60"
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
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-[#2A2A2A] hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] border border-[#60A5FA]/30 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-purple-200 text-[#3B82F6]" />
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
