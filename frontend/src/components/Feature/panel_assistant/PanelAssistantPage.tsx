import React, { useState, useEffect } from "react";
import { Sparkles, Sliders, ArrowLeft, RefreshCw } from "lucide-react";
import { GeneratedPanel } from "@/types";

import PanelTranslationTool from "./PanelTranslationTool.js";
import PanelAudioTool from "./PanelAudioTool.js";
import PanelCreativeTool from "./PanelCreativeTool.js";
import PanelPacingTool from "./PanelPacingTool.js";

interface PanelAssistantPageProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const PanelAssistantPage = React.memo(
  ({
    panels,
    setPanels,
    onNavigateHome,
    addNotification,
  }: PanelAssistantPageProps) => {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [activeTab, setActiveTab] = useState<
      "translation" | "audio" | "creative" | "pacing"
    >("translation");

    // Sync index from URL query param if present
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const idxVal = params.get("idx");
      if (idxVal !== null) {
        const parsed = parseInt(idxVal);
        if (!isNaN(parsed) && parsed >= 0 && parsed < panels.length) {
          setSelectedIdx(parsed);
        }
      }
    }, [panels.length]);

    const activePanel = panels[selectedIdx];

    const handleUpdateDialogue = (val: string) => {
      setPanels((prev) =>
        prev.map((p, idx) =>
          idx === selectedIdx ? { ...p, speech_text: val } : p
        )
      );
    };

    if (panels.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-neutral-400 font-mono">
            No storyboard panels found. Scrape a Webtoon page first.
          </p>
          <button
            onClick={onNavigateHome}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
          >
            Go to Workspace
          </button>
        </div>
      );
    }

    return (
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Smart Panel Assistant & Editor
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Optimize, translate, and style scripts for individual comic
              illustration frames
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-850 cursor-pointer"
          >
            ← Dashboard
          </button>
        </div>

        {/* PANEL HORIZONTAL RIBBON SELECTOR */}
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
          {panels.map((panel, idx) => (
            <button
              key={panel.id}
              onClick={() => {
                setSelectedIdx(idx);
                window.history.replaceState(
                  {},
                  "",
                  `/panel-assistant?idx=${idx}`
                );
              }}
              className={`w-20 shrink-0 h-16 rounded-lg overflow-hidden border transition-all cursor-pointer relative flex items-center justify-center bg-black/40 ${
                selectedIdx === idx
                  ? "border-purple-500 shadow-md shadow-purple-900/30 scale-102 bg-neutral-900"
                  : "border-neutral-800 bg-neutral-950/60 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={panel.image_url}
                alt=""
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[8px] font-mono font-bold text-neutral-300">
                #{panel.id}
              </div>
            </button>
          ))}
        </div>

        {/* DUAL COLUMN PANEL PREVIEW & ACTIVE TAB CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left pane: Active Panel Card preview */}
          <div className="md:col-span-4 bg-neutral-950/45 border border-neutral-800 p-4 rounded-2xl space-y-4">
            <div className="h-44 sm:h-48 rounded-xl overflow-hidden border border-neutral-850 bg-neutral-900 flex items-center justify-center">
              <img
                src={activePanel.image_url}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
                Active Dialogue
              </span>
              <p className="text-xs text-neutral-200 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-850/50 font-sans leading-relaxed">
                {activePanel.speech_text || (
                  <span className="text-neutral-600 font-mono">
                    (Silent panel script)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right pane: Tool Tab Selector & Form views */}
          <div className="md:col-span-8 bg-neutral-950/45 border border-neutral-800 p-5 rounded-2xl space-y-4">
            <div className="flex border-b border-neutral-800 font-mono text-[10px] overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab("translation")}
                className={`px-3 py-1.5 font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === "translation"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Translation
              </button>
              <button
                onClick={() => setActiveTab("audio")}
                className={`px-3 py-1.5 font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === "audio"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Audio & TTS
              </button>
              <button
                onClick={() => setActiveTab("creative")}
                className={`px-3 py-1.5 font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === "creative"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Creative Prompts
              </button>
              <button
                onClick={() => setActiveTab("pacing")}
                className={`px-3 py-1.5 font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === "pacing"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Pacing & Shake
              </button>
            </div>

            <div className="pt-2">
              {activeTab === "translation" && (
                <PanelTranslationTool
                  panel={activePanel}
                  onUpdateDialogue={handleUpdateDialogue}
                  addNotification={addNotification}
                />
              )}
              {activeTab === "audio" && <PanelAudioTool panel={activePanel} />}
              {activeTab === "creative" && (
                <PanelCreativeTool panel={activePanel} />
              )}
              {activeTab === "pacing" && (
                <PanelPacingTool panel={activePanel} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default PanelAssistantPage;
