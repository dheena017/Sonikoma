import React, { useEffect, useState } from "react";
import {
  Wind,
  ArrowLeft,
  Sparkles,
  Zap,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const VisualFXChoreographerPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();


  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("leap_rooftops");
  const [intensity, setIntensity] = useState<number>(85);
  const [cameraSweep, setCameraSweep] = useState<string>("orbital_3d");

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        const data = await aiSeriesApi.listMotionPresets();
        setPresets(data.presets || []);
      } catch (err) {
        console.error("Failed to load VFX presets:", err);
      }
    };
    load();
  }, [seriesId]);

  const handleApplyVFX = async () => {
    if (!seriesId) return;
    try {
      await aiSeriesApi.generateMotion(seriesId, {
        panel_id: "panel_active",
        motion_model: "i2v_character_anchor",
        motion_prompt: presets.find((p) => p.id === selectedPreset)?.description || "Kinetic leap",
        intensity: intensity / 100,
        camera_sweep: cameraSweep,
      });
      alert("VFX motion choreographed and saved!");
    } catch (err) {
      alert("Failed to apply VFX motion.");
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
                <Wind className="w-3.5 h-3.5" /> Visual FX Choreographer
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
                Kinetic Motion & Camera Trajectories
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
          {/* Preset Selection */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              Physical Kinetic Presets
            </h2>
            {presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === preset.id
                    ? "bg-rose-600/10 border-rose-500 text-white"
                    : "bg-[#121316] border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="font-bold text-sm text-white mb-1">{preset.title}</div>
                <p className="text-xs text-slate-400 mb-2">{preset.description}</p>
                <span className="text-[10px] font-bold text-rose-400 uppercase">
                  {preset.recommended_for}
                </span>
              </div>
            ))}
          </div>

          {/* Controls Detail */}
          <div className="lg:col-span-2 bg-[#121316] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white mb-4">Choreography Fine-Tuning</h2>

            {/* Camera Sweep */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                3D Camera Sweep Pattern
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "orbital_3d", label: "Orbital 3D Sweep" },
                  { id: "low_angle_rise", label: "Low Angle Rise" },
                  { id: "tracking_sprint", label: "Tracking Sprint" },
                  { id: "whip_pan", label: "Dynamic Whip Pan" },
                  { id: "impact_zoom", label: "Impact Punch Zoom" },
                  { id: "dutch_tilt", label: "Dutch Angle Shift" },
                ].map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => setCameraSweep(cam.id)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      cameraSweep === cam.id
                        ? "bg-rose-600/20 border-rose-500 text-white"
                        : "bg-[#18191E] border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kinetic Velocity Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Motion Velocity & Aura Intensity</span>
                <span className="text-white font-bold">{intensity}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <button
              onClick={handleApplyVFX}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg"
            >
              Apply Kinetic Motion to Scene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualFXChoreographerPage;
