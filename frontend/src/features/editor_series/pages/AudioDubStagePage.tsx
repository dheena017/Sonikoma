import React, { useEffect, useState } from "react";
import {
  Volume2,
  ArrowLeft,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Mic,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const AudioDubStagePage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();


  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-ChristopherNeural");
  const [testLine, setTestLine] = useState("We've fought too hard to let this world fall now.");
  const [pitch, setPitch] = useState("+0Hz");
  const [rate, setRate] = useState("+0%");
  const [synthesizing, setSynthesizing] = useState(false);

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        const v = await aiSeriesApi.listAvailableVoices(seriesId);
        setVoices(v || []);
      } catch (err) {
        console.error("Failed to load dubbing voices:", err);
      }
    };
    load();
  }, [seriesId]);

  const handleSynthesizeTest = async () => {
    if (!seriesId) return;
    try {
      setSynthesizing(true);
      await aiSeriesApi.synthesizeVoice(seriesId, {
        speaker_name: "Ren",
        voice_name: selectedVoice,
        text: testLine,
        pitch,
        rate,
      });
      alert("Vocal line synthesized and preview ready!");
    } catch (err) {
      alert("Failed to synthesize voice track.");
    } finally {
      setSynthesizing(false);
    }
  };

  const getStudioLink = () => {
    if (!project) return `/ai-series`;
    const format = project.format_type;
    if (format === "anime") return `/studio/anime/${seriesId}`;
    if (format === "comic_manga") return `/studio/comic/${seriesId}`;
    return `/studio/manhwa/${seriesId}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(getStudioLink())}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold uppercase tracking-wider">
                <Volume2 className="w-3.5 h-3.5" /> Audio Dub Stage
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
                Edge-TTS Neural Vocal Casting & Dubbing
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate(getStudioLink())}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all"
          >
            Return to Studio
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voices List */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              Neural Voices ({voices.length})
            </h2>
            {voices.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedVoice === v.id
                    ? "bg-rose-600/10 border-rose-500 text-white"
                    : "bg-[#121316] border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="font-bold text-sm text-white mb-0.5">{v.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{v.id}</div>
              </div>
            ))}
          </div>

          {/* Vocal Audition Console */}
          <div className="lg:col-span-2 bg-[#121316] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-rose-400" /> Audition & Dubbing Console
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Sample Spoken Dialogue
              </label>
              <textarea
                rows={3}
                value={testLine}
                onChange={(e) => setTestLine(e.target.value)}
                className="w-full bg-[#18191E] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Voice Pitch Shift
                </label>
                <select
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full bg-[#18191E] border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="-10Hz">-10Hz (Deeper Heroic)</option>
                  <option value="+0Hz">+0Hz (Natural Neutral)</option>
                  <option value="+10Hz">+10Hz (Higher Youthful)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Delivery Rate / Speed
                </label>
                <select
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full bg-[#18191E] border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="-10%">-10% (Dramatic Deliberate)</option>
                  <option value="+0%">+0% (Standard Pacing)</option>
                  <option value="+15%">+15% (High Energy Action)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSynthesizeTest}
              disabled={synthesizing}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {synthesizing ? "Synthesizing Vocal Performance..." : "Synthesize Dialogue Track"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioDubStagePage;
