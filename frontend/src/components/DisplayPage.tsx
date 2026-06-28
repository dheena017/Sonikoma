import React, { useEffect, useState } from "react";
import * as api from "../api/index.js";
import {
  Film,
  BookOpen,
  Clock,
  AlertTriangle,
  Music,
  MessageSquare,
} from "lucide-react";

interface DisplayPageProps {
  projectId: string;
}

interface ProjectData {
  title: string;
  episode: string;
  genre: string;
  author?: string;
  cover_image?: string;
  synopsis?: string;
  video_url?: string;
}

interface PanelData {
  id: number;
  panel_index: number;
  image_url: string;
  speech_text: string;
  sfx: string;
  duration: number;
  motion_type: string;
}

export default function DisplayPage({ projectId }: DisplayPageProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedRatio, setDetectedRatio] = useState<"9/16" | "16/9">("16/9");

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPublicProject(fetch, projectId);
        if (data.success) {
          setProject(data.project);
          setPanels(data.panels || []);
        } else {
          throw new Error(data.message || "Failed to load storyboard data.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] text-white flex flex-col items-center justify-center p-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute w-10 h-10 border-r-4 border-l-4 border-purple-500 rounded-full animate-spin-reverse"></div>
        </div>
        <p className="mt-6 text-sm text-neutral-400 font-medium tracking-wider uppercase animate-pulse">
          Loading Storyboard Experience...
        </p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#060608] text-white flex flex-col items-center justify-center p-6">
        <div className="bg-[#140b0b] border border-red-500/20 rounded-3xl p-8 max-w-md text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-3">Unable to Load Project</h2>
          <p className="text-sm text-neutral-400 mb-6">
            {error || "Project not found or expired."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-neutral-850 hover:bg-neutral-800 border border-white/10 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-indigo-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Header Block */}
        <div className="bg-[#0b0b0f]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row gap-8 items-center">
          {project.cover_image && (
            <div className="w-48 h-48 rounded-2xl overflow-hidden border border-white/15 bg-black/40 flex-shrink-0 shadow-lg">
              <img
                src={project.cover_image}
                alt={project.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/25 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                {project.genre}
              </span>
              {project.episode && (
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/25 rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  {project.episode}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
              {project.title}
            </h1>
            {project.author && (
              <p className="text-sm text-neutral-400 font-medium">
                by <span className="text-neutral-200">{project.author}</span>
              </p>
            )}
            {project.synopsis && (
              <p className="text-sm text-neutral-450 leading-relaxed max-w-3xl">
                {project.synopsis}
              </p>
            )}
          </div>
        </div>

        {/* Video & Info section */}
        {project.video_url && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Film className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-bold tracking-tight">
                Final Cinematic Video
              </h2>
            </div>
            <div className="bg-[#0b0b0f]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
              <div
                className="relative mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl transition-all duration-300 w-full"
                style={
                  detectedRatio === "9/16"
                    ? { maxWidth: "340px", aspectRatio: "9/16" }
                    : { maxWidth: "100%", aspectRatio: "16/9" }
                }
              >
                <video
                  src={project.video_url}
                  controls
                  className="w-full h-full object-contain"
                  poster={project.cover_image}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    if (video.videoHeight > video.videoWidth) {
                      setDetectedRatio("9/16");
                    } else {
                      setDetectedRatio("16/9");
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Storyboard Panels Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold tracking-tight">
              Storyboard panels ({panels.length})
            </h2>
          </div>

          {panels.length === 0 ? (
            <div className="bg-[#0b0b0f]/80 border border-white/5 rounded-3xl p-12 text-center backdrop-blur-xl">
              <p className="text-neutral-500 text-sm">
                No storyboard panels found for this project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {panels.map((panel, index) => (
                <div
                  key={panel.id || index}
                  className="group bg-[#0b0b0f]/60 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-black/40 overflow-hidden border-b border-white/5">
                    <img
                      src={panel.image_url}
                      alt={`Panel ${panel.panel_index}`}
                      className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/75 border border-white/10 rounded-lg text-[10px] font-bold text-neutral-300">
                      #{panel.panel_index}
                    </div>
                    {panel.duration > 0 && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/75 border border-white/10 rounded-lg text-[10px] font-bold text-neutral-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {panel.duration.toFixed(1)}s
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {panel.speech_text && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-neutral-500" />{" "}
                            Dialogue / Caption
                          </span>
                          <p className="text-xs text-neutral-300 leading-relaxed italic bg-white/5 p-2.5 rounded-lg border border-white/5">
                            "{panel.speech_text}"
                          </p>
                        </div>
                      )}
                      {panel.sfx && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                            <Music className="w-3 h-3 text-neutral-500" /> SFX
                          </span>
                          <p className="text-xs text-purple-400 font-semibold tracking-wide">
                            {panel.sfx}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                      <span>Motion</span>
                      <span className="text-neutral-350">
                        {panel.motion_type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
