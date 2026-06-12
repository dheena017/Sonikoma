import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

interface ThumbnailGeneratorProps {
  title: string;
  genre: string;
  onGeneratedConcept: (concept: string) => void;
}

interface ConceptData {
  image_generation_prompt: string;
  overlay_text: string;
  ctr_explanation: string;
}

export default function ThumbnailGenerator({ title, genre, onGeneratedConcept }: ThumbnailGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [plotPoint, setPlotPoint] = useState("Protanogist awakens a hidden shadow general");
  const [concept, setConcept] = useState<ConceptData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Solo Leveling",
          genre: genre || "Fantasy",
          plot_point: plotPoint,
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
      if (json.success && json.result) {
        setConcept(json.result);
        onGeneratedConcept(json.result.image_generation_prompt);
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
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <h4 className="text-xs font-mono font-bold text-white uppercase">AI Thumbnail Concept Designer</h4>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          {loading ? "Designing..." : "✦ Draft Concept"}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-mono text-neutral-500 uppercase">Climax Plot Point Highlight</label>
        <input
          type="text"
          value={plotPoint}
          onChange={(e) => setPlotPoint(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-neutral-350 outline-none"
        />
      </div>

      {concept && !loading && (
        <div className="space-y-3 pt-1 animate-fade-in">
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase">CTR Text Overlay:</span>
              <button
                onClick={() => copyToClipboard(concept.overlay_text, "overlay")}
                className="text-neutral-500 hover:text-white"
              >
                {copiedField === "overlay" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <p className="text-sm font-sans font-bold text-yellow-400">"{concept.overlay_text}"</p>
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase">Stable Diffusion Image Prompt:</span>
              <button
                onClick={() => copyToClipboard(concept.image_generation_prompt, "prompt")}
                className="text-neutral-500 hover:text-white"
              >
                {copiedField === "prompt" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <p className="text-[11px] font-sans text-neutral-300 leading-relaxed font-semibold">
              "{concept.image_generation_prompt}"
            </p>
          </div>

          <p className="text-[10px] font-sans text-neutral-500 italic leading-relaxed pl-1">
            <span className="font-mono text-[9px] uppercase font-bold text-purple-300 block">CTR Justification:</span>
            {concept.ctr_explanation}
          </p>
        </div>
      )}
    </div>
  );
}
