import React, { useState } from "react";
import { Sparkles, Wand2, CheckCircle, Copy, AlertCircle } from "lucide-react";

interface YouTubeSeoOptimizerProps {
  initialTitle?: string;
  onApplySeo: (seoData: {
    title: string;
    description: string;
    tags: string[];
  }) => void;
  addNotification?: (msg: string, type: string) => void;
}

export default function YouTubeSeoOptimizer({
  initialTitle = "",
  onApplySeo,
  addNotification,
}: YouTubeSeoOptimizerProps) {
  const [seriesName, setSeriesName] = useState("");
  const [chapterTitle, setChapterTitle] = useState(initialTitle || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await fetch("/api/export/youtube/seo/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: chapterTitle, series: seriesName }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        addNotification?.(
          `✅ AI SEO metadata generated! Score: ${data.seo_score}/100`,
          "success"
        );
      } else {
        addNotification?.("Failed to generate SEO metadata.", "error");
      }
    } catch (err) {
      console.warn("SEO generation notice:", err);
      addNotification?.(
        "SEO generation failed. Check your connection.",
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-neutral-950/50 backdrop-blur-md p-5 border border-neutral-900 rounded-2xl space-y-4 font-mono text-xs text-neutral-300">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
        <span className="text-white font-bold flex items-center gap-2 font-sans">
          <Sparkles className="w-4 h-4 text-[#3B82F6]" />
          Gemini AI SEO & Tag Optimizer
        </span>
        {result && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-[#60A5FA] border border-purple-800/40">
            SEO Score: {result.seo_score}/100
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-[10px] text-neutral-500 font-bold block">
            WEBTOON SERIES NAME:
          </span>
          <input
            type="text"
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            placeholder="e.g. Solo Leveling, Tower of God..."
            className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]/50"
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-neutral-500 font-bold block">
            CHAPTER TITLE / HIGHLIGHT:
          </span>
          <input
            type="text"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            placeholder="e.g. Boss Fight & Power Up..."
            className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]/50"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-2.5 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
      >
        <Wand2 className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
        <span>
          {isGenerating
            ? "Analyzing Keywords & Generating SEO..."
            : "Generate AI YouTube Metadata"}
        </span>
      </button>

      {result && (
        <div className="p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-850 space-y-2.5 animate-fade-in">
          <div>
            <span className="text-[10px] text-neutral-500 font-bold block">
              OPTIMIZED TITLE:
            </span>
            <div className="text-xs text-[#60A5FA] font-bold">
              {result.title}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 font-bold block">
              RECOMMENDED TAGS:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {result.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[10px] text-neutral-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              onApplySeo({
                title: result.title,
                description: result.description,
                tags: result.tags,
              });
              addNotification?.(
                "SEO metadata applied to upload form!",
                "success"
              );
            }}
            className="w-full py-2 bg-purple-950/40 hover:bg-purple-950/80 border border-purple-800/40 text-[#60A5FA] rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5 text-[#3B82F6]" />
            Apply SEO Metadata to Upload
          </button>
        </div>
      )}
    </div>
  );
}
