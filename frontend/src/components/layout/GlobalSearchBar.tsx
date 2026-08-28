import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  BookOpen,
  Film,
  Sparkles,
  Volume2,
  Settings,
  Zap,
  ArrowRight,
  ExternalLink,
  Layers,
  FileText,
  Workflow,
  Cpu,
  Bot,
  X,
  MessageSquare,
  Globe,
  Sliders,
  Play,
  Key,
} from "lucide-react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { useAIModelStore } from "@/features/ai_core/hooks/useAIModelStore";
import { FavoritesManager } from "@/features/workspace_scraper/chapter-scraper/utils/FavoritesManager";

export interface GlobalSearchBarProps {
  className?: string;
  compact?: boolean;
  onSelectRoute?: (route: string) => void;
}

interface SearchResultItem {
  id: string;
  type: "project" | "panel" | "model" | "chapter" | "tool";
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  imageUrl?: string;
  onSelect: () => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  className = "",
  compact = false,
  onSelectRoute,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "projects" | "panels" | "models" | "tools">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProjectData = useProjectStore((state) => state.activeProjectData);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const { getAvailableModels, loadCatalogFromBackend } = useAIModelStore();

  // Load available AI models and real projects on mount
  useEffect(() => {
    loadCatalogFromBackend();
    fetchRealProjects();
  }, [loadCatalogFromBackend]);

