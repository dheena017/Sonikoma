import React, { useState } from "react";
import { Sparkles, Layers } from "lucide-react";

interface ThumbnailLayoutFormProps {
  conceptPrompt: string;
}

interface LayoutData {
  background_style: string;
  subject_placement: string;
  glowing_elements: string[];
  face_expression: string;
}

export default function ThumbnailLayoutForm({
  conceptPrompt,
}: ThumbnailLayoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [character, setCharacter] = useState("Jinwoo");
  const [layout, setLayout] = useState<LayoutData | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/thumbnail-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thumbnail_concept:
            conceptPrompt || "Tense combat close-up illustration",
          main_character: character,
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setLayout(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            Graphic Artist Layering Instructions
          </h4>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3.5 py-1.5 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          {loading ? "Designing..." : "✦ Suggest Layout"}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-mono text-neutral-500 uppercase">
          Main Focus Character
        </label>
        <input
          type="text"
          value={character}
          onChange={(e) => setCharacter(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-neutral-350 outline-none"
        />
      </div>

      {layout && !loading && (
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2 text-[10px] font-mono animate-fade-in">
          <div className="flex justify-between border-b border-neutral-900 pb-1.5">
            <span className="text-neutral-500">Subject Alignment</span>
            <span className="text-neutral-350 font-bold uppercase">
              {layout.subject_placement}
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-900 pb-1.5">
            <span className="text-neutral-500">Character Expression</span>
            <span className="text-neutral-350 font-semibold">
              {layout.face_expression}
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-900 pb-1.5">
            <span className="text-neutral-500">Canvas Background</span>
            <span
              className="text-neutral-350 font-semibold truncate max-w-[200px]"
              title={layout.background_style}
            >
              {layout.background_style}
            </span>
          </div>
          <div className="pt-1.5 space-y-1">
            <span className="text-neutral-500 block">
              Glowing & Outline Effects:
            </span>
            <div className="flex flex-wrap gap-1">
              {layout.glowing_elements.map((glow, idx) => (
                <span
                  key={idx}
                  className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-purple-300"
                >
                  {glow}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
