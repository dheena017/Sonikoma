import React, { useMemo, useRef, useState } from "react";
import {
  History,
  ArrowRight,
  Play,
  Pause,
  Download,
} from "lucide-react";
import { resolveDownloadNaming } from "@/shared/utils/downloadNaming";

interface MatchingProjectSummary {
  project_id: string;
  job_id?: string | null;
  title?: string;
  url?: string;
  cover_image?: string;
  video_url?: string | null;
  author?: string;
  genre?: string;
  episode?: string;
  panels_count?: number;
  imported_assets_count?: number;
  synopsis?: string | null;
  series_slug?: string | null | undefined;
  chapter_slug?: string | null | undefined;
}

interface WorkspaceResumeCardProps {
  matchingProject: any;
  navigateTo?: (path: string) => void;
  addNotification?: (message: string, type: string) => void;
  getGenreStyle: (genre?: string) => string;
}

const WorkspaceResumeCard: React.FC<WorkspaceResumeCardProps> = ({
  matchingProject,
  navigateTo,
  addNotification,
  getGenreStyle,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.error("Failed to play video:", err);
      });
    }
  };

  const title = matchingProject.title || matchingProject.project_id;
  const videoUrl = matchingProject.video_url || null;

  const downloadName = useMemo(() => {
    const { formattedPrefix } = resolveDownloadNaming({
      seriesTitle: matchingProject.title,
      targetUrl: matchingProject.url || matchingProject.video_url || undefined,
    });
    return `${formattedPrefix}_Master.mp4`;
  }, [matchingProject.title, matchingProject.url, matchingProject.video_url]);

  return (
    <>
      <div className="group bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-[32px] p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl transition-all hover:border-purple-400/50">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full">
          <div className="relative h-28 w-48 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner shrink-0 group-hover:scale-[1.02] transition-transform duration-500">
            {matchingProject.cover_image ? (
              <img
                src={matchingProject.cover_image}
                className="w-full h-full object-cover"
                alt="Series Cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-600/10">
                <History className="h-8 w-8 text-purple-500/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest font-mono">
                In Progress
              </span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                <History className="h-4 w-4 text-purple-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Resume Workspace</h3>
            </div>
            <p className="text-xs text-purple-200/60 font-medium max-w-sm">
              Pick up exactly where you left off with{" "}
              <span className="text-purple-300 font-bold">"{title}"</span>. Your assets and timeline are ready.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!matchingProject.project_id) return;
            const jobId = matchingProject.job_id;
            if (matchingProject.series_slug && matchingProject.chapter_slug) {
              navigateTo?.(
                `/scraper/editor/series/${matchingProject.series_slug}/chapters/${matchingProject.chapter_slug}${jobId ? `?job_id=${encodeURIComponent(jobId)}` : ""}`
              );
            } else {
              navigateTo?.(`/scraper/editor?project_id=${matchingProject.project_id}${jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""}`);
            }
          }}
          className="w-full md:w-auto px-8 py-4 bg-white text-purple-950 font-black rounded-2xl text-xs uppercase tracking-[0.15em] hover:bg-purple-50 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
        >
          Launch Workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {videoUrl && (
        <div className="w-full bg-[#111116]/60 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVideoPlay}
                className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 hover:bg-emerald-500/35 hover:scale-105 active:scale-95 transition-all text-emerald-400 cursor-pointer"
                title={isVideoPlaying ? "Pause Video" : "Play Video"}
              >
                {isVideoPlaying ? (
                  <Pause className="h-4 w-4 text-emerald-400 fill-emerald-400 animate-pulse" />
                ) : (
                  <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />
                )}
              </button>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Final Production Master Video
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  The latest compiled video for "{title}" is ready.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="w-full lg:w-2/3 aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 relative">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full cursor-pointer"
                poster={matchingProject.cover_image || undefined}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
              />
            </div>
            <div className="w-full lg:w-1/3 space-y-4 self-start lg:self-center bg-neutral-900/30 border border-neutral-800/40 rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Series Title</span>
                  <p className="text-xs font-bold text-white line-clamp-1">{title}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Chapter</span>
                  <p className="text-xs font-semibold text-neutral-300 line-clamp-1">
                    {matchingProject.episode || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-neutral-800/30 pt-3">
                {matchingProject.author && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Author</span>
                    <p className="text-xs font-medium text-neutral-350 line-clamp-1">{matchingProject.author}</p>
                  </div>
                )}
                {matchingProject.genre && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Genre</span>
                    <div className="pt-0.5">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getGenreStyle(matchingProject.genre)}`}>
                        {matchingProject.genre.split("/")[0]}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {((matchingProject.panels_count ?? 0) > 0 || (matchingProject.imported_assets_count ?? 0) > 0) && (
                <div className="space-y-1 border-t border-neutral-800/30 pt-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Structure</span>
                  <p className="text-xs font-medium text-neutral-350">
                    {matchingProject.panels_count || matchingProject.imported_assets_count} panels compiled
                    {matchingProject.imported_assets_count && matchingProject.panels_count && matchingProject.panels_count !== matchingProject.imported_assets_count
                      ? ` (${matchingProject.imported_assets_count} imported assets)`
                      : ""}
                  </p>
                </div>
              )}

              {matchingProject.synopsis && (
                <div className="space-y-1 border-t border-neutral-800/30 pt-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono">Synopsis</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2" title={matchingProject.synopsis}>
                    {matchingProject.synopsis}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-800/30 flex flex-col gap-2.5">
                <a
                  href={videoUrl}
                  download={downloadName}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none border border-emerald-500/30 shadow-lg shadow-emerald-950/20 font-sans active:scale-95 text-center"
                >
                  <Download className="h-4 w-4" /> Download Video File
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(videoUrl || "");
                    addNotification?.("Video link copied to clipboard!", "success");
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-neutral-800 active:scale-95 text-center"
                  title="Copy public link"
                >
                  Copy Video Link
                </button>

                <div className="flex items-center gap-1.5 justify-center text-[9px] text-neutral-500 font-mono pt-1">
                  <span>MP4</span>
                  <span>•</span>
                  <span>1080p</span>
                  <span>•</span>
                  <span>24 FPS</span>
                  <span>•</span>
                  <span>AAC Stereo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspaceResumeCard;
