import React, { useState, useRef } from "react";
import { Sparkles, Music, Play, Pause, Check } from "lucide-react";
import * as api from "../../api/index.js";
import { fetchWithAuth } from "../../utils.js";

interface AmbientSoundPickerProps {
  onSelectMusicTheme: (theme: string) => void;
}

const AVAILABLE_TRACKS = [
  {
    id: "orchestral_battle",
    name: "Orchestral Battle Theme",
    bpm: 140,
    mood: "Epic / Intense",
    freq: 220,
  },
  {
    id: "mysterious_ambience",
    name: "Mysterious Ambience",
    bpm: 70,
    mood: "Suspenseful / Dark",
    freq: 110,
  },
  {
    id: "sci_fi_synth",
    name: "Sci-Fi Synth Wave",
    bpm: 110,
    mood: "Electronic / Future",
    freq: 330,
  },
  {
    id: "calm_acoustic",
    name: "Calm Acoustic Melancholy",
    bpm: 85,
    mood: "Peaceful / Sad",
    freq: 440,
  },
];

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

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const stopPreview = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    setPlayingId(null);
  };

  const playPreview = (track: (typeof AVAILABLE_TRACKS)[0]) => {
    if (playingId === track.id) {
      stopPreview();
      return;
    }

    stopPreview();

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(track.freq, ctx.currentTime);

      // Low volume for preview
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscillatorRef.current = osc;
      gainRef.current = gain;
      setPlayingId(track.id);

      // Pulse the gain to mimic a "beat"
      const interval = 60 / track.bpm;
      const pulse = () => {
        if (oscillatorRef.current === osc) {
          gain.gain.setTargetAtTime(0.1, ctx.currentTime, 0.05);
          gain.gain.setTargetAtTime(0.05, ctx.currentTime + 0.1, 0.1);
          setTimeout(pulse, interval * 1000);
        }
      };
      pulse();
    } catch (e) {
      console.error("Failed to play preview:", e);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const json = await api.runBgmVibeSkill(fetchWithAuth, {
        narrative_mood: mood,
        action_scale: actionScale,
        model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
      });
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
        <div className="bg-neutral-950 p-4 rounded-xl border border-purple-500/20 space-y-3 text-[10px] font-mono animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-purple-400 font-bold uppercase tracking-widest text-[9px]">
                System Recommendation
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vibe.music_vibe_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (vibe.music_vibe_tags.length > 0) {
                  onSelectMusicTheme(vibe.music_vibe_tags[0]);
                }
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3 h-3" /> Apply Vibe
            </button>
          </div>
          <p className="text-neutral-500 italic">
            "Based on the {mood} mood and {actionScale} intensity, I recommend a
            tempo of {vibe.target_bpm} BPM."
          </p>
        </div>
      )}

      {/* Asset Library Preview Section */}
      <div className="space-y-3 pt-2">
        <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">
          Available Soundtrack Assets
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_TRACKS.map((track) => (
            <div
              key={track.id}
              className="bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => playPreview(track)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                    playingId === track.id
                      ? "bg-purple-600 text-white"
                      : "bg-neutral-900 text-neutral-400 group-hover:text-purple-400"
                  }`}
                >
                  {playingId === track.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-200 truncate">
                    {track.name}
                  </p>
                  <p className="text-[9px] text-neutral-500 font-mono">
                    {track.mood} • {track.bpm} BPM
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectMusicTheme(track.name)}
                className="opacity-0 group-hover:opacity-100 p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Select Theme"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
