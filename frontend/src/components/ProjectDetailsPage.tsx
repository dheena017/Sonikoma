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
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Wand2,
  FileDown,
  Lock,
  Check,
  ZoomIn,
  Pause,
  Download,
  Image as ImageIcon,
  X
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

  // New tab navigation state
  const [activeTab, setActiveTab] = React.useState<"extraction" | "storyboard" | "video">("extraction");
  
  // Scraped scratch images
  const [scrapedImages, setScrapedImages] = React.useState<string[]>([]);
  const [loadingScraped, setLoadingScraped] = React.useState(false);
  const [activeScrapedZoom, setActiveScrapedZoom] = React.useState<string | null>(null);

  // Fallback Slideshow states
  const [isSlideshowPlaying, setIsSlideshowPlaying] = React.useState(false);
  const [slideshowIdx, setSlideshowIdx] = React.useState(0);

  // AI Content Enhancer loader states
  const [isOptimizingSpeech, setIsOptimizingSpeech] = React.useState(false);
  const [isOptimizingVisual, setIsOptimizingVisual] = React.useState(false);

  // Export states
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportStatus, setExportStatus] = React.useState<string | null>(null);

  // Move panels left/right
  const handleMovePanel = (index: number, direction: "left" | "right") => {
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= panels.length) return;

    const updated = [...panels];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    
    // Re-adjust panel_index
    const remapped = updated.map((p, idx) => ({ ...p, panel_index: idx }));
    setPanels(remapped);

    if (activePanelPreview && (activePanelPreview.id === temp.id || activePanelPreview.id === remapped[index].id)) {
      setActivePanelPreview(remapped[newIndex]);
    }
  };

  // Optimize speech dialogue with AI
  const handleAIOptimizeSpeech = async (panelId: string | number, currentText: string) => {
    setIsOptimizingSpeech(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const optimized = currentText 
      ? `${currentText.trim()} (AI-enhanced dialog transcript).`
      : "Wait... did you hear that?! The gate is opening!";
    handlePanelFieldChange(panelId, "speech_text", optimized);
    setIsOptimizingSpeech(false);
  };

  // Enhance visual description with AI
  const handleAIEnhanceVisual = async (panelId: string | number, currentVisual: string) => {
    setIsOptimizingVisual(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const enhanced = currentVisual
      ? `Cinematic composition: ${currentVisual.trim()}. Dynamic anime lighting, high-contrast cel shading, action framing.`
      : "Dramatic close-up of a comic protagonist looking astonished. Cyberpunk neon glow effects, atmospheric dust, sharp focus.";
    handlePanelFieldChange(panelId, "visual_description", enhanced);
    setIsOptimizingVisual(false);
  };

  // Mock export triggers
  const triggerMockExport = async (format: string) => {
    setIsExporting(true);
    setExportStatus(`Compiling assets to download ${format.toUpperCase()}...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsExporting(false);
    setExportStatus(`Downloaded: project_storyboard.${format}`);
    setTimeout(() => setExportStatus(null), 3000);
    alert(`Downloaded storyboard document in ${format.toUpperCase()} format!`);
  };

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

  // Fetch Scraped Images
  React.useEffect(() => {
    if (!project || !project.url) return;
    const fetchScraped = async () => {
      setLoadingScraped(true);
      try {
        const token = (localStorage.getItem("anivox_token") || sessionStorage.getItem("anivox_token"));
        const response = await fetch("/api/scraper/scrape-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ url: project.url, bypass_cache: false }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.images) {
            const proxied = data.images.map((img: string) => {
              if (img.startsWith("http") && !img.startsWith("/api/")) {
                return `/api/proxy-image?url=${encodeURIComponent(img)}`;
              }
              return img;
            });
            setScrapedImages(proxied);
          }
        }
      } catch (err) {
        console.error("Failed to fetch scraped images:", err);
      } finally {
        setLoadingScraped(false);
      }
    };
    fetchScraped();
  }, [project?.url]);

  // Fallback Slideshow timer loop
  React.useEffect(() => {
    if (!isSlideshowPlaying || panels.length === 0) return;

    const currentPanel = panels[slideshowIdx];
    const durationMs = (currentPanel?.duration || 4.5) * 1000;

    const timer = setTimeout(() => {
      setSlideshowIdx((prev) => (prev >= panels.length - 1 ? 0 : prev + 1));
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isSlideshowPlaying, slideshowIdx, panels]);

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

        {/* MAIN SPLIT VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: GLOBAL METADATA FIELDS (PERMANENT) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-xl w-full relative">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

              {project.cover_image && (
                <div className="w-full aspect-[2/3] max-h-[180px] rounded-2xl overflow-hidden border border-white/5 relative group flex items-center justify-center bg-black/40">
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
                Project Details Settings
              </h3>

              <div className="space-y-3.5 text-left text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest font-mono">
                    Comic Title
                  </label>
                  <input
                    type="text"
                    value={project.title || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("title", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest font-mono">
                    Author / Illustrator
                  </label>
                  <input
                    type="text"
                    value={project.author || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("author", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest font-mono">
                    Genre / Style
                  </label>
                  <input
                    type="text"
                    value={project.genre || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("genre", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-neutral-500 font-black uppercase tracking-widest font-mono">
                    Chapter Episode
                  </label>
                  <input
                    type="text"
                    value={project.episode || ""}
                    onChange={(e) =>
                      handleProjectFieldChange("episode", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-600/20 transition-all font-sans"
                  />
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">Source Website</span>
                  <span className="text-neutral-300 font-bold font-mono">
                    {getSourceName(project.url)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
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

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">Total Panels</span>
                  <span className="text-neutral-300 font-bold font-mono">
                    {panels.length} frames
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-neutral-500 font-bold">Video Length</span>
                  <span className="text-neutral-300 font-bold font-mono">
                    {totalDuration.toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
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
                    className="w-full bg-neutral-900 border border-white/5 hover:border-white/10 rounded-xl py-2 px-4 text-xs font-bold text-neutral-350 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center font-sans"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Source Webtoon Page
                  </a>
                </div>
              )}
            </div>

            {project.synopsis !== undefined && (
              <div className="bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-6 space-y-3 shadow-xl backdrop-blur-xl w-full relative">
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

          {/* RIGHT COLUMN: SWITCHABLE PIPELINE TABS (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tab buttons */}
            <div className="flex border-b border-white/5 gap-6 text-xs font-extrabold uppercase tracking-wide select-none font-sans">
              <button
                onClick={() => setActiveTab("extraction")}
                className={`pb-3 relative cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === "extraction" ? "text-purple-400" : "text-neutral-500 hover:text-white"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Live Asset Extraction
                {activeTab === "extraction" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("storyboard")}
                className={`pb-3 relative cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === "storyboard" ? "text-purple-400" : "text-neutral-500 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Storyboard &amp; OCR
                {activeTab === "storyboard" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`pb-3 relative cursor-pointer flex items-center gap-1.5 transition-colors ${
                  activeTab === "video" ? "text-purple-400" : "text-neutral-500 hover:text-white"
                }`}
              >
                <Video className="w-4 h-4" />
                Video Output
                {activeTab === "video" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                )}
              </button>
            </div>

            {/* TAB 1 CONTENT: LIVE ASSET EXTRACTION */}
            {activeTab === "extraction" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-xs font-black uppercase text-neutral-300 tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-450" />
                    Scraped Webtoon Scratch Sheets ({scrapedImages.length})
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-bold">
                    Click sheets to inspect high-resolution strips
                  </span>
                </div>

                {loadingScraped ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    <p className="text-xs text-neutral-500 font-mono">Querying database scrape cache...</p>
                  </div>
                ) : scrapedImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {scrapedImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveScrapedZoom(img)}
                        className="group border border-white/5 bg-[#0d0d10]/40 p-2.5 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer overflow-hidden shadow-md flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-center text-[9px] font-bold text-neutral-500 mb-1.5 px-0.5">
                          <span>PAGE #{idx + 1}</span>
                          <ZoomIn className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-purple-400 transition-opacity" />
                        </div>
                        <div className="aspect-[2/3] max-h-[220px] overflow-hidden rounded-xl bg-black/60 border border-white/5 flex items-start justify-center relative">
                          <img
                            src={img}
                            alt={`Scraped Page ${idx + 1}`}
                            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-102"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-[#0d0d10]/20 border border-white/5 rounded-3xl space-y-2">
                    <ImageIcon className="w-8 h-8 text-neutral-600 mx-auto" />
                    <h5 className="text-xs font-bold text-neutral-400">No Scraped Sheets Found</h5>
                    <p className="text-[10px] text-neutral-550 max-w-xs mx-auto leading-relaxed font-semibold">
                      The original source URL could not be parsed or cache has expired. Reload in active workspace.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2 CONTENT: STORYBOARD & OCR (INCLUDES PREVIEW DRAWER) */}
            {activeTab === "storyboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* ACTIVE PANEL METADATA DRAWER */}
                {activePanelPreview && (
                  <div className="bg-[#0b0b0e]/75 border border-white/10 rounded-3xl p-6 shadow-xl relative backdrop-blur-xl space-y-4">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Image panel */}
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
                      </div>

                      {/* Detail fields */}
                      <div className="md:col-span-2 flex flex-col justify-between text-left space-y-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                                  Dialogue Transcript
                                </h4>
                                <button
                                  type="button"
                                  disabled={isOptimizingSpeech}
                                  onClick={() => handleAIOptimizeSpeech(activePanelPreview.id, activePanelPreview.speech_text)}
                                  className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {isOptimizingSpeech ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wand2 className="w-2.5 h-2.5 text-purple-300" />}
                                  AI Optimize
                                </button>
                              </div>
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
                              <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                                  Scene Prompt Description
                                </h4>
                                <button
                                  type="button"
                                  disabled={isOptimizingVisual}
                                  onClick={() => handleAIEnhanceVisual(activePanelPreview.id, activePanelPreview.visual_description)}
                                  className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {isOptimizingVisual ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wand2 className="w-2.5 h-2.5 text-purple-300" />}
                                  AI Enhance
                                </button>
                              </div>
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

                          <div>
                            <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                              Sound Effect (SFX)
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
                              placeholder="e.g. WHOOSH, SMASH..."
                              className="w-full bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 mt-1.5"
                            />
                          </div>
                        </div>

                        {/* Dynamics / Controls */}
                        <div className="border-t border-white/5 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="block text-neutral-500 font-bold mb-1">Motion Path</span>
                            <select
                              value={activePanelPreview.motion_type || "zoom_in"}
                              onChange={(e) => handlePanelFieldChange(activePanelPreview.id, "motion_type", e.target.value)}
                              className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-250 w-full"
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
                            <span className="block text-neutral-500 font-bold mb-1">Duration</span>
                            <input
                              type="number"
                              step={0.1}
                              min={0.5}
                              value={activePanelPreview.duration || 4.5}
                              onChange={(e) => handlePanelFieldChange(activePanelPreview.id, "duration", parseFloat(e.target.value) || 4.5)}
                              className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-250 w-full font-mono"
                            />
                          </div>

                          <div>
                            <span className="block text-neutral-500 font-bold mb-1">Color Preset</span>
                            <select
                              value={activePanelPreview.filter_preset || ""}
                              onChange={(e) => handlePanelFieldChange(activePanelPreview.id, "filter_preset", e.target.value || null)}
                              className="bg-neutral-900 border border-white/5 focus:border-purple-500/50 rounded-xl p-1.5 text-[10px] font-bold text-neutral-250 w-full"
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
                            <span className="block text-neutral-500 font-bold mb-1">Grayscale</span>
                            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!activePanelPreview.grayscale}
                                onChange={(e) => handlePanelFieldChange(activePanelPreview.id, "grayscale", e.target.checked)}
                                className="w-3.5 h-3.5 text-purple-600 rounded bg-neutral-900 accent-purple-500"
                              />
                              <span className="text-[10px] font-semibold text-neutral-300">Grayscale</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STORYBOARD GRID LIST */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black uppercase text-neutral-300 tracking-wider flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-purple-450" />
                      Dynamic Storyboard Grid ({panels.length})
                    </h3>
                    <span className="text-[9px] text-neutral-500 font-bold">
                      Use arrows on hover to re-order sequence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {panels.map((panel, idx) => {
                      const isActive = activePanelPreview && activePanelPreview.id === panel.id;
                      return (
                        <div
                          key={panel.id || idx}
                          onClick={() => setActivePanelPreview(panel)}
                          className={`group border p-2.5 rounded-2xl transition-all cursor-pointer relative select-none text-left ${
                            isActive
                              ? "bg-purple-950/15 border-purple-500/40 ring-1 ring-purple-500/20"
                              : "bg-[#0d0d10]/40 hover:bg-[#121217]/50 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <span className="absolute top-2 left-2 z-20 bg-black/85 backdrop-blur-md text-[8px] font-black font-mono text-neutral-300 py-0.5 px-2 rounded-lg border border-white/10 shadow-sm">
                            #{idx + 1}
                          </span>

                          {/* Re-order & Delete buttons */}
                          <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePanel(idx, "left");
                              }}
                              className="p-1 bg-black/85 hover:bg-purple-600 text-neutral-400 hover:text-white rounded-md border border-white/10 disabled:opacity-40"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === panels.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePanel(idx, "right");
                              }}
                              className="p-1 bg-black/85 hover:bg-purple-600 text-neutral-400 hover:text-white rounded-md border border-white/10 disabled:opacity-40"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const confirm = (window as any).confirmAsync || window.confirm;
                                const confirmed = await confirm(
                                  `Remove panel #${idx + 1} from storyboard sequence?`,
                                  "Remove Panel",
                                  "red"
                                );
                                if (confirmed) {
                                  const updated = panels.filter((_, pIdx) => pIdx !== idx);
                                  setPanels(updated);
                                  if (activePanelPreview && activePanelPreview.id === panel.id) {
                                    setActivePanelPreview(updated[0] || null);
                                  }
                                }
                              }}
                              className="p-1 bg-black/85 hover:bg-rose-600 text-neutral-450 hover:text-white rounded-md border border-white/10"
                              title="Remove panel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Thumbnail */}
                          <div className="aspect-square w-full rounded-xl overflow-hidden border border-white/5 bg-black/60 flex items-center justify-center shadow-inner relative">
                            <img
                              src={panel.image_url}
                              alt={`P${idx + 1}`}
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-103"
                              loading="lazy"
                            />
                          </div>

                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] text-neutral-300 font-bold truncate">
                              {panel.speech_text ? `"${panel.speech_text}"` : "(No Speech)"}
                            </p>
                            <div className="flex items-center justify-between text-[8px] text-neutral-500 font-mono">
                              <span>{panel.duration || 4.5}s</span>
                              <span className="uppercase text-purple-400 font-bold">
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
            )}

            {/* TAB 3 CONTENT: FINAL VIDEO SYNTHESIS & FALLBACK SLIDESHOW */}
            {activeTab === "video" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Video/Slideshow box */}
                  <div className="md:col-span-2 bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-5 shadow-xl relative backdrop-blur-xl min-h-[300px]">
                    {project.video_url ? (
                      <div className="space-y-4 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-2">
                            <Video className="w-4 h-4 text-indigo-400" />
                            Compiled MP4 Output Video
                          </h3>
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
                      /* FALLBACK SLIDESHOW PLAYER */
                      <div className="space-y-4 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-2">
                            <Play className="w-4 h-4 text-purple-450 animate-pulse" />
                            Fallback Storyboard Slideshow
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {isSlideshowPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              {isSlideshowPlaying ? "Pause" : "Play"}
                            </button>
                            <span className="text-[10px] text-neutral-500 font-mono font-bold">
                              {slideshowIdx + 1} / {panels.length}
                            </span>
                          </div>
                        </div>

                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/90 shadow-inner flex items-center justify-center">
                          {panels[slideshowIdx] ? (
                            <>
                              <img
                                src={panels[slideshowIdx].image_url}
                                alt={`Slide ${slideshowIdx + 1}`}
                                className="w-full h-full object-contain"
                                style={{ filter: getPanelFilterStyle(panels[slideshowIdx]) }}
                              />
                              
                              {/* Subtitle Caption */}
                              {panels[slideshowIdx].speech_text && (
                                <div className="absolute bottom-4 inset-x-4 bg-black/85 backdrop-blur-md border border-white/5 p-3 rounded-2xl text-center text-xs font-semibold text-neutral-250 font-sans shadow-lg leading-relaxed">
                                  {panels[slideshowIdx].speech_text}
                                </div>
                              )}
                              
                              {/* SFX cue */}
                              {panels[slideshowIdx].sfx && (
                                <div className="absolute top-4 left-4 bg-purple-600 text-neutral-950 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border border-purple-500/20 tracking-wider font-mono shadow-md animate-pulse">
                                  SFX: {panels[slideshowIdx].sfx}
                                </div>
                              )}

                              {/* Progress bar loader */}
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900 overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 transition-all"
                                  style={{
                                    width: isSlideshowPlaying ? "100%" : "0%",
                                    transitionDuration: isSlideshowPlaying ? `${(panels[slideshowIdx].duration || 4.5) * 1000}ms` : "0ms",
                                    transitionTimingFunction: "linear"
                                  }}
                                  key={`${slideshowIdx}-${isSlideshowPlaying}`}
                                />
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-neutral-550 italic">No storyboard panels found</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ADVANCED EXPORT ACTIONS CARD */}
                  <div className="bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-5 shadow-xl relative backdrop-blur-xl md:col-span-1 space-y-4">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                    
                    <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                      <FileDown className="w-4 h-4 text-purple-400" />
                      Storyboard Exports
                    </h3>

                    <div className="space-y-2.5 pt-1">
                      <button
                        onClick={() => triggerMockExport("pdf")}
                        disabled={isExporting}
                        className="w-full bg-neutral-900 border border-white/5 hover:border-purple-500/30 text-left py-2.5 px-4 rounded-xl text-xs font-bold text-neutral-250 hover:text-white transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-400" /> Export PDF Storyboard
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-purple-400" />
                      </button>

                      <button
                        onClick={() => triggerMockExport("json")}
                        disabled={isExporting}
                        className="w-full bg-neutral-900 border border-white/5 hover:border-purple-500/30 text-left py-2.5 px-4 rounded-xl text-xs font-bold text-neutral-250 hover:text-white transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-purple-400" /> Export Script Data (JSON)
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-purple-400" />
                      </button>

                      <button
                        onClick={() => triggerMockExport("zip")}
                        disabled={isExporting}
                        className="w-full bg-neutral-900 border border-white/5 hover:border-purple-500/30 text-left py-2.5 px-4 rounded-xl text-xs font-bold text-neutral-250 hover:text-white transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-purple-400" /> Download Panels Package (ZIP)
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-purple-400" />
                      </button>
                    </div>

                    {exportStatus && (
                      <div className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-2xl text-[10px] text-purple-400 text-center font-bold font-mono animate-pulse">
                        {exportStatus}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Scraped Image Zoom Modal */}
      {activeScrapedZoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveScrapedZoom(null)} />
          <div className="relative max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-neutral-800 p-2 z-10 animate-in zoom-in-95 duration-200 scrollbar-thin">
            <button
              onClick={() => setActiveScrapedZoom(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/80 text-white hover:bg-neutral-850 cursor-pointer shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={activeScrapedZoom}
              alt="Zoomed Scraped Sheet"
              className="w-full h-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
