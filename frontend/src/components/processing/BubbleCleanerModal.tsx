import React from "react";
import {
  Brain,
  X,
  RefreshCw,
  Cpu,
  Sliders,
  HelpCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
} from "lucide-react";
import BubbleCleanerTabContent from "../scraper/BubbleCleanerTabContent";

interface BubbleCleanerModalProps {
  onClose: () => void;
  onApply: () => void;

  detectionStyle: "all" | "white_only" | "text_only";
  setDetectionStyle: (v: "all" | "white_only" | "text_only") => void;
  eraseMethod: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black";
  setEraseMethod: (
    v: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black"
  ) => void;
  sensitivity: number;
  setSensitivity: (v: number) => void;

  // Advanced States
  bubbleDilation: number;
  setBubbleDilation: (v: number) => void;
  bubbleInpaintRadius: number;
  setBubbleInpaintRadius: (v: number) => void;
  activeTab: string;
  setActiveTab: (v: string) => void;

  selectedCount: number;
  isApplying: boolean;
  scrapedImages: string[];
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification?: (msg: string, type: any) => void;
  isPage?: boolean;

  handleMergeWithNext?: (idx: number) => Promise<any>;
  mergingIndices?: number[];
}

export default function BubbleCleanerModal({
  onClose,
  onApply,
  detectionStyle,
  setDetectionStyle,
  eraseMethod,
  setEraseMethod,
  sensitivity,
  setSensitivity,

  bubbleDilation,
  setBubbleDilation,
  bubbleInpaintRadius,
  setBubbleInpaintRadius,
  activeTab,
  setActiveTab,

  selectedCount,
  isApplying,
  scrapedImages,
  selectedScraped,
  setSelectedScraped,
  addNotification,
  isPage = false,
  handleMergeWithNext,
  mergingIndices = [],
}: BubbleCleanerModalProps) {
  const [isDeckExpanded, setIsDeckExpanded] = React.useState<boolean>(true);
  const [activePreviewUrl, setActivePreviewUrl] = React.useState<string | null>(
    null
  );

  const previewImageUrl =
    activePreviewUrl ||
    (selectedScraped.length > 0
      ? selectedScraped[0]
      : scrapedImages.length > 0
      ? scrapedImages[0]
      : null);

  const handleResetAll = () => {
    console.log("[BubbleCleanerModal] Resetting all parameters to defaults");
    setDetectionStyle("all");
    setEraseMethod("auto");
    setSensitivity(50);
    setBubbleDilation(-1);
    setBubbleInpaintRadius(3);
    setActiveTab("general");
    setActivePreviewUrl(null);
    if (addNotification) {
      addNotification(
        "Restored all speech bubble cleaner parameters to defaults.",
        "info"
      );
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: <Cpu className="h-3.5 w-3.5" /> },
    {
      id: "advanced",
      label: "Advanced CV",
      icon: <Sliders className="h-3.5 w-3.5" />,
    },
    {
      id: "help",
      label: "Help & Legend",
      icon: <HelpCircle className="h-3.5 w-3.5" />,
    },
  ];

  const mainCard = (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center shadow-[0_0_14px_rgba(168,85,247,0.15)]">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">
              Speech Bubble Cleaner Settings
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Advanced OpenCV clearing & text boundary cleanup parameters
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-450 hover:text-white transition-all text-[10px] font-bold font-mono active:scale-95 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-neutral-500" />
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab Selection Row */}
      <div className="flex border-b border-neutral-800 bg-neutral-950/20 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              console.log(`[BubbleCleanerModal] Switching to tab: ${tab.id}`);
              setActiveTab(tab.id);
            }}
            className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer select-none ${
              activeTab === tab.id
                ? "text-purple-400 border-purple-500 bg-purple-500/5"
                : "text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-800/30"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Middle Workspace Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-neutral-900/50">
        {/* Collapsible Left Deck */}
        {scrapedImages.length > 0 && (
          <div
            className={[
              "flex flex-col border-r border-neutral-800 bg-neutral-950/35 shrink-0 transition-all duration-300 ease-in-out overflow-hidden select-none",
              isDeckExpanded ? "w-36 sm:w-44" : "w-11 sm:w-12",
            ].join(" ")}
          >
            {/* Header / Toggle button */}
            <div
              onClick={() => setIsDeckExpanded(!isDeckExpanded)}
              className={[
                "flex items-center justify-between p-2 border-b border-neutral-800 cursor-pointer bg-neutral-900/40 hover:bg-neutral-900 transition-colors duration-150 select-none",
                !isDeckExpanded && "flex-col gap-3 py-3",
              ].join(" ")}
              title={isDeckExpanded ? "Collapse Deck" : "Expand Deck"}
            >
              {isDeckExpanded ? (
                <>
                  <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider pl-1">
                    Panels ({scrapedImages.length})
                  </span>
                  <div className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors duration-150">
                    <ChevronLeft className="h-4 w-4" />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors duration-150">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <span
                    className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest select-none origin-center"
                    style={{
                      writingMode: "vertical-rl",
                      textOrientation: "mixed",
                    }}
                  >
                    PANELS ({scrapedImages.length})
                  </span>
                </>
              )}
            </div>

            {/* Scrollable List of thumbnails */}
            {isDeckExpanded && (
              <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 scrollbar-thin">
                {scrapedImages.map((imgUrl, globalIdx) => {
                  const isSelected = selectedScraped.includes(imgUrl);
                  const isCurrentPreview = imgUrl === previewImageUrl;
                  const isStitching = mergingIndices.includes(globalIdx);
                  return (
                    <React.Fragment key={imgUrl}>
                      <div
                        onClick={() => {
                          console.log(
                            `[BubbleCleanerModal] Selected preview image: ${imgUrl}`
                          );
                          setActivePreviewUrl(imgUrl);
                          setSelectedScraped((prev) =>
                            prev.includes(imgUrl)
                              ? prev.filter((u) => u !== imgUrl)
                              : [...prev, imgUrl]
                          );
                        }}
                        className={[
                          "relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-900 border shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105",
                          isCurrentPreview
                            ? "border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/30"
                            : isSelected
                            ? "border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.15)]"
                            : "border-neutral-800 hover:border-neutral-700",
                        ].join(" ")}
                      >
                        <img
                          src={imgUrl}
                          alt={`Panel #${globalIdx + 1}`}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        <div
                          className={[
                            "absolute bottom-1.5 right-1.5 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-mono leading-none border transition-all duration-200",
                            isCurrentPreview
                              ? "bg-emerald-600/90 border-emerald-400/60 text-white"
                              : isSelected
                              ? "bg-purple-600/90 border-purple-400/60 text-white"
                              : "bg-black/80 border-purple-900/30 text-purple-400",
                          ].join(" ")}
                        >
                          #{globalIdx + 1}
                        </div>
                      </div>

                      {globalIdx < scrapedImages.length - 1 &&
                        handleMergeWithNext && (
                          <div className="flex justify-center -my-1.5 h-6 items-center">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                console.log(
                                  `[BubbleCleanerModal] Stitching idx ${globalIdx} with next`
                                );
                                const img1 = scrapedImages[globalIdx];
                                const img2 = scrapedImages[globalIdx + 1];
                                const stitched = await handleMergeWithNext(
                                  globalIdx
                                );
                                if (stitched) {
                                  if (
                                    activePreviewUrl === img1 ||
                                    activePreviewUrl === img2
                                  ) {
                                    setActivePreviewUrl(stitched);
                                  }
                                }
                              }}
                              disabled={isStitching}
                              className={`w-6 h-6 rounded-full bg-neutral-900 border flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer hover:scale-110 active:scale-95 z-10 opacity-60 hover:opacity-100 ${
                                isStitching
                                  ? "border-purple-500/40 text-purple-400 bg-purple-950/20 cursor-wait"
                                  : "border-neutral-800 hover:border-purple-500/50 hover:bg-purple-600/90 text-neutral-400 hover:text-white"
                              }`}
                              title="Stitch with next panel"
                            >
                              {isStitching ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Link2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Scrollable Tab Content Settings Pane */}
        <div className="p-6 overflow-y-auto flex flex-col flex-1 min-h-0">
          <BubbleCleanerTabContent
            activeTab={activeTab}
            detectionStyle={detectionStyle}
            setDetectionStyle={setDetectionStyle}
            eraseMethod={eraseMethod}
            setEraseMethod={setEraseMethod}
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
            bubbleDilation={bubbleDilation}
            setBubbleDilation={setBubbleDilation}
            bubbleInpaintRadius={bubbleInpaintRadius}
            setBubbleInpaintRadius={setBubbleInpaintRadius}
            selectedCount={selectedCount}
            scrapedImages={scrapedImages}
            selectedScraped={selectedScraped}
            addNotification={addNotification}
            previewImageUrl={previewImageUrl}
          />
        </div>
      </div>

      {/* Live Config Summary Bar */}
      <div className="px-6 py-2.5 bg-neutral-950/20 border-t border-neutral-800 flex items-center gap-4 text-[9px] font-mono text-neutral-500 tracking-wider">
        <span className="font-bold text-neutral-400 uppercase">
          Active Profile:
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Detection:{" "}
            <strong className="text-neutral-350">
              {detectionStyle.toUpperCase()}
            </strong>
          </span>
          <span>•</span>
          <span>
            Method:{" "}
            <strong className="text-neutral-350">
              {eraseMethod.toUpperCase()}
            </strong>
          </span>
          <span>•</span>
          <span>
            Sensitivity:{" "}
            <strong className="text-neutral-350">{sensitivity}%</strong>
          </span>
          <span>•</span>
          <span>
            Dilation:{" "}
            <strong className="text-neutral-350">
              {bubbleDilation === -1 ? "AUTO" : `${bubbleDilation}px`}
            </strong>
          </span>
          <span>•</span>
          <span>
            Inpaint Radius:{" "}
            <strong className="text-neutral-350">
              {bubbleInpaintRadius}px
            </strong>
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-neutral-500 font-mono">
            Settings will be applied to future speech bubble cleanups.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold font-sans transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              console.log("[BubbleCleanerModal] Apply clicked");
              onApply();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-sans transition-all cursor-pointer shadow-lg shadow-purple-900/30 flex items-center gap-2 active:scale-95"
          >
            <Brain className="h-3.5 w-3.5" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={onClose}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Bubble Cleaner</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Brain className="h-6 w-6 text-purple-400" />
              Speech Bubble Cleaner Settings
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Configure parameters for OpenCV clearing, text boundary cleanup
              and dilation offsets
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-355 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-800 hover:border-neutral-700 cursor-pointer font-bold"
          >
            Dashboard
          </button>
        </div>
        <div className="flex-grow min-h-0">{mainCard}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] flex flex-col gap-0 animate-[fadeIn_0.18s_ease-out]">
        {mainCard}
      </div>
    </div>
  );
}
