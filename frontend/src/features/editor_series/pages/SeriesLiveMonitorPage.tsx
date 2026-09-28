import React, { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Pause,
  Play,
  ArrowRight,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const SeriesLiveMonitorPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();


  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("Painting Webtoon Panel 4 of 8...");
  const [progress, setProgress] = useState<number>(65);

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
      } catch (err) {
        console.error("Failed to load project:", err);
      }
    };
    load();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const next = prev + 5;
        if (next === 75) setCurrentStep("Applying interactive vector speech bubbles...");
        else if (next === 90) setCurrentStep("Optimizing color grading and particle glow...");
        else if (next >= 100) setCurrentStep("Chapter generation complete! Ready for editing.");
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [seriesId]);

  const getStudioLink = () => {
    if (!project) return `/ai-series`;
    const format = project.format_type;
    if (format === "anime") return `/studio/anime/${seriesId}`;
    if (format === "comic_manga") return `/studio/comic/${seriesId}`;
    return `/studio/manhwa/${seriesId}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 p-6 md:p-10 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full bg-[#121316] border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-violet-600/20 text-violet-400 rounded-2xl animate-pulse">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
              Autonomous Production Engine
            </span>
            <h1 className="text-2xl font-extrabold text-white">
              Generating {project?.title || "AI Series"}
            </h1>
          </div>
        </div>

        {/* Human Readable Status */}
        <div className="bg-[#18191E] border border-slate-800/80 rounded-2xl p-5 mb-6">
          <div className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">
            Current Creative Stage
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            {currentStep}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-900 rounded-full mt-4 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
            <span>Overall Chapter Progress</span>
            <span className="font-bold text-white">{progress}%</span>
          </div>
        </div>

        {/* Action Link */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => navigate("/ai-series")}
            className="text-xs text-slate-400 hover:text-white"
          >
            ← View All Series
          </button>

          <button
            onClick={() => navigate(getStudioLink())}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-900/30 transition-all hover:scale-[1.02]"
          >
            Open in Studio <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeriesLiveMonitorPage;
