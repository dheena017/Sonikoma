import React, { useState } from "react";
import { Sparkles, Grid } from "lucide-react";

interface ThumbnailCompositionGuideProps {
  conceptPrompt: string;
}

interface VisualData {
  background_style: string;
  split_screen_ratio: string;
  highlight_borders: string[];
  layout_margins: string;
}

export default function ThumbnailCompositionGuide({
  conceptPrompt,
}: ThumbnailCompositionGuideProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VisualData | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/thumbnail-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thumbnail_concept:
            conceptPrompt || "Tense combat close-up illustration",
          model: "gemini-2.5-flash",
        }),
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

  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4 md:col-span-2">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Grid className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            AI Canvas Splits & Borders Guide
          </h4>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3.5 py-1.5 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          {loading ? "Designing..." : "✦ Suggest Splits"}
        </button>
      </div>

      {data && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono animate-fade-in">
          <div className="bg-neutral-955 p-3 rounded-lg border border-neutral-850 space-y-2">
            <div className="flex justify-between border-b border-neutral-900 pb-1.5">
              <span>Split Screen Ratio</span>
              <span className="text-purple-300 font-bold">
                {data.split_screen_ratio}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">
                Layout margins guideline:
              </span>
              <p className="text-neutral-300 font-sans mt-0.5 leading-relaxed">
                {data.layout_margins}
              </p>
            </div>
          </div>

          <div className="bg-neutral-955 p-3 rounded-lg border border-neutral-850 space-y-2">
            <div>
              <span className="text-neutral-500 block uppercase">
                Canvas Background detail:
              </span>
              <p className="text-neutral-300 font-sans mt-0.5 leading-relaxed">
                {data.background_style}
              </p>
            </div>
            <div className="pt-1">
              <span className="text-neutral-500 block">
                Target Highlight borders:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.highlight_borders.map((b, idx) => (
                  <span
                    key={idx}
                    className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-300"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
