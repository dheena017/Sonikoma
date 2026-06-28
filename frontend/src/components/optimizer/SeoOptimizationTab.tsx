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

interface SeoOptimizationTabProps {
  title: string;
  genre: string;
  storyboardSummary: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface SeoData {
  youtube_title: string;
  youtube_description: string;
  tags: string[];
  timestamps: string[];
}

export default function SeoOptimizationTab({
  title,
  genre,
  storyboardSummary,
  videoUrl,
  panels = [],
  addNotification,
}: SeoOptimizationTabProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SeoData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!videoUrl) {
      if (addNotification) {
        addNotification(
          "Please compile your video first on the Dashboard before generating SEO metadata.",
          "warning"
        );
      }
      return;
    }

    setLoading(true);
    try {
      const json = await api.runSeoSkill({
          title: title || "My Webtoon Recap",
          genre: genre || "Action",
          storyboard_summary:
            storyboardSummary || "The story summary details go here.",
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        });
      if (json.success && json.result) {
        setData(json.result);
        if (addNotification) {
          addNotification(
            "Successfully compiled SEO Metadata & Chapters!",
            "success"
          );
        }
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification("Failed to generate SEO specifications.", "error");
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
            <div className="text-center py-6 border border-neutral-850 rounded-xl bg-neutral-950/10">
              <p className="text-xs text-neutral-500 font-mono">
                No story panels in timeline
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: SEO Generator Controls & Output */}
      <div className="lg:col-span-7 space-y-4">
        {/* Compiler Action Card */}
        <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">
              YouTube Algorithm SEO Meta Builder
            </h4>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Optimize Titles, Tags, Descriptions and Timestamps automatically
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
            {loading ? "Optimizing..." : "✦ Generate SEO Specs"}
          </button>
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
                Chapters and SEO timestamps cannot be computed accurately
                without the completed video duration. Please compile the video
                on the Dashboard first.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center animate-pulse">
            <Sparkles className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
            <p className="text-[11px] font-mono text-purple-300 mt-2">
              Running Video SEO Metadata compiler...
            </p>
          </div>
        )}

        {data && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-purple-400">
                  Viral Optimized Title
                </span>
                <button
                  onClick={() => copyToClipboard(data.youtube_title, "title")}
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "title" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <p className="text-xs font-sans text-neutral-200 font-semibold">
                {data.youtube_title}
              </p>
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-purple-400">
                  High-Rank Search Tags
                </span>
                <button
                  onClick={() => copyToClipboard(data.tags.join(", "), "tags")}
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "tags" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3 md:col-span-2">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-purple-400">
                  Video Chapters & Timestamps
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(data.timestamps.join("\n"), "timestamps")
                  }
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "timestamps" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <pre className="text-[10px] font-mono text-neutral-350 bg-neutral-950 p-2.5 rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap">
                {data.timestamps.join("\n")}
              </pre>
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3 md:col-span-2">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-purple-400">
                  Full Video Description
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(data.youtube_description, "description")
                  }
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "description" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <p className="text-[11px] font-sans text-neutral-300 whitespace-pre-wrap bg-neutral-950 p-3 rounded-lg leading-relaxed max-h-48 overflow-y-auto">
                {data.youtube_description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
