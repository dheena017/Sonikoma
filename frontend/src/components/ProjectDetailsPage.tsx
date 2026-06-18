import React from "react";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Loader2,
  Play,
  Video,
  LayoutGrid,
  Trash2,
  Sparkles,
  Sliders,
  Volume2,
  Clock,
  Settings,
  Activity,
  Layers,
  Compass,
  ArrowRight,
  Eye,
  FileText
} from "lucide-react";
import { getSourceName, getPanelFilterStyle } from "../utils";

interface ProjectDetailsPageProps {
  onNavigateHome: () => void;
  navigateTo: (path: string) => void;
}

export default function ProjectDetailsPage({
  onNavigateHome,
  navigateTo,
}: ProjectDetailsPageProps) {
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [project, setProject] = React.useState<any | null>(null);
  const [panels, setPanels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activePanelPreview, setActivePanelPreview] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Extract projectId from query string
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    setProjectId(id);
  }, []);

  // Fetch project details
  React.useEffect(() => {
    if (!projectId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("anivox_token");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/projects/${projectId}`, { headers });
        if (!res.ok) {
          throw new Error(`Failed to load project details (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (data.success) {
          setProject(data.project);
          setPanels(data.panels || []);
          if (data.panels && data.panels.length > 0) {
            setActivePanelPreview(data.panels[0]);
          }
        } else {
          throw new Error(data.message || "Failed to load project details");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [projectId]);

  // Load project into active workspace
  const handleLoadToWorkspace = async () => {
    if (!project) return;
    try {
      const token = localStorage.getItem("anivox_token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Navigate to dashboard and append state restore triggers
      navigateTo(`/dashboard?id=${project.project_id}&url=${encodeURIComponent(project.url)}&model=gemini-2.5-flash&source=custom`);
      
      // Small timeout to allow workspace to scrape or load from cache
      setTimeout(() => {
        // Trigger page refresh to reset app state if needed
        window.location.reload();
      }, 100);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete project
  const handleDelete = async () => {
    if (!projectId || !window.confirm("Are you sure you want to delete this project and all its storyboard panels permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("anivox_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers
      });
      if (!res.ok) {
        throw new Error(`Failed to delete (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        navigateTo("/profile");
      } else {
        throw new Error(data.message || "Failed to delete project");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting project");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-sm font-bold text-neutral-400 font-mono">
          Retrieving comprehensive project details...
        </p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-md space-y-3">
          <h2 className="text-lg font-black text-rose-400">Error Loading Project</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {error || "Project metadata could not be fetched. The project ID might be invalid or deleted."}
          </p>
        </div>
        <button
          onClick={() => navigateTo("/profile")}
          className="px-5 py-2 bg-neutral-900 border border-white/5 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          Return to Profile Page
        </button>
      </div>
    );
  }

  const isCompleted = (project.status || "").toLowerCase() === "completed";
  const totalDuration = panels.reduce((sum, p) => sum + (p.duration || 0), 0);

  return (
    <div className="min-h-screen bg-[#070709] text-white py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex-1 w-full text-left">
      {/* Visual Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/5 blur-[130px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        
        {/* TOP BAR / NAVIGATION */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("/profile")}
              className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-neutral-400 hover:text-white rounded-2xl transition-all cursor-pointer active:scale-95"
              title="Back to profile"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                  Project Workspace
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
                <span className="text-[9px] font-mono text-neutral-500 font-bold">
                  ID: {project.project_id}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight">
                {(project.title || "Untitled Project").replace(/\s+[a-fA-F0-9]{8}$/, "")}
              </h1>
              {project.author && project.author !== "Unknown Author" && (
                <p className="text-xs text-neutral-400 font-bold mt-0.5">
                  by {project.author}
                </p>
              )}
              {project.episode && (() => {
                const epParts = project.episode.split(" - ");
                const numStr = epParts[0];
                const nameStr = epParts.slice(1).join(" - ");
                return (
                  <p className="text-xs text-purple-400 font-extrabold font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>✦ {numStr}</span>
                    {nameStr && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-neutral-600 shrink-0" />
                        <span className="text-neutral-400 font-sans font-bold">{nameStr}</span>
                      </>
                    )}
                  </p>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadToWorkspace}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-500/30 hover:border-purple-400/50 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-md shadow-purple-950/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load to Active Workspace
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-400/30 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* METADATA & PREVIEW ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Metadata + Cover + Synopsis) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Metadata Statistics Card */}
            <div className="bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-xl w-full">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
              
              {project.cover_image && (
                <div className="w-full aspect-[2/3] max-h-[200px] rounded-2xl overflow-hidden border border-white/5 relative group">
                  <img
                    src={project.cover_image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                <Sliders className="w-4 h-4 text-purple-400" />
                Project Metrics
              </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-1 py-1 border-b border-white/5">
                <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Comic / Manhwa</span>
                <span className="text-sm font-black text-purple-400 select-all leading-tight">
                  {(project.title || "Untitled Manhwa").replace(/\s+[a-fA-F0-9]{8}$/, "")}
                </span>
              </div>

              {project.author && project.author !== "Unknown Author" && (
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">Author / Creator</span>
                  <span className="text-neutral-300 font-bold">
                    {project.author}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-neutral-500 font-bold">Source Website</span>
                <span className="text-neutral-300 font-bold font-mono">
                  {getSourceName(project.url)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-neutral-500 font-bold">Status Profile</span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {project.status || "Pending"}
                </span>
              </div>

              {project.genre && (
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">Category Genre</span>
                  <span className="text-neutral-355 font-bold uppercase tracking-wide">
                    {project.genre}
                  </span>
                </div>
              )}

              {project.episode && (() => {
                const epParts = project.episode.split(" - ");
                const numStr = epParts[0];
                const nameStr = epParts.slice(1).join(" - ");
                return (
                  <>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                      <span className="text-neutral-500 font-bold">Chapter / Episode</span>
                      <span className="text-neutral-300 font-mono font-bold">
                        {numStr}
                      </span>
                    </div>
                    {nameStr && (
                      <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-neutral-500 font-bold">Chapter Name</span>
                        <span className="text-neutral-300 font-bold max-w-[150px] truncate" title={nameStr}>
                          {nameStr}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-neutral-500 font-bold">Total Panels</span>
                <span className="text-neutral-300 font-bold">
                  {panels.length} frames
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-neutral-500 font-bold">Video Length</span>
                <span className="text-neutral-300 font-bold">
                  {totalDuration.toFixed(1)}s
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-neutral-500 font-bold">Date Seeded</span>
                <span className="text-neutral-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                  {project.created_at ? project.created_at.split(" ")[0] : "N/A"}
                </span>
              </div>
            </div>

            {project.url && (
              <div className="pt-2">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-neutral-900 border border-white/5 hover:border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-neutral-350 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Source Webtoon Page
                </a>
              </div>
            )}
          </div>

          {project.synopsis && (
            <div className="bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-6 space-y-3 shadow-xl relative overflow-hidden backdrop-blur-xl w-full">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
              <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                <FileText className="w-4 h-4 text-purple-450" />
                Synopsis / Storyline
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans whitespace-pre-wrap">
                {project.synopsis}
              </p>
            </div>
          )}
        </div>

          {/* Render Preview Video Card */}
          <div className="lg:col-span-2 bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            
            {project.video_url ? (
              <div className="space-y-4 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-450" />
                    Generated Video Compilation
                  </h3>
                  <a
                    href={project.video_url}
                    download={`anivox_${project.project_id}.mp4`}
                    className="text-[10px] font-bold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Download MP4 Output
                  </a>
                </div>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/90 shadow-inner">
                  <video
                    src={project.video_url}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 space-y-4 my-auto">
                <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 shadow-inner">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-300">No Rendered Video Available</h4>
                  <p className="text-xs text-neutral-500 max-w-xs leading-relaxed font-semibold">
                    The storyboard is ready, but the cinematic MP4 compiler hasn't run yet. Load it into your active workspace to generate speech voiceovers and pan/zoom effects.
                  </p>
                </div>
                <button
                  onClick={handleLoadToWorkspace}
                  className="px-5 py-2.5 bg-neutral-900 border border-white/5 hover:border-white/10 hover:bg-neutral-800/80 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Load Workspace to Compile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE PANEL METADATA DRAWER (Visual Detail Overlay) */}
        {activePanelPreview && (
          <div className="bg-[#0b0b0e]/75 border border-white/10 rounded-3xl p-6 shadow-xl relative backdrop-blur-xl">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Panel Image Container */}
              <div className="md:col-span-1 aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-lg relative group">
                <img
                  src={activePanelPreview.image_url}
                  alt={`Panel ${activePanelPreview.panel_index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ filter: getPanelFilterStyle(activePanelPreview) }}
                />
                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-xl text-[9px] font-black uppercase text-purple-400 border border-purple-500/20 font-mono shadow-md">
                  Frame #{activePanelPreview.panel_index + 1}
                </div>
                {activePanelPreview.original_url && (
                  <a
                    href={activePanelPreview.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 bg-black/75 hover:bg-black backdrop-blur-md px-2.5 py-1 rounded-xl text-[9px] font-bold text-neutral-300 hover:text-white border border-white/10 shadow-md flex items-center gap-1 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Original
                  </a>
                )}
              </div>

              {/* Panel Text Speech, SFX & Visual Description details */}
              <div className="md:col-span-2 flex flex-col justify-between text-left space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        Speech Balloon Text
                      </h4>
                      {activePanelPreview.speech_text ? (
                        <div className="mt-1.5 p-4 bg-neutral-900/60 border border-white/5 rounded-2xl relative shadow-inner">
                          <div className="absolute top-[-5px] left-5 w-3 h-3 bg-neutral-900 border-l border-t border-white/5 rotate-45" />
                          <p className="text-sm text-neutral-200 leading-relaxed font-bold italic select-none">
                            "{activePanelPreview.speech_text}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-550 italic font-semibold mt-1">
                          (No speech or voiceover dialogue transcribed)
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        Visual Scene Description
                      </h4>
                      {activePanelPreview.visual_description ? (
                        <div className="mt-1.5 p-4 bg-neutral-900/40 border border-white/5 rounded-2xl relative shadow-inner">
                          <p className="text-xs text-neutral-300 leading-relaxed font-semibold">
                            {activePanelPreview.visual_description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-550 italic font-semibold mt-1">
                          (No visual scene description generated)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SFX indicators */}
                  {activePanelPreview.sfx && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        Sound Effect (SFX) Cues
                      </h4>
                      <span className="inline-block mt-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm">
                        💥 {activePanelPreview.sfx}
                      </span>
                    </div>
                  )}
                </div>

                {/* Panel Rendering Stats Grid */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  {/* Grid 1: Dynamics & Color Preset */}
                  <div>
                    <h5 className="text-[9px] font-black uppercase text-neutral-500 tracking-wider mb-2">Panel Dynamics & Styling</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="block text-neutral-500 font-bold">Motion Type</span>
                        <span className="font-mono text-purple-450 font-bold uppercase text-[10px] mt-0.5 block">
                          {activePanelPreview.motion_type || "zoom_in"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Duration</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block">
                          {activePanelPreview.duration || 4.5}s
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Color Filter</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block text-[10px] leading-tight">
                          {activePanelPreview.filter_preset || "None"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Grayscale Mode</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block">
                          {activePanelPreview.grayscale ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Advanced CV Detection Settings */}
                  <div>
                    <h5 className="text-[9px] font-black uppercase text-neutral-500 tracking-wider mb-2">Advanced CV & Inpainting</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                      <div>
                        <span className="block text-neutral-500 font-bold">Detection Style</span>
                        <span className="font-mono text-indigo-400 font-bold uppercase text-[10px] mt-0.5 block">
                          {activePanelPreview.detection_style || "standard"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Inpaint Sensitivity</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block">
                          {activePanelPreview.bubble_sensitivity !== null && activePanelPreview.bubble_sensitivity !== undefined
                            ? `${(activePanelPreview.bubble_sensitivity * 100).toFixed(0)}%`
                            : "Default (50%)"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Bubble Method</span>
                        <span className="font-mono text-neutral-200 font-bold uppercase text-[10px] mt-0.5 block">
                          {activePanelPreview.bubble_method || "connected_components"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Bubble Dilation</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block">
                          {activePanelPreview.bubble_dilation !== null && activePanelPreview.bubble_dilation !== undefined
                            ? `${activePanelPreview.bubble_dilation}px`
                            : "Default (4px)"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Inpaint Radius</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block">
                          {activePanelPreview.inpaint_radius !== null && activePanelPreview.inpaint_radius !== undefined
                            ? `${activePanelPreview.inpaint_radius}px`
                            : "Default (3px)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid 3: Fine-Tuning Image Adjustment Parameters */}
                  <div className="border-t border-white/5 pt-3">
                    <h5 className="text-[9px] font-black uppercase text-neutral-500 tracking-wider mb-2">Image Adjustments</h5>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="block text-neutral-500 font-bold">Brightness</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block">
                          {activePanelPreview.brightness !== null && activePanelPreview.brightness !== undefined
                            ? `${activePanelPreview.brightness}%`
                            : "100% (Default)"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Contrast</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block">
                          {activePanelPreview.contrast !== null && activePanelPreview.contrast !== undefined
                            ? `${activePanelPreview.contrast}%`
                            : "100% (Default)"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold">Saturation</span>
                        <span className="font-mono text-neutral-200 font-bold mt-0.5 block">
                          {activePanelPreview.saturation !== null && activePanelPreview.saturation !== undefined
                            ? `${activePanelPreview.saturation}%`
                            : "100% (Default)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STORYBOARD FRAMES LIST GRID */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-black uppercase text-neutral-300 tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-purple-450" />
              Storyboard Panel Sequence ({panels.length})
            </h3>
            <span className="text-[10px] text-neutral-500 font-bold">
              Click on a panel to inspect its advanced CV settings and dialogue details above
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {panels.map((panel, idx) => {
              const isActive = activePanelPreview && activePanelPreview.id === panel.id;
              
              return (
                <div
                  key={panel.id || idx}
                  onClick={() => setActivePanelPreview(panel)}
                  className={`group border p-2.5 rounded-2xl transition-all cursor-pointer select-none text-left relative ${
                    isActive
                      ? "bg-purple-950/15 border-purple-500/40 ring-1 ring-purple-500/20"
                      : "bg-[#0d0d10]/50 hover:bg-[#121217]/70 border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Panel Number Badge */}
                  <span className="absolute top-2 left-2 z-20 bg-black/85 backdrop-blur-md text-[8px] font-black font-mono text-neutral-300 py-0.5 px-2 rounded-lg border border-white/10 shadow-sm">
                    #{idx + 1}
                  </span>

                  {/* Panel Thumbnail */}
                  <div className="aspect-square w-full rounded-xl overflow-hidden border border-white/5 bg-black/60 shadow-inner relative">
                    <img
                      src={panel.image_url}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Panel Snippets */}
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-neutral-300 font-bold truncate">
                      {panel.speech_text ? `"${panel.speech_text}"` : "(No Speech)"}
                    </p>
                    <div className="flex items-center justify-between text-[8px] text-neutral-500 font-mono">
                      <span>{panel.duration || 4.5}s</span>
                      <span className="uppercase text-purple-450">{panel.motion_type || "zoom_in"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
