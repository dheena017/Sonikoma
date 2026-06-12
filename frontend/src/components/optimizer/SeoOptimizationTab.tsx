import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

interface SeoOptimizationTabProps {
  title: string;
  genre: string;
  storyboardSummary: string;
}

interface SeoData {
  youtube_title: string;
  youtube_description: string;
  tags: string[];
  timestamps: string[];
}

export default function SeoOptimizationTab({ title, genre, storyboardSummary }: SeoOptimizationTabProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SeoData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "My Webtoon Recap",
          genre: genre || "Action",
          storyboard_summary: storyboardSummary || "The story summary details go here.",
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
      if (json.success && json.result) {
        setData(json.result);
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
          <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">YouTube Algorithm SEO Meta Builder</h4>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Optimize Titles, Tags, Descriptions and Timestamps automatically</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Optimizing..." : "✦ Generate SEO Specs"}
        </button>
      </div>

      {loading && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center animate-pulse">
          <Sparkles className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
          <p className="text-[11px] font-mono text-purple-300 mt-2">Running Video SEO Metadata compiler...</p>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <span className="text-[10px] font-mono font-bold text-purple-400">Viral Optimized Title</span>
              <button
                onClick={() => copyToClipboard(data.youtube_title, "title")}
                className="text-neutral-500 hover:text-white p-1 rounded"
              >
                {copiedField === "title" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <p className="text-xs font-sans text-neutral-200 font-semibold">{data.youtube_title}</p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <span className="text-[10px] font-mono font-bold text-purple-400">High-Rank Search Tags</span>
              <button
                onClick={() => copyToClipboard(data.tags.join(", "), "tags")}
                className="text-neutral-500 hover:text-white p-1 rounded"
              >
                {copiedField === "tags" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag, idx) => (
                <span key={idx} className="text-[9px] font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3 md:col-span-2">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <span className="text-[10px] font-mono font-bold text-purple-400">Video Chapters & Timestamps</span>
              <button
                onClick={() => copyToClipboard(data.timestamps.join("\n"), "timestamps")}
                className="text-neutral-500 hover:text-white p-1 rounded"
              >
                {copiedField === "timestamps" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <pre className="text-[10px] font-mono text-neutral-350 bg-neutral-950 p-2.5 rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap">
              {data.timestamps.join("\n")}
            </pre>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3 md:col-span-2">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <span className="text-[10px] font-mono font-bold text-purple-400">Full Video Description</span>
              <button
                onClick={() => copyToClipboard(data.youtube_description, "description")}
                className="text-neutral-500 hover:text-white p-1 rounded"
              >
                {copiedField === "description" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <p className="text-[11px] font-sans text-neutral-300 whitespace-pre-wrap bg-neutral-950 p-3 rounded-lg leading-relaxed max-h-48 overflow-y-auto">
              {data.youtube_description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
