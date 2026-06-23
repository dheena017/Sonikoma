import React, { useState } from "react";
import { Sparkles, Music } from "lucide-react";

interface AmbientSoundPickerProps {
  onSelectMusicTheme: (theme: string) => void;
}

export default function AmbientSoundPicker({
  onSelectMusicTheme,
}: AmbientSoundPickerProps) {
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState("tense horror battle");
  const [actionScale, setActionScale] = useState("high");
  const [vibe, setVibe] = useState<{
    music_vibe_tags: string[];
    target_bpm: number;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/bgm-vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative_mood: mood,
          action_scale: actionScale,
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setVibe(json.result);
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
          <Music className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            Background Soundtrack Matcher
          </h4>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3.5 py-1.5 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          {loading ? "Matching..." : "✦ Suggest BGM Vibe"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-mono text-neutral-500 uppercase">
            Target Narrative Mood
          </label>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-neutral-350 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-mono text-neutral-500 uppercase">
            Action Intensity Scale
          </label>
          <select
            value={actionScale}
            onChange={(e) => setActionScale(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-neutral-350 outline-none"
          >
            <option>low</option>
            <option>medium</option>
            <option>high</option>
          </select>
        </div>
      </div>

      {vibe && !loading && (
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2 text-[10px] font-mono animate-fade-in flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {vibe.music_vibe_tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-neutral-500">
              Suggested soundtrack tempo:{" "}
              <span className="text-purple-300 font-bold">
                {vibe.target_bpm} BPM
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              if (vibe.music_vibe_tags.length > 0) {
                onSelectMusicTheme(vibe.music_vibe_tags[0]);
              }
            }}
            className="px-2.5 py-1 bg-purple-950/20 border border-purple-800 text-purple-300 rounded text-[9px] font-bold hover:underline cursor-pointer"
          >
            ✓ Apply Theme
          </button>
        </div>
      )}
    </div>
  );
}
