import React, { useState } from "react";
import { Sparkles, Copy, Check, Video, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { GeneratedPanel } from "../../types";

interface ShortsScriptTabProps {
  title: string;
  storyboardSummary: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface ShortsData {
  voiceover_script: string;
  visual_milestones: string[];
}

interface HookData {
  hook_sentence: string;
  psychological_trigger: string;
}

export default function ShortsScriptTab({
  title,
  storyboardSummary,
  videoUrl,
  panels = [],
  addNotification,
}: ShortsScriptTabProps) {
  const [loading, setLoading] = useState(false);
  const [scriptData, setScriptData] = useState<ShortsData | null>(null);
  const [hookData, setHookData] = useState<HookData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!videoUrl) {
      if (addNotification) {
        addNotification("Please compile your video first on the Dashboard before generating Reels & Shorts content.", "warning");
      }
      return;
    }

    setLoading(true);
    try {
      // 1. Shorts script adapter
      const scriptRes = await fetch("/api/skills/shorts-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboard_summary:
            storyboardSummary || "The story summary details go here.",
          model: "gemini-2.5-flash",
        }),
      });
      const scriptJson = await scriptRes.json();
      if (scriptJson.success && scriptJson.result) {
        setScriptData(scriptJson.result);
      }

      // 2. Shorts hook
      const hookRes = await fetch("/api/skills/shorts-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "This Webtoon",
          key_event: "absolute overpowered betrayal scene",
          model: "gemini-2.5-flash",
        }),
      });
      const hookJson = await hookRes.json();
      if (hookJson.success && hookJson.result) {
        setHookData(hookJson.result);
      }

      if (addNotification) {
        addNotification("Successfully compiled Reels & Shorts specs!", "success");
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification("Failed to generate Reels & Shorts content.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Media Reference Panel */}
      <div className="lg:col-span-5 space-y-6 lg:border-r lg:border-neutral-800/60 lg:pr-6">
        {/* Full Video Preview Block */}
        <div className="space-y-2">
          <h5 className="text-xs font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-purple-400" />
            Full Video Preview
          </h5>
          {videoUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-inner">
              <video
                src={videoUrl}
                controls
                className="w-full aspect-video object-contain"
              />
            </div>
          ) : (
            <div className="border border-dashed border-neutral-800/80 rounded-xl p-8 text-center bg-neutral-950/20 flex flex-col items-center justify-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500/80" />
              <p className="text-xs text-neutral-400 font-mono">No compiled video found</p>
              <p className="text-[10px] text-neutral-500 font-sans max-w-[250px]">
                Please compile your story panels on the main workspace dashboard to view the preview here.
              </p>
            </div>
          )}
        </div>

        {/* Manhwa Storyboard Panels Block */}
        <div className="space-y-2">
          <h5 className="text-xs font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
            Manhwa Panels ({panels.length})
          </h5>
          {panels.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
              {panels.map((panel, idx) => (
                <div
                  key={panel.id || idx}
                  className="bg-neutral-950/60 border border-neutral-850 rounded-lg p-2 flex flex-col space-y-1.5 hover:border-neutral-700 transition-colors"
                >
                  <div className="relative aspect-[3/4] rounded overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    {panel.image_url ? (
                      <img
                        src={panel.image_url}
                        alt={`Panel ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
                        No Image
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-black/85 text-[9px] text-purple-300 px-1.5 py-0.5 rounded font-bold font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-350 line-clamp-2 italic leading-tight px-1 font-sans">
                    {panel.speech_text ? `"${panel.speech_text}"` : "(No Dialogue)"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-neutral-855 rounded-xl bg-neutral-950/10">
              <p className="text-xs text-neutral-500 font-mono">No story panels in timeline</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Shorts Script Optimizer Outputs */}
      <div className="lg:col-span-7 space-y-4">
        {/* Compiler Action Card */}
        <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">
              Shorts & TikTok Video Retention Specialist
            </h4>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Generate fast voiceovers and scrolling hooks
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`px-3.5 py-1.5 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !videoUrl
                ? "bg-purple-800/30 border border-purple-900/30 text-purple-400/50 cursor-not-allowed opacity-60"
                : "bg-purple-600 hover:bg-purple-500"
            }`}
          >
            {loading ? "Adapting..." : "✦ Generate Shorts Specs"}
          </button>
        </div>

        {/* Warn if not compiled */}
        {!videoUrl && (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex gap-3 text-amber-250 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-mono font-bold block">⚠️ COMPILATION CHECK REQUIRED</span>
              <p className="text-neutral-400 leading-relaxed font-sans">
                Reels & Shorts visual timelines and timing-dependent voiceovers cannot be generated accurately without the completed video duration. Please compile the video on the Dashboard first.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center animate-pulse">
            <Sparkles className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
            <p className="text-[11px] font-mono text-purple-300 mt-2">
              Running Shorts Adapter & Hook Generator...
            </p>
          </div>
        )}

        {!loading && (hookData || scriptData) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {hookData && (
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3 md:col-span-2">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <span className="text-[10px] font-mono font-bold text-purple-400">
                    2-Second Scrolling Retention Hook
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(hookData.hook_sentence, "hook")
                    }
                    className="text-neutral-500 hover:text-white p-1 rounded"
                  >
                    {copiedField === "hook" ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-sans font-bold text-white italic">
                    "{hookData.hook_sentence}"
                  </p>
                  <p className="text-[9px] font-mono text-neutral-500">
                    Psychology trigger focus:{" "}
                    <span className="text-purple-300 font-semibold">
                      {hookData.psychological_trigger}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {scriptData && (
              <>
                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400">
                      55s Voiceover Script
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(scriptData.voiceover_script, "vo")
                      }
                      className="text-neutral-500 hover:text-white p-1 rounded"
                    >
                      {copiedField === "vo" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-sans text-neutral-350 leading-relaxed bg-neutral-950 p-3 rounded-lg max-h-56 overflow-y-auto whitespace-pre-wrap">
                    {scriptData.voiceover_script}
                  </p>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400">
                      Visual Milestones Timeline
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          scriptData.visual_milestones.join("\n"),
                          "milestones"
                        )
                      }
                      className="text-neutral-500 hover:text-white p-1 rounded"
                    >
                      {copiedField === "milestones" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {scriptData.visual_milestones.map((ms, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 text-[10px] font-mono bg-neutral-950 p-2 rounded border border-neutral-850"
                      >
                        <span className="text-purple-400 font-bold shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-neutral-300">{ms}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
