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
  ArrowRight,
  Eye,
  FileText,
} from "lucide-react";
import { getSourceName, getPanelFilterStyle } from "../utils";

interface ProjectDetailsPageProps {
  onNavigateHome: () => void;
  navigateTo: (path: string) => void;
  setGlobalDirty?: (dirty: boolean) => void;
  setGlobalSaveStatus?: (status: "idle" | "saving" | "saved" | "error") => void;
  registerSaveHandler?: (handler: (() => Promise<void>) | null) => void;
}

export default function ProjectDetailsPage({
  onNavigateHome,
  navigateTo,
  setGlobalDirty,
  setGlobalSaveStatus,
  registerSaveHandler,
}: ProjectDetailsPageProps) {
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [project, setProject] = React.useState<any | null>(null);
  const [panels, setPanels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activePanelPreview, setActivePanelPreview] = React.useState<
    any | null
  >(null);
  const [deleting, setDeleting] = React.useState(false);

  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const initialProjectRef = React.useRef<string>("");
  const initialPanelsRef = React.useRef<any[]>([]);

  const isPanelNew = React.useCallback((panel: any) => {
    if (typeof panel.id === "string" && panel.id.startsWith("temp_")) {
      return true;
    }
    return !initialPanelsRef.current.some((p) => p.id === panel.id);
  }, []);

  const isPanelEdited = React.useCallback(
    (panel: any) => {
      if (isPanelNew(panel)) return false;
      const original = initialPanelsRef.current.find((p) => p.id === panel.id);
      if (!original) return false;

      return (
        (panel.speech_text || "").trim() !==
          (original.speech_text || "").trim() ||
        (panel.sfx || "").trim() !== (original.sfx || "").trim() ||
        Number(panel.duration ?? 4.5) !== Number(original.duration ?? 4.5) ||
        (panel.motion_type || "zoom_in") !==
          (original.motion_type || "zoom_in") ||
        (panel.visual_description || "").trim() !==
          (original.visual_description || "").trim() ||
        Number(panel.brightness ?? 100) !==
          Number(original.brightness ?? 100) ||
        Number(panel.contrast ?? 100) !== Number(original.contrast ?? 100) ||
        Number(panel.saturation ?? 100) !==
          Number(original.saturation ?? 100) ||
        Boolean(panel.grayscale) !== Boolean(original.grayscale) ||
        (panel.filter_preset || "") !== (original.filter_preset || "") ||
        (panel.bubble_method || "connected_components") !==
          (original.bubble_method || "connected_components") ||
        Number(panel.bubble_sensitivity ?? 0.5) !==
          Number(original.bubble_sensitivity ?? 0.5) ||
        Number(panel.bubble_dilation ?? 4) !==
          Number(original.bubble_dilation ?? 4) ||
        Number(panel.inpaint_radius ?? 3) !==
          Number(original.inpaint_radius ?? 3) ||
        (panel.detection_style || "standard") !==
          (original.detection_style || "standard")
      );
    },
    [isPanelNew]
  );

  const serializeState = React.useCallback((pObj: any, pList: any[]) => {
    return JSON.stringify({
      title: (pObj?.title || "").trim(),
      genre: (pObj?.genre || "").trim(),
      episode: (pObj?.episode || "").trim(),
      author: (pObj?.author || "").trim(),
      cover_image: (pObj?.cover_image || "").trim(),
      synopsis: (pObj?.synopsis || "").trim(),
      panels: pList.map((p) => ({
        image_url: p.image_url,
        original_url: p.original_url || null,
        speech_text: p.speech_text || "",
        sfx: p.sfx || "",
        duration: p.duration || 4.5,
        motion_type: p.motion_type || "zoom_in",
        visual_description: p.visual_description || null,
        brightness: p.brightness ?? null,
        contrast: p.contrast ?? null,
        saturation: p.saturation ?? null,
        grayscale: p.grayscale ? 1 : 0,
        filter_preset: p.filter_preset || null,
        bubble_method: p.bubble_method || null,
        bubble_sensitivity: p.bubble_sensitivity ?? null,
        bubble_dilation: p.bubble_dilation ?? null,
        inpaint_radius: p.inpaint_radius ?? null,
        detection_style: p.detection_style || null,
      })),
    });
  }, []);

  const isDirty = React.useMemo(() => {
    if (!project) return false;
    return serializeState(project, panels) !== initialProjectRef.current;
  }, [project, panels, serializeState]);

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
        const token = (localStorage.getItem("anivox_token") || sessionStorage.getItem("anivox_token"));
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/projects/${projectId}`, { headers });
        if (!res.ok) {
          throw new Error(
            `Failed to load project details (HTTP ${res.status})`
          );
        }
        const data = await res.json();
        if (data.success) {
          setProject(data.project);
          setPanels(data.panels || []);
          initialPanelsRef.current = JSON.parse(
            JSON.stringify(data.panels || [])
          );
          if (data.panels && data.panels.length > 0) {
            setActivePanelPreview(data.panels[0]);
          }
          initialProjectRef.current = serializeState(
            data.project,
            data.panels || []
          );
        } else {
          throw new Error(data.message || "Failed to load project details");
        }
      } catch (err: any) {
        setError(
          err.message || "An unexpected error occurred while fetching details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [projectId, serializeState]);

  // Load project into active workspace
  const handleLoadToWorkspace = async () => {
    if (!project) return;
    try {
      navigateTo(
        `/dashboard?id=${project.project_id}&url=${encodeURIComponent(
          project.url
        )}&model=gemini-2.5-flash&source=custom`
      );
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete project
  const handleDelete = async () => {
    if (!projectId) return;
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmDelete = await confirm(
      "Are you sure you want to delete this project and all its storyboard panels permanently? This cannot be undone.",
      "Delete Project",
      "red"
    );
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const token = (localStorage.getItem("anivox_token") || sessionStorage.getItem("anivox_token"));
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers,
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

  const handleProjectFieldChange = (field: string, value: any) => {
    setProject((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePanelFieldChange = (
    panelId: string | number,
    field: string,
    value: any
  ) => {
    const updatedPanels = panels.map((p) => {
      if (p.id === panelId) {
        const updated = { ...p, [field]: value };
        if (activePanelPreview && activePanelPreview.id === panelId) {
          setActivePanelPreview(updated);
        }
        return updated;
      }
      return p;
    });
    setPanels(updatedPanels);
  };

  const handleSaveChanges = React.useCallback(async () => {
    if (!projectId || !project) return;
    setSaveStatus("saving");
    try {
      const token = (localStorage.getItem("anivox_token") || sessionStorage.getItem("anivox_token"));
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Re-map panel_index strictly to make them contiguous
      const mappedPanels = panels.map((p, idx) => ({
        image_url: p.image_url,
        original_url: p.original_url || p.image_url,
        speech_text: p.speech_text || "",
        sfx: p.sfx || "",
        duration: p.duration || 4.5,
        motion_type: p.motion_type || "zoom_in",
        visual_description: p.visual_description || null,
        brightness: p.brightness,
        contrast: p.contrast,
        saturation: p.saturation,
        grayscale: !!p.grayscale,
        filter_preset: p.filter_preset,
        bubble_method: p.bubble_method,
        bubble_sensitivity: p.bubble_sensitivity,
        bubble_dilation: p.bubble_dilation,
        inpaint_radius: p.inpaint_radius,
        detection_style: p.detection_style,
      }));

      const formattedEpisode = (() => {
        const num = (project.episode || "").trim();
        return num || "Chapter 1";
      })();

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: project.title.trim() || "Untitled Project",
          genre: project.genre.trim() || "general",
          episode: formattedEpisode,
          author: (project.author || "Unknown Author").trim(),
          cover_image: project.cover_image || null,
          synopsis: project.synopsis || null,
          panels: mappedPanels,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        initialProjectRef.current = serializeState(project, panels);
        initialPanelsRef.current = JSON.parse(JSON.stringify(panels));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        throw new Error(data.message || "Failed to save project.");
      }
    } catch (e: any) {
      setSaveStatus("error");
      alert(e.message || "Error saving changes.");
    }
  }, [projectId, project, panels, serializeState]);

  React.useEffect(() => {
    if (setGlobalDirty) {
      setGlobalDirty(isDirty);
    }
  }, [isDirty, setGlobalDirty]);

  React.useEffect(() => {
    if (setGlobalSaveStatus) {
      setGlobalSaveStatus(saveStatus);
    }
  }, [saveStatus, setGlobalSaveStatus]);

  React.useEffect(() => {
    if (registerSaveHandler) {
      registerSaveHandler(handleSaveChanges);
      return () => {
        registerSaveHandler(null);
      };
    }
  }, [handleSaveChanges, registerSaveHandler]);

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
          <h2 className="text-lg font-black text-rose-400">
            Error Loading Project
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {error ||
              "Project metadata could not be fetched. The project ID might be invalid or deleted."}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
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
                {(project.title || "Untitled Project").replace(
                  /\s+[a-fA-F0-9]{8}$/,
                  ""
                )}
              </h1>
              {project.author && project.author !== "Unknown Author" && (
                <p className="text-xs text-neutral-400 font-bold mt-0.5">
                  by {project.author}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Dynamic Save changes button */}
            {saveStatus === "saving" ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300 text-xs font-bold font-mono tracking-wider select-none shadow-[0_0_10px_-2px_rgba(245,158,11,0.2)] cursor-not-allowed"
              >
                <svg
                  className="animate-spin h-3.5 w-3.5 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>SAVING...</span>
              </button>
            ) : saveStatus === "error" ? (
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/35 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 text-xs font-bold font-mono tracking-wider cursor-pointer transition-all active:scale-95 shadow-[0_0_10px_-2px_rgba(239,68,68,0.25)]"
              >
                <span className="text-rose-400">⚠️</span>
                <span>RETRY SAVE</span>
              </button>
            ) : isDirty ? (
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-950/30 hover:shadow-purple-900/40 animate-pulse"
              >
                <span>✦</span>
                <span>SAVE CHANGES</span>
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs font-bold font-mono tracking-wider select-none shadow-[0_0_10px_-2px_rgba(52,211,153,0.2)]"
              >
                <span className="text-emerald-400">✓</span>
                <span>SAVED</span>
              </button>
            )}

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
          {/* Left Column (Metadata Inputs + Cover + Synopsis) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Metadata Statistics Card */}
            <div className="bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-xl w-full">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

              {project.cover_image && (
                <div className="w-full aspect-[2/3] max-h-[200px] rounded-2xl overflow-hidden border border-white/5 relative group flex items-center justify-center bg-black/40">
                  <img
                    src={project.cover_image}
                    alt={project.title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
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

              <div className="space-y-3.5 text-left text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">
                    Comic / Manhwa Title
                  </label>
                  <input
                    type="text"
                    value={project.title || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("title", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">
                    Author / Creator
                  </label>
                  <input
                    type="text"
                    value={project.author || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("author", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">
                    Category Genre
                  </label>
                  <input
                    type="text"
                    value={project.genre || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("genre", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">
                    Chapter / Episode
                  </label>
                  <input
                    type="text"
                    value={project.episode || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("episode", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">
                    Cover Image URL
                  </label>
                  <input
                    type="text"
                    value={project.cover_image || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("cover_image", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all font-mono"
                  />
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">
                    Source Website
                  </span>
                  <span className="text-neutral-300 font-bold font-mono">
                    {getSourceName(project.url)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">
                    Status Profile
                  </span>
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

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">
                    Total Panels
                  </span>
                  <span className="text-neutral-300 font-bold">
                    {panels.length} frames
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">
                    Video Length
                  </span>
                  <span className="text-neutral-300 font-bold">
                    {totalDuration.toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-neutral-500 font-bold">
                    Date Seeded
                  </span>
                  <span className="text-neutral-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                    {project.created_at
                      ? project.created_at.split(" ")[0]
                      : "N/A"}
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

            {project.synopsis !== undefined && (
              <div className="bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-6 space-y-3 shadow-xl relative overflow-hidden backdrop-blur-xl w-full">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                  <FileText className="w-4 h-4 text-purple-450" />
                  Synopsis / Storyline
                </h4>
                <textarea
                  value={project.synopsis || ""}
                  onChange={(e) =>
                    handleProjectFieldChange("synopsis", e.target.value)
                  }
                  className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all font-sans resize-none"
                  rows={5}
                  placeholder="Type synopsis here..."
                />
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
                  <h4 className="text-sm font-bold text-neutral-300">
                    No Rendered Video Available
                  </h4>
                  <p className="text-xs text-neutral-550 max-w-xs leading-relaxed font-semibold">
                    The storyboard is ready, but the cinematic MP4 compiler
                    hasn't run yet. Load it into your active workspace to
                    generate speech voiceovers and pan/zoom effects.
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

        {/* ACTIVE PANEL METADATA DRAWER (Visual Detail Overlay & Panel Editor) */}
        {activePanelPreview && (
          <div className="bg-[#0b0b0e]/75 border border-white/10 rounded-3xl p-6 shadow-xl relative backdrop-blur-xl">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Panel Image Container */}
              <div className="md:col-span-1 aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-lg relative group flex items-center justify-center">
                <img
                  src={activePanelPreview.image_url}
                  alt={`Panel ${activePanelPreview.panel_index + 1}`}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
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
                      <textarea
                        value={activePanelPreview.speech_text || ""}
                        onChange={(e) =>
                          handlePanelFieldChange(
                            activePanelPreview.id,
                            "speech_text",
                            e.target.value
                          )
                        }
                        className="w-full bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 mt-1.5 font-sans resize-none"
                        rows={3}
                        placeholder="Type dialogue transcript..."
                      />
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        Visual Scene Description
                      </h4>
                      <textarea
                        value={activePanelPreview.visual_description || ""}
                        onChange={(e) =>
                          handlePanelFieldChange(
                            activePanelPreview.id,
                            "visual_description",
                            e.target.value
                          )
                        }
                        className="w-full bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 mt-1.5 font-sans resize-none"
                        rows={3}
                        placeholder="Describe panel scene actions..."
                      />
                    </div>
                  </div>

                  {/* SFX indicators */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                      Sound Effect (SFX) Cues
                    </h4>
                    <input
                      type="text"
                      value={activePanelPreview.sfx || ""}
                      onChange={(e) =>
                        handlePanelFieldChange(
                          activePanelPreview.id,
                          "sfx",
                          e.target.value
                        )
                      }
                      placeholder="e.g. BOOM, SLASH..."
                      className="w-full bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 mt-1.5"
                    />
                  </div>
                </div>

                {/* Panel Rendering Stats Grid */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  {/* Grid 1: Dynamics & Color Preset */}
                  <div>
                    <h5 className="text-[9px] font-black uppercase text-neutral-500 tracking-wider mb-2">
                      Panel Dynamics & Styling
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Motion Type
                        </span>
                        <select
                          value={activePanelPreview.motion_type || "zoom_in"}
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "motion_type",
                              e.target.value
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        >
                          <option value="zoom_in">Zoom In</option>
                          <option value="zoom_out">Zoom Out</option>
                          <option value="pan_left">Pan Left</option>
                          <option value="pan_right">Pan Right</option>
                          <option value="pan_up">Pan Up</option>
                          <option value="pan_down">Pan Down</option>
                          <option value="static">Static</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Duration
                        </span>
                        <input
                          type="number"
                          step={0.1}
                          min={0.5}
                          value={activePanelPreview.duration || 4.5}
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "duration",
                              parseFloat(e.target.value) || 4.5
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        />
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Color Filter
                        </span>
                        <select
                          value={activePanelPreview.filter_preset || ""}
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "filter_preset",
                              e.target.value || null
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        >
                          <option value="">None</option>
                          <option value="sepia">Sepia</option>
                          <option value="cinematic">Cinematic</option>
                          <option value="cool">Cool</option>
                          <option value="warm">Warm</option>
                          <option value="vintage">Vintage</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Grayscale Mode
                        </span>
                        <label className="flex items-center gap-2 mt-2 select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!activePanelPreview.grayscale}
                            onChange={(e) =>
                              handlePanelFieldChange(
                                activePanelPreview.id,
                                "grayscale",
                                e.target.checked
                              )
                            }
                            className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 border-neutral-700 bg-neutral-900 rounded"
                          />
                          <span className="text-[10px] font-semibold text-neutral-300">
                            Grayscale
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Advanced CV Detection Settings */}
                  <div>
                    <h5 className="text-[9px] font-black uppercase text-neutral-500 tracking-wider mb-2">
                      Advanced CV & Inpainting
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Detection Style
                        </span>
                        <select
                          value={
                            activePanelPreview.detection_style || "standard"
                          }
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "detection_style",
                              e.target.value
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        >
                          <option value="standard">Standard</option>
                          <option value="strict">Strict</option>
                          <option value="relaxed">Relaxed</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Inpaint Sensitivity
                        </span>
                        <input
                          type="number"
                          step={0.05}
                          min={0.0}
                          max={1.0}
                          value={
                            activePanelPreview.bubble_sensitivity !== null &&
                            activePanelPreview.bubble_sensitivity !== undefined
                              ? activePanelPreview.bubble_sensitivity
                              : 0.5
                          }
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "bubble_sensitivity",
                              parseFloat(e.target.value) || 0.5
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        />
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Bubble Method
                        </span>
                        <select
                          value={
                            activePanelPreview.bubble_method ||
                            "connected_components"
                          }
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "bubble_method",
                              e.target.value
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        >
                          <option value="connected_components">
                            Connected Components
                          </option>
                          <option value="contour_detection">
                            Contour Detection
                          </option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Bubble Dilation
                        </span>
                        <input
                          type="number"
                          step={1}
                          min={0}
                          value={
                            activePanelPreview.bubble_dilation !== null &&
                            activePanelPreview.bubble_dilation !== undefined
                              ? activePanelPreview.bubble_dilation
                              : 4
                          }
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "bubble_dilation",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        />
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Inpaint Radius
                        </span>
                        <input
                          type="number"
                          step={1}
                          min={0}
                          value={
                            activePanelPreview.inpaint_radius !== null &&
                            activePanelPreview.inpaint_radius !== undefined
                              ? activePanelPreview.inpaint_radius
                              : 3
                          }
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "inpaint_radius",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grid 3: Fine-Tuning Image Adjustment Parameters */}
                  <div className="border-t border-white/5 pt-3">
                    <h5 className="text-[9px] font-black uppercase text-neutral-500 tracking-wider mb-2">
                      Image Adjustments
                    </h5>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Brightness (%)
                        </span>
                        <input
                          type="number"
                          step={5}
                          min={0}
                          max={300}
                          value={
                            activePanelPreview.brightness !== null &&
                            activePanelPreview.brightness !== undefined
                              ? activePanelPreview.brightness
                              : 100
                          }
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "brightness",
                              parseInt(e.target.value) || 100
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        />
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Contrast (%)
                        </span>
                        <input
                          type="number"
                          step={5}
                          min={0}
                          max={300}
                          value={
                            activePanelPreview.contrast !== null &&
                            activePanelPreview.contrast !== undefined
                              ? activePanelPreview.contrast
                              : 100
                          }
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "contrast",
                              parseInt(e.target.value) || 100
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        />
                      </div>

                      <div>
                        <span className="block text-neutral-500 font-bold mb-1">
                          Saturation (%)
                        </span>
                        <input
                          type="number"
                          step={5}
                          min={0}
                          max={300}
                          value={
                            activePanelPreview.saturation !== null &&
                            activePanelPreview.saturation !== undefined
                              ? activePanelPreview.saturation
                              : 100
                          }
                          onChange={(e) =>
                            handlePanelFieldChange(
                              activePanelPreview.id,
                              "saturation",
                              parseInt(e.target.value) || 100
                            )
                          }
                          className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 w-full"
                        />
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
              Dynamic Storyboard &amp; OCR Transcription ({panels.length})
            </h3>
            <span className="text-[10px] text-neutral-500 font-bold">
              Click on a panel to inspect its advanced CV settings and edit
              dialogue details above
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {panels.map((panel, idx) => {
              const isActive =
                activePanelPreview && activePanelPreview.id === panel.id;

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

                  {/* Unsaved New/Edited Badges */}
                  {isPanelNew(panel) && (
                    <span className="absolute top-2 left-12 z-20 bg-emerald-500/90 text-[8px] font-black text-white py-0.5 px-1.5 rounded-lg border border-emerald-400/30 font-mono tracking-wider animate-pulse shadow-md">
                      NEW
                    </span>
                  )}
                  {isPanelEdited(panel) && (
                    <span className="absolute top-2 left-12 z-20 bg-amber-500/90 text-[8px] font-black text-white py-0.5 px-1.5 rounded-lg border border-amber-400/30 font-mono tracking-wider shadow-md">
                      EDITED
                    </span>
                  )}

                  {/* Delete Panel Button */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirm =
                        (window as any).confirmAsync || window.confirm;
                      const confirmed = await confirm(
                        `Remove panel #${idx + 1} from storyboard sequence?`,
                        "Remove Panel",
                        "red"
                      );
                      if (confirmed) {
                        const updated = panels.filter(
                          (_, pIdx) => pIdx !== idx
                        );
                        setPanels(updated);
                        if (
                          activePanelPreview &&
                          activePanelPreview.id === panel.id
                        ) {
                          setActivePanelPreview(updated[0] || null);
                        }
                      }
                    }}
                    className="absolute top-2 right-2 z-20 p-1 bg-black/80 hover:bg-rose-600 text-neutral-450 hover:text-white rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove panel"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Panel Thumbnail */}
                  <div className="aspect-square w-full rounded-xl overflow-hidden border border-white/5 bg-black/60 shadow-inner relative flex items-center justify-center">
                    <img
                      src={panel.image_url}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Panel Snippets */}
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-neutral-300 font-bold truncate">
                      {panel.speech_text
                        ? `"${panel.speech_text}"`
                        : "(No Speech)"}
                    </p>
                    <div className="flex items-center justify-between text-[8px] text-neutral-500 font-mono">
                      <span>{panel.duration || 4.5}s</span>
                      <span className="uppercase text-purple-450">
                        {panel.motion_type || "zoom_in"}
                      </span>
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
