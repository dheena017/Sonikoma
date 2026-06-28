import * as api from "../../api/index.js";
import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Video,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { GeneratedPanel } from "../../types";

interface AdPlacementTabProps {
  compiledScript: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface AdPlacement {
  timestamp: string;
  tension_reason: string;
}

interface MidrollData {
  placements: AdPlacement[];
}

export default function AdPlacementTab({
  compiledScript,
  videoUrl,
  panels = [],
  addNotification,
}: AdPlacementTabProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MidrollData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [maxAds, setMaxAds] = useState(3);

  const handleGenerate = async () => {
    if (!videoUrl) {
      if (addNotification) {
        addNotification(
          "Please compile your video first on the Dashboard before generating midroll ad breaks.",
          "warning"
        );
      }
      return;
    }

    setLoading(true);
    try {
      const json = await api.runMidrollsSkill({
          compiled_script:
            compiledScript || "Script content representing timeline narration.",
          max_ads: maxAds,
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        });
      if (json.success && json.result) {
        setData(json.result);
        if (addNotification) {
          addNotification(
            "Successfully compiled tension-driven ad placements!",
            "success"
          );
        }
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification(
          "Failed to generate ad placement recommendations.",
          "error"
        );
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
              <p className="text-xs text-neutral-400 font-mono">
                No compiled video found
              </p>
              <p className="text-[10px] text-neutral-500 font-sans max-w-[250px]">
                Please compile your story panels on the main workspace dashboard
                to view the preview here.
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
                    {panel.speech_text
                      ? `"${panel.speech_text}"`
                      : "(No Dialogue)"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-neutral-855 rounded-xl bg-neutral-950/10">
              <p className="text-xs text-neutral-500 font-mono">
                No story panels in timeline
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Ad Placements Outputs */}
      <div className="lg:col-span-7 space-y-4">
        {/* Compiler Action Card */}
        <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">
              Midroll Ad Placement Optimizer
            </h4>
            <p className="text-[10px] text-neutral-500 font-mono">
              Recommend timestamps for ad injection based on pacing tension
            </p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono">
              <span className="text-[10px] text-neutral-500 uppercase">
                Max Ads
              </span>
              <input
                type="number"
                min={1}
                max={10}
                value={maxAds}
                onChange={(e) =>
                  setMaxAds(Math.max(1, parseInt(e.target.value) || 3))
                }
                className="w-10 bg-transparent text-purple-400 font-bold outline-none text-center"
              />
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
              {loading ? "Analyzing..." : "✦ Suggest Ad Breaks"}
            </button>
          </div>
        </div>

        {/* Warn if not compiled */}
        {!videoUrl && (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex gap-3 text-amber-250 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-mono font-bold block">
                ⚠️ COMPILATION CHECK REQUIRED
              </span>
              <p className="text-neutral-400 leading-relaxed font-sans">
                Midroll ad insert schedules require complete timing references
                based on the compiled video. Please compile the video on the
                Dashboard first.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center animate-pulse">
            <Sparkles className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
            <p className="text-[11px] font-mono text-purple-300 mt-2">
              Running Pacing Tension & Midroll Analyzer...
            </p>
          </div>
        )}

        {data && !loading && (
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3 animate-fade-in">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <span className="text-[10px] font-mono font-bold text-purple-400">
                Suspense-Driven Ad Insertions
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    data.placements
                      .map((p) => `${p.timestamp} - ${p.tension_reason}`)
                      .join("\n"),
                    "placements"
                  )
                }
                className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-900"
              >
                {copiedField === "placements" ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
            <div className="space-y-3">
              {data.placements.map((placement, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-850 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-mono font-bold text-white bg-purple-950 border border-purple-800 px-2 py-0.5 rounded">
                      {placement.timestamp}
                    </span>
                  </div>
                  <div className="text-[11px] font-sans text-neutral-350 leading-relaxed">
                    <span className="text-neutral-500 font-mono text-[9px] uppercase tracking-wider block">
                      Tension Reason:
                    </span>
                    {placement.tension_reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