  const fetchRealProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch("/api/v1/projects");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.projects || [];
        setDbProjects(list);
      }
    } catch {
      /* fallback to active project */
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Keyboard shortcut listener: Cmd+K / Ctrl+K / '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const navigateTo = (path: string) => {
    setIsOpen(false);
    setQuery("");
    if (onSelectRoute) {
      onSelectRoute(path);
      return;
    }
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") {
      nav(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  // ── BUILD REAL SEARCH RESULTS ──────────────────────────────────────────────
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // 1. REAL PROJECTS & SERIES SEARCH
    if (selectedFilter === "all" || selectedFilter === "projects") {
      // Include active project
      if (activeProjectData?.project) {
        const p = activeProjectData.project;
        if (!q || p.title?.toLowerCase().includes(q) || p.series_name?.toLowerCase().includes(q)) {
          results.push({
            id: `proj-active-${p.project_id}`,
            type: "project",
            title: p.title || "Active Project",
            subtitle: `${activeProjectData.panels?.length || 0} Panels • ${p.series_name || "Custom Series"}`,
            icon: BookOpen,
            badge: "Active",
            badgeColor: "#3B82F6",
            imageUrl: p.cover_image || activeProjectData.panels?.[0]?.image_url,
            onSelect: () => navigateTo("/editor"),
          });
        }
      }

      // Include DB projects
      dbProjects.forEach((p) => {
        if (p.project_id === activeProjectId || p.id === activeProjectId) return;
        const title = p.title || p.name || "Untitled Comic";
        const series = p.series_name || p.seriesTitle || "";
        if (!q || title.toLowerCase().includes(q) || series.toLowerCase().includes(q)) {
          results.push({
            id: `proj-${p.project_id || p.id}`,
            type: "project",
            title,
            subtitle: `${p.panels_count || p.panels?.length || 0} Panels ${series ? `• ${series}` : ""}`,
            icon: BookOpen,
            badge: "Project",
            imageUrl: p.cover_image || p.thumbnail_url,
            onSelect: () => {
              useProjectStore.getState().setActiveProjectId(p.project_id || p.id);
              navigateTo("/editor");
            },
          });
        }
      });
    }

    // 2. REAL STORYBOARD PANELS & DIALOGUE SEARCH (FROM ACTIVE COMIC)
    if (selectedFilter === "all" || selectedFilter === "panels") {
      const activePanels = activeProjectData?.panels || [];
      activePanels.forEach((panel, idx) => {
        const text = panel.speech_text || panel.narrative || panel.ocr_text || "";
        const charName = panel.speaker || panel.character || "";
        if (q && (text.toLowerCase().includes(q) || charName.toLowerCase().includes(q) || `panel ${idx + 1}`.includes(q))) {
          results.push({
            id: `panel-${panel.id || idx}`,
            type: "panel",
            title: `Panel #${idx + 1}${charName ? `: ${charName}` : ""}`,
            subtitle: text ? `"${text.slice(0, 70)}..."` : "Storyboard visual action beat",
            icon: MessageSquare,
            badge: `P#${idx + 1}`,
            badgeColor: "#A855F7",
            imageUrl: panel.image_url,
            onSelect: () => {
              useProjectStore.getState().setSelectedPanelIndex(idx);
              navigateTo("/editor");
            },
          });
        }
      });
    }

    // 3. REAL LIVE AI MODELS & ENGINES SEARCH
    if (selectedFilter === "all" || selectedFilter === "models") {
      const allModels = getAvailableModels();
      allModels.forEach((m) => {
        if (!q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)) {
          results.push({
            id: `model-${m.id}`,
            type: "model",
            title: m.name,
            subtitle: `${m.provider.toUpperCase()} • ${m.description || "High-performance AI model"}`,
            icon: Cpu,
            badge: m.badge || m.provider.toUpperCase(),
            badgeColor: "#06B6D4",
            onSelect: () => navigateTo(`/ai-core?tab=routing`),
          });
        }
      });
    }

    // 4. REAL SAVED WEBTOON / MANGA FAVORITES SEARCH
    if (selectedFilter === "all" || selectedFilter === "projects") {
      try {
        const favs = FavoritesManager.getFavorites();
        favs.forEach((f) => {
          if (!q || f.title.toLowerCase().includes(q) || f.source.toLowerCase().includes(q)) {
            results.push({
              id: `fav-${f.url}`,
              type: "chapter",
              title: f.title,
              subtitle: `Saved Manga Series • ${f.source.toUpperCase()}`,
              icon: Globe,
              badge: "Manga Series",
              badgeColor: "#EC4899",
              imageUrl: f.coverImage,
              onSelect: () => {
                localStorage.setItem("auto_import_url", f.url);
                navigateTo("/scraper");
              },
            });
          }
        });
      } catch {}
    }

    // 5. REAL STUDIO WORKSPACES & TOOLS
    if (selectedFilter === "all" || selectedFilter === "tools") {
      const coreTools = [
        {
          title: "Storyboard Director Studio",
          subtitle: "Multi-panel comic timeline & animatic editor",
          route: "/editor",
          icon: Film,
          badge: "Workspace",
        },
        {
          title: "Webtoon & Manga Scraper",
          subtitle: "Extract chapters, panels & text bubbles",
          route: "/scraper",
          icon: Layers,
          badge: "Workspace",
        },
        {
          title: "Voice & Dialogue Studio",
          subtitle: "AI Voice casting, emotion TTS & soundboard",
          route: "/voice-studio",
          icon: Volume2,
          badge: "Audio Lab",
        },
        {
          title: "Smart Model Cascades & Routing",
          subtitle: "11 Specialized comic task engine matrix",
          route: "/ai-core?tab=routing",
          icon: Workflow,
          badge: "AI Core",
        },
        {
          title: "API Vault & Cloud Keys",
          subtitle: "Manage Gemini, Claude, OpenAI & ElevenLabs keys",
          route: "/ai-core?tab=api-keys",
          icon: Key,
          badge: "Security",
        },
        {
          title: "System Settings",
          subtitle: "Preferences, export quality & theme configuration",
          route: "/settings",
          icon: Settings,
          badge: "Settings",
        },
      ];

      coreTools.forEach((tool) => {
        if (!q || tool.title.toLowerCase().includes(q) || tool.subtitle.toLowerCase().includes(q)) {
          results.push({
            id: `tool-${tool.route}`,
            type: "tool",
            title: tool.title,
            subtitle: tool.subtitle,
            icon: tool.icon,
            badge: tool.badge,
            badgeColor: "#F59E0B",
            onSelect: () => navigateTo(tool.route),
          });
        }
      });
    }

    return results;
  }, [query, selectedFilter, activeProjectData, dbProjects, activeProjectId, getAvailableModels]);

  // Keyboard navigation up/down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        searchResults[selectedIndex].onSelect();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className} ${compact ? "max-w-[220px]" : "w-full max-w-sm lg:max-w-md"}`}
    >
      {/* ── Search Input Capsule (Exact Image Styling) ── */}
      <div className="relative w-full group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] group-hover:text-blue-400 transition-colors pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Quick Find (Ctrl+K or /)"
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            fetchRealProjects();
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-9 pl-9 pr-11 bg-[#121216] hover:bg-[#18181E] focus:bg-[#16161C] text-xs text-white placeholder:text-[#6B7280] rounded-full border border-white/[0.08] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all shadow-inner font-sans tracking-wide"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#9CA3AF] bg-[#1E1E26] border border-white/[0.1] rounded-md shadow-sm">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ── Dropdown Real Search Results Flyout ── */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0E0E14] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[440px] flex flex-col text-left">
          {/* Domain Filter Pills Bar */}
          <div className="p-2 border-b border-white/[0.06] bg-[#0A0A0E] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {(
              [
                { id: "all", label: "All Results" },
                { id: "projects", label: "Projects" },
                { id: "panels", label: "Panels & Dialogue" },
                { id: "models", label: "AI Engines" },
                { id: "tools", label: "Tools" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === tab.id
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Real Results Scroll List */}
          <div className="p-2 flex-1 overflow-y-auto space-y-1 custom-purple-scrollbar">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 font-mono text-xs space-y-1">
                <Search className="w-5 h-5 mx-auto text-neutral-600 mb-2" />
                <p className="text-neutral-300 font-bold">No real results for &ldquo;{query}&rdquo;</p>
                <p className="text-[10px] text-neutral-500">
                  Search across active comic chapters, speech bubbles, AI models, or workspace tools.
                </p>
              </div>
            ) : (
              searchResults.map((item, index) => {
                const Icon = item.icon;
                const isHighlighted = index === selectedIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onSelect}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 group transition-all cursor-pointer ${
                      isHighlighted
                        ? "bg-blue-500/15 border border-blue-500/30 text-white"
                        : "hover:bg-white/[0.04] text-neutral-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Image or Icon Badge */}
                      <div className="w-8 h-8 rounded-lg bg-[#181822] border border-white/[0.08] flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-inner">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon className="w-4 h-4 text-blue-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-sans truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase"
                          style={{
                            backgroundColor: `${item.badgeColor || "#3B82F6"}20`,
                            color: item.badgeColor || "#3B82F6",
                            borderColor: `${item.badgeColor || "#3B82F6"}40`,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0A0A0E] flex items-center justify-between text-[10px] font-mono text-neutral-500 shrink-0">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1 py-0.2 rounded bg-black/40 border border-white/10">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1 py-0.2 rounded bg-black/40 border border-white/10">↵</kbd> to open
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1 py-0.2 rounded bg-black/40 border border-white/10">ESC</kbd> to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const QuickFindCommandBar = GlobalSearchBar;
export default GlobalSearchBar;
