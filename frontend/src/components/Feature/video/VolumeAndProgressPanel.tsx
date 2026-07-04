import React, { useState, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  Play,
  Pause,
  RotateCcw,
  VolumeX,
  Volume2,
  Sliders,
  Sun,
  Contrast,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GeneratedPanel } from "@/types";

interface VolumeAndProgressPanelProps {
  panels: GeneratedPanel[];
  currentPanelIndex: number;
  playbackTime: number;
  storyboardPlaying: boolean;
  toggleStoryboardPlayback: () => void;
  resetStoryboardPlayback: () => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  volume: number;
  setVolume: (val: number) => void;
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  addNotification?: (message: string, type: any) => void;
}

const VolumeAndProgressPanel = React.memo(
  ({
    panels,
    currentPanelIndex,
    playbackTime,
    storyboardPlaying,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    isMuted,
    setIsMuted,
    volume,
    setVolume,
    setPanels,
    addNotification,
  }: VolumeAndProgressPanelProps) => {
    const activeStoryboardPanel = panels[currentPanelIndex] || null;
    const [showCustomizer, setShowCustomizer] = useState(false);
    const [activeTab, setActiveTab] = useState<"visuals" | "timeline">(
      "visuals"
    );

    const handleUpdateField = (field: keyof GeneratedPanel, value: any) => {
      if (!activeStoryboardPanel || !setPanels) return;
      setPanels((prev) =>
        prev.map((p, idx) =>
          idx === currentPanelIndex ? { ...p, [field]: value } : p
        )
      );
    };

    const handleUpdateSpeechText = (text: string) => {
      if (!activeStoryboardPanel || !setPanels) return;

      // Dynamically calculate estimated duration based on dialogue text length
      const words = text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

      const newDuration = text.trim()
        ? Math.max(
            2.5,
            Math.min(12.0, parseFloat((words / 2.2 + 0.8).toFixed(1)))
          )
        : 3.0; // default for empty/blank panels

      setPanels((prev) =>
        prev.map((p, idx) =>
          idx === currentPanelIndex
            ? { ...p, speech_text: text, duration: newDuration }
            : p
        )
      );
    };

    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
      if (
        activeTab === "timeline" &&
        activeStoryboardPanel?.audio_url &&
        waveformRef.current
      ) {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: "#a78bfa", // text-purple-400
          progressColor: "#7c3aed", // bg-purple-600
          height: 48,
          url: activeStoryboardPanel.audio_url,
          barWidth: 2,
          barRadius: 2,
          cursorWidth: 1,
          cursorColor: "#c4b5fd", // text-purple-300
        });

        return () => {
          if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
          }
        };
      }
    }, [activeTab, activeStoryboardPanel?.audio_url]);

    return (
      <div
        id="video_controls_card"
        className="bg-neutral-900/95 border border-neutral-800/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur-xs transition-all duration-300"
      >
        {/* 1. Progress bar section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
              Timeline Sync Progress
            </span>
            {activeStoryboardPanel && (
              <span className="font-bold text-neutral-350">
                {playbackTime.toFixed(1)}s / {activeStoryboardPanel.duration}s
              </span>
            )}
          </div>

          <div className="relative h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-850">
            {activeStoryboardPanel && (
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full transition-all duration-100 ease-linear rounded-full shadow-inner"
                style={{
                  width: `${
                    (playbackTime / activeStoryboardPanel.duration) * 100
                  }%`,
                }}
              />
            )}
          </div>
        </div>

        {/* 2. Primary Playback controls */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-850/60 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log(
                  "[Playback] Toggling playback:",
                  !storyboardPlaying
                );
                toggleStoryboardPlayback();
              }}
              className="bg-purple-650 hover:bg-purple-550 text-white p-3 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-950/40"
              title={storyboardPlaying ? "Pause Playback" : "Play Timeline"}
            >
              {storyboardPlaying ? (
                <Pause className="h-4.5 w-4.5" />
              ) : (
                <Play className="h-4.5 w-4.5 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={() => {
                console.log("[Playback] Resetting playback");
                resetStoryboardPlayback();
              }}
              className="p-3 bg-neutral-950 border border-neutral-850 hover:bg-neutral-800 hover:border-neutral-750 text-neutral-400 hover:text-white rounded-2xl cursor-pointer transition-all active:scale-95"
              title="Rewind/Reset"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-850/40 px-3 py-1.5 rounded-2xl">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4.5 w-4.5 text-purple-400" />
              ) : (
                <Volume2 className="h-4.5 w-4.5 text-purple-400" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 sm:w-28 accent-purple-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase font-mono text-neutral-500 block font-bold tracking-wider">
              Active Scene
            </span>
            <span className="text-xs font-mono font-bold text-white bg-purple-950/30 border border-purple-900/30 px-2.5 py-0.5 rounded-lg">
              #{currentPanelIndex + 1}
            </span>
          </div>
        </div>

        {/* 3. Customizer Toggle Button */}
        {activeStoryboardPanel && setPanels && (
          <div className="space-y-3">
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`w-full py-2 px-3 bg-neutral-950/40 hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-750 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-between cursor-pointer ${
                showCustomizer
                  ? "text-purple-400 border-purple-900/60"
                  : "text-neutral-350"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-purple-400" />
                Quick Scene Customizer
              </span>
              {showCustomizer ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Expanded customization dashboard */}
            {showCustomizer && (
              <div className="space-y-4 border-t border-neutral-850/60 pt-3 animate-fade-in">
                {/* Tab Selector */}
                <div className="flex gap-1.5 border-b border-neutral-950 pb-2">
                  <button
                    onClick={() => setActiveTab("visuals")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      activeTab === "visuals"
                        ? "bg-purple-950/50 text-purple-300 border border-purple-900/40"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    Visual adjustments
                  </button>
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      activeTab === "timeline"
                        ? "bg-purple-950/50 text-purple-300 border border-purple-900/40"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    Dialogue & Pacing
                  </button>
                </div>

                {/* Tab 1: Visual adjustments */}
                {activeTab === "visuals" && (
                  <div className="space-y-3.5 text-left">
                    {/* Style Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block font-sans">
                        Visual Style Filter
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { code: "", label: "Normal" },
                          { code: "anime_vibrant", label: "Anime" },
                          { code: "cinematic_drama", label: "Cinema" },
                          { code: "hdr_clear", label: "Clear" },
                          { code: "vintage_warm", label: "Retro" },
                          { code: "neon_cyber", label: "Cyber" },
                        ].map((preset) => (
                          <button
                            key={preset.code}
                            onClick={() =>
                              handleUpdateField("filter_preset", preset.code)
                            }
                            className={`py-1 px-1.5 rounded-lg text-[9px] font-mono border transition-all cursor-pointer truncate ${
                              (activeStoryboardPanel.filter_preset || "") ===
                              preset.code
                                ? "bg-purple-650 text-white border-purple-550 shadow-md"
                                : "bg-neutral-955 text-neutral-400 border-neutral-850 hover:bg-neutral-850 hover:text-neutral-350"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Range Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {/* Brightness */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Sun className="h-3 w-3 text-purple-400" />{" "}
                            Brightness
                          </span>
                          <span className="text-neutral-350 font-bold">
                            {activeStoryboardPanel.brightness ?? 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={150}
                          value={activeStoryboardPanel.brightness ?? 100}
                          onChange={(e) =>
                            handleUpdateField(
                              "brightness",
                              Number(e.target.value)
                            )
                          }
                          className="w-full h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Contrast */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Contrast className="h-3 w-3 text-purple-400" />{" "}
                            Contrast
                          </span>
                          <span className="text-neutral-350 font-bold">
                            {activeStoryboardPanel.contrast ?? 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={150}
                          value={activeStoryboardPanel.contrast ?? 100}
                          onChange={(e) =>
                            handleUpdateField(
                              "contrast",
                              Number(e.target.value)
                            )
                          }
                          className="w-full h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-purple-400" />{" "}
                            Saturation
                          </span>
                          <span className="text-neutral-350 font-bold">
                            {activeStoryboardPanel.saturation ?? 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={150}
                          value={activeStoryboardPanel.saturation ?? 100}
                          onChange={(e) =>
                            handleUpdateField(
                              "saturation",
                              Number(e.target.value)
                            )
                          }
                          className="w-full h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Grayscale */}
                      <div className="flex items-center justify-between bg-neutral-950 border border-neutral-850/65 rounded-2xl px-3 py-2">
                        <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider">
                          Noir Grayscale
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateField(
                              "grayscale",
                              !activeStoryboardPanel.grayscale
                            )
                          }
                          className={`px-2.5 py-1 text-[9px] font-mono rounded-lg transition-all font-bold cursor-pointer ${
                            activeStoryboardPanel.grayscale
                              ? "bg-purple-650 text-white border border-purple-550 shadow-sm"
                              : "bg-neutral-900 text-neutral-450 border border-neutral-800"
                          }`}
                        >
                          {activeStoryboardPanel.grayscale
                            ? "ENABLED"
                            : "DISABLED"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Dialogue & Pacing */}
                {activeTab === "timeline" && (
                  <div className="space-y-3.5 text-left">
                    {/* Dialogue script */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                        Dialogue/Subtitle Text
                      </label>
                      <textarea
                        rows={2}
                        value={activeStoryboardPanel.speech_text}
                        onChange={(e) => handleUpdateSpeechText(e.target.value)}
                        placeholder="Type dialogue..."
                        className="w-full bg-neutral-955 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-300 outline-none focus:border-purple-650 transition-all font-sans resize-none"
                      />
                    </div>

                    {/* Audio Waveform Visualization */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                        Audio Waveform (TTS)
                      </label>
                      <div className="w-full bg-neutral-955 border border-neutral-850 rounded-xl p-2 h-16 flex items-center justify-center relative overflow-hidden">
                        {activeStoryboardPanel.audio_url ? (
                          <>
                            <div ref={waveformRef} className="w-full h-full" />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                wavesurferRef.current?.playPause();
                              }}
                              className="absolute z-10 left-3 top-1/2 -translate-y-1/2 bg-purple-600/80 hover:bg-purple-500 text-white rounded-full p-1.5 backdrop-blur shadow-sm cursor-pointer"
                            >
                              <Play className="h-3 w-3 ml-0.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            No audio generated yet
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Camera Motion */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                          Cam Motion
                        </label>
                        <select
                          value={activeStoryboardPanel.motion_type ?? ""}
                          onChange={(e) =>
                            handleUpdateField("motion_type", e.target.value)
                          }
                          className="w-full bg-neutral-955 border border-neutral-850 text-[11px] rounded-xl p-2.5 text-neutral-300 outline-none focus:border-purple-650 transition-all font-mono cursor-pointer"
                        >
                          <option value="">Auto-Detect</option>
                          <option value="zoom_in">Zoom In</option>
                          <option value="zoom_out">Zoom Out</option>
                          <option value="pan_right">Pan Right</option>
                          <option value="pan_left">Pan Left</option>
                          <option value="pan_down">Pan Down</option>
                        </select>
                      </div>

                      {/* Timing (sec) */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                          Timing (sec)
                        </label>
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={activeStoryboardPanel.duration}
                          onChange={(e) => {
                            const num = parseFloat(e.target.value);
                            if (!isNaN(num) && num >= 0.5) {
                              handleUpdateField("duration", num);
                            }
                          }}
                          className="w-full bg-neutral-955 border border-neutral-850 text-[11px] rounded-xl p-2.5 text-neutral-300 outline-none focus:border-purple-650 transition-all font-mono text-center"
                        />
                      </div>
                    </div>

                    {/* Sound Effect (SFX) */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
                        Sound Effect (SFX)
                      </label>
                      <input
                        type="text"
                        value={activeStoryboardPanel.sfx || ""}
                        onChange={(e) =>
                          handleUpdateField("sfx", e.target.value)
                        }
                        placeholder="e.g. [Soft Whoosh]"
                        className="w-full bg-neutral-955 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-300 outline-none focus:border-purple-650 transition-all font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default VolumeAndProgressPanel;
