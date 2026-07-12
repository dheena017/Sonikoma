import React, { useState } from "react";
import {
  FileText,
  Video,
  BookOpen,
  Music,
  Settings,
  Layout,
  Eye,
} from "lucide-react";
import { GeneratedPanel } from "../../../types";

interface DescriptionEditorProps {
  description: string;
  setDescription: (val: string) => void;
  panels: GeneratedPanel[];
  onApplyPresetTemplate: (type: "recap" | "trailer") => void;
  onCompileChapters: () => void;
  onInsertDisclaimer: () => void;
  onInsertSocials: () => void;
  onInsertMusicCredit: (musicType: string) => void;
}

export default function DescriptionEditor({
  description,
  setDescription,
  panels,
  onApplyPresetTemplate,
  onCompileChapters,
  onInsertDisclaimer,
  onInsertSocials,
  onInsertMusicCredit,
}: DescriptionEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "builder">("edit");

  // Structure Builder States
  const [hookIntro, setHookIntro] = useState(
    "Welcome back! In today's video we are recapping the epic story chapters of this amazing webtoon series."
  );
  const [readOriginalText, setReadOriginalText] = useState(
    "https://webtoons.com/original-series"
  );
  const [creditScript, setCreditScript] = useState("Sonikoma Creative Suite");
  const [creditVoice, setCreditVoice] = useState("Edge TTS Studio");

  // Section enabling toggles
  const [enableHook, setEnableHook] = useState(true);
  const [enableCredits, setEnableCredits] = useState(true);

  // Compile the visual blocks into description
  const handleBuildFromStructure = () => {
    let output = "";

    if (enableHook && hookIntro.trim()) {
      output += `🎬 VIDEO SYNOPSIS:\n${hookIntro.trim()}\n\n`;
    }

    if (readOriginalText.trim()) {
      output += `📚 READ THE ORIGINAL SERIES:\n👉 ${readOriginalText.trim()}\n\n`;
    }

    if (enableCredits) {
      output += `🎥 PRODUCTION CREDITS:\n`;
      output += `- Scripting & Panel Layouts: ${
        creditScript.trim() || "Sonikoma"
      }\n`;
      output += `- Voice Adaptation Synthesis: ${
        creditVoice.trim() || "TTS Studio"
      }\n\n`;
    }

    output += `#webtoon #manhwa #recap #comicrecap`;

    setDescription(output);
    setActiveTab("edit");
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex justify-between items-end text-xs font-mono">
        <label className="text-neutral-300 font-bold">
          Description / Synopsis
        </label>

        {/* Editor vs Builder Tabs */}
        <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-900 shadow-inner">
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all duration-200 ${
              activeTab === "edit"
                ? "bg-purple-950/50 text-purple-300 border border-purple-900/30 shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Eye className="h-3 w-3" />
            Raw Editor
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all duration-200 ${
              activeTab === "builder"
                ? "bg-purple-950/50 text-purple-300 border border-purple-900/30 shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Layout className="h-3 w-3" />
            Structure Builder
          </button>
        </div>
      </div>

      {activeTab === "edit" ? (
        <div className="space-y-3.5 animate-fade-in">
          {/* Presets & Quick Format Toolbar */}
          <div className="flex flex-col gap-3 bg-neutral-950/40 backdrop-blur-sm p-4 rounded-2xl border border-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onApplyPresetTemplate("recap")}
                  className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 bg-neutral-900/40 border border-neutral-850 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-neutral-400" />
                  Recap Template
                </button>
                <button
                  onClick={() => onApplyPresetTemplate("trailer")}
                  className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 bg-neutral-900/40 border border-neutral-850 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <Video className="h-3.5 w-3.5 text-neutral-400" />
                  Promo Trailer Template
                </button>
                {panels && panels.length > 0 && (
                  <button
                    onClick={onCompileChapters}
                    className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 bg-purple-950/10 border border-purple-900/30 text-purple-400 hover:text-purple-300 rounded-lg transition-all duration-200 cursor-pointer hover:bg-purple-900/10"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Compile Chapters
                  </button>
                )}
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={onInsertDisclaimer}
                  className="text-[9.5px] font-mono text-neutral-400 hover:text-purple-300 bg-neutral-900/40 hover:bg-purple-950/10 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer border border-neutral-850"
                  title="Append Fair Use Copyright Disclaimer"
                >
                  ⚖️ Copyright
                </button>
                <button
                  onClick={onInsertSocials}
                  className="text-[9.5px] font-mono text-neutral-400 hover:text-purple-300 bg-neutral-900/40 hover:bg-purple-950/10 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer border border-neutral-850"
                  title="Append Social Media Links"
                >
                  📢 Socials
                </button>
              </div>
            </div>

            {/* Music Presets Row */}
            <div className="pt-2.5 border-t border-neutral-900/60 flex flex-wrap gap-2 items-center font-mono text-[10px]">
              <span className="text-neutral-500 font-bold flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-purple-400" />
                BGM Soundtrack Credits:
              </span>
              {["Lo-Fi Beats", "Epic Orchestral", "Synthwave Theme"].map(
                (music) => (
                  <button
                    key={music}
                    onClick={() => onInsertMusicCredit(music)}
                    className="px-2.5 py-1 bg-neutral-900/40 hover:bg-purple-950/10 text-neutral-400 hover:text-purple-300 border border-neutral-850 hover:border-purple-500/30 rounded-lg transition-all duration-200 cursor-pointer"
                  >
                    +{music}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              maxLength={5200}
              placeholder="Detail what happens in the video, include credits and external social links..."
              className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all duration-200 font-sans resize-none shadow-inner"
            />
            <div className="text-[10px] text-neutral-500 font-mono text-right pr-1">
              Character Count: {description.length}/5000
            </div>
          </div>
        </div>
      ) : (
        /* Visual Structure Builder Customizer */
        <div className="bg-neutral-950/40 backdrop-blur-sm p-5 border border-neutral-900 rounded-2xl space-y-4 font-mono text-xs text-neutral-400 animate-slide-down">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
            <span className="text-neutral-205 font-bold flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-purple-400" />
              Synopsis Composer
            </span>
            <span className="text-[9.5px] text-neutral-500">
              Enable/disable block modules
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Hook intro Block */}
            <div className="space-y-2 p-4 bg-neutral-950/30 rounded-xl border border-neutral-900">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-bold flex items-center gap-1">
                  1. Introduction Hook
                </span>
                <button
                  onClick={() => setEnableHook(!enableHook)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer transition-colors ${
                    enableHook
                      ? "bg-purple-950/40 border border-purple-900/30 text-purple-300"
                      : "bg-neutral-900 text-neutral-500 border border-neutral-850"
                  }`}
                >
                  {enableHook ? "ENABLED" : "DISABLED"}
                </button>
              </div>
              {enableHook && (
                <textarea
                  value={hookIntro}
                  onChange={(e) => setHookIntro(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-900/20 border border-neutral-850 focus:border-purple-500/35 rounded-lg p-2.5 text-[11px] text-white focus:outline-none"
                  placeholder="Hook text..."
                />
              )}
            </div>

            {/* Read series link block */}
            <div className="space-y-2 p-4 bg-neutral-950/30 rounded-xl border border-neutral-900">
              <span className="text-neutral-300 font-bold block">
                2. Original Webtoon Link
              </span>
              <input
                type="text"
                value={readOriginalText}
                onChange={(e) => setReadOriginalText(e.target.value)}
                className="w-full bg-neutral-900/20 border border-neutral-850 focus:border-purple-500/35 rounded-lg px-3.5 py-2 text-[11px] text-white focus:outline-none"
                placeholder="URL to comic..."
              />
            </div>

            {/* Credits block */}
            <div className="space-y-2 p-4 bg-neutral-950/30 rounded-xl border border-neutral-900">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-bold">
                  3. Production Credits
                </span>
                <button
                  onClick={() => setEnableCredits(!enableCredits)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer transition-colors ${
                    enableCredits
                      ? "bg-purple-950/40 border border-purple-900/30 text-purple-300"
                      : "bg-neutral-900 text-neutral-500 border border-neutral-850"
                  }`}
                >
                  {enableCredits ? "ENABLED" : "DISABLED"}
                </button>
              </div>
              {enableCredits && (
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="space-y-1.5">
                    <span className="text-neutral-500 font-medium">SCRIPTING CREDIT:</span>
                    <input
                      type="text"
                      value={creditScript}
                      onChange={(e) => setCreditScript(e.target.value)}
                      className="w-full bg-neutral-900/20 border border-neutral-850 focus:border-purple-500/35 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-neutral-500 font-medium">TTS SYNTHESIS:</span>
                    <input
                      type="text"
                      value={creditVoice}
                      onChange={(e) => setCreditVoice(e.target.value)}
                      className="w-full bg-neutral-900/20 border border-neutral-850 focus:border-purple-500/35 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Build Description */}
          <div className="pt-3 border-t border-neutral-900 flex justify-end">
            <button
              onClick={handleBuildFromStructure}
              className="px-4.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-lg shadow-purple-950/20 active:scale-98"
            >
              Compile & Inject into Synopsis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
