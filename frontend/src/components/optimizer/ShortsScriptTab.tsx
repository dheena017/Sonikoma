import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

interface ShortsScriptTabProps {
  title: string;
  storyboardSummary: string;
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
}: ShortsScriptTabProps) {
  const [loading, setLoading] = useState(false);
  const [scriptData, setScriptData] = useState<ShortsData | null>(null);
  const [hookData, setHookData] = useState<HookData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
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
    } catch (e) {
      console.error(e);
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
    <div className="space-y-4">
      <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
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
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Adapting..." : "✦ Generate Shorts Specs"}
        </button>
      </div>

      {loading && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center animate-pulse">
          <Sparkles className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
          <p className="text-[11px] font-mono text-purple-300 mt-2">
            Running Shorts Adapter & Hook Generator...
          </p>
        </div>
      )}

      {!loading && (hookData || scriptData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  );
}
