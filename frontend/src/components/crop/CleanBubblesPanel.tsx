import React, { useState } from "react";
import { Brain, RefreshCw, ChevronDown, Sliders } from "lucide-react";
import { NotificationType } from "../NotificationStack";

interface CleanBubblesPanelProps {
  imgUrl: string;
  editingImageIdx: number;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>> | undefined;
  setPanels: React.Dispatch<React.SetStateAction<any[]>> | undefined;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch | undefined;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>> | undefined;
}

const DETECTION_OPTIONS = [
  { value: "all", label: "All Bubbles", description: "Detect every speech/thought bubble" },
  { value: "white_only", label: "White Only", description: "Only light-colored bubbles" },
  { value: "text_only", label: "Text Only", description: "Pure text regions" },
];

const ERASE_OPTIONS = [
  { value: "auto", label: "Auto (AI)", description: "Smart AI inpainting" },
  { value: "inpaint", label: "Inpaint", description: "Content-aware fill" },
  { value: "blur", label: "Blur Text", description: "Gaussian blur masking" },
  { value: "solid_white", label: "Fill White", description: "White fill over bubbles" },
  { value: "solid_black", label: "Fill Black", description: "Black fill over bubbles" },
];

export default function CleanBubblesPanel({
  imgUrl,
  editingImageIdx,
  setScrapedImages,
  setPanels,
  addNotification,
  fetchWithInterceptor,
  setConsoleLogs,
}: CleanBubblesPanelProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const [detectionStyle, setDetectionStyle] = useState<"all" | "white_only" | "text_only">("all");
  const [eraseMethod, setEraseMethod] = useState<"auto" | "inpaint" | "blur" | "solid_white" | "solid_black">("auto");
  const [sensitivity, setSensitivity] = useState<number>(50);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(true);

  const handleCleanCurrentBubble = async () => {
    setIsCleaning(true);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Crop Editor] Cleaning speech bubbles on Frame #${editingImageIdx + 1}...`,
        ...prev,
      ]);
    }
    try {
      const response = await activeFetch("/api/remove-speech-bubbles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imgUrl,
          method: eraseMethod,
          sensitivity: sensitivity,
          dilation: -1,
          inpaint_radius: 3,
          detection_style: detectionStyle,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Speech bubble removal failed with status ${response.status}`
        );
      }

      const data = await response.json();
      if (data.success && data.url) {
        if (setScrapedImages) {
          setScrapedImages((prev) => {
            const copy = [...prev];
            copy[editingImageIdx] = data.url;
            return copy;
          });
        }
        if (setPanels) {
          setPanels((prev) =>
            prev.map((p) =>
              p.image_url === imgUrl ? { ...p, image_url: data.url } : p
            )
          );
        }
        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Crop Editor] ✓ Successfully cleaned speech bubbles on Frame #${editingImageIdx + 1}!`,
            ...prev,
          ]);
        }
        addNotification("Successfully cleaned speech bubbles on this panel!", "success");
      }
    } catch (err: any) {
      console.error("[Crop Editor Bubble Cleaner] Failed:", err);
      addNotification(err.message || "Failed to clean speech bubbles on this panel.", "error");
    } finally {
      setIsCleaning(false);
    }
  };

  const sensitivityPct = ((sensitivity - 10) / 80) * 100;

  return (
    <div className="space-y-3.5 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-purple-500/10 border border-purple-500/15">
          <Brain className="h-3 w-3 text-purple-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Clean Speech Bubbles
        </span>
      </div>

      {showSettings && (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2">
            {/* Detection Style */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
                Detect
              </label>
              <div className="relative">
                <select
                  value={detectionStyle}
                  onChange={(e) => setDetectionStyle(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-purple-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-white/15"
                >
                  {DETECTION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
              </div>
            </div>

            {/* Erase Method */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
                Erase
              </label>
              <div className="relative">
                <select
                  value={eraseMethod}
                  onChange={(e) => setEraseMethod(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-purple-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-white/15"
                >
                  {ERASE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sensitivity slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-neutral-600 uppercase font-mono tracking-widest">Sensitivity</span>
              <span className="text-[10px] font-mono font-bold text-purple-400">{sensitivity}%</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                style={{
                  width: `${sensitivityPct}%`,
                  background: "linear-gradient(to right, #7c3aed, #c084fc)",
                }}
              />
              <input
                type="range"
                min="10"
                max="90"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
              />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-neutral-700">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="flex items-center h-9 w-full">
        <button
          type="button"
          onClick={handleCleanCurrentBubble}
          disabled={isCleaning}
          className="flex-1 h-full px-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 rounded-l-xl border-r-0 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm"
        >
          {isCleaning ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
          ) : (
            <Brain className="h-3.5 w-3.5 text-purple-400" />
          )}
          <span>{isCleaning ? "Cleaning..." : "Clean Bubbles"}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          title="Toggle settings visibility"
          className={`h-full px-2.5 border rounded-r-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
            showSettings 
              ? "bg-purple-500/20 text-purple-200 border-purple-500/40" 
              : "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
