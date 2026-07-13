import React, { useState } from "react";
import {
  Layout,
  Scissors,
  Film,
  Layers,
  Brain,
  Download,
  Settings,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Edit2,
  Brush,
  Crop,
  Link2,
  type LucideIcon,
} from "lucide-react";
import TooltipPortal from "../../TooltipPortal";
import { resolveWorkspaceReturnPath } from "../../../utils/workspaceNavigation";
import { useImageEditorStore } from "../../../hooks/useImageEditorState";

interface EditorMiniSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  currentSection: string;
  setCurrentSection: (section: string) => void;
  onBackToApp?: () => void;
  scrapedCount: number;
  panelsCount: number;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  navigateTo?: (path: string) => void;
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  settingsPath?: string;
  topOffsetPx?: number;
  locationSearch?: string;
}

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  isProcessing?: boolean;
}

const EditorMiniSidebarInner = ({
  isCollapsed,
  setIsCollapsed,
  currentSection,
  setCurrentSection,
  onBackToApp,
  scrapedCount,
  panelsCount,
  isBatchCropping,
  isCleaningBubbles,
  navigateTo,
  projectId,
  seriesSlug,
  chapterSlug,
  settingsPath = "/settings",
  topOffsetPx = 59,
  locationSearch,
}: EditorMiniSidebarProps) => {
  const params = new URLSearchParams(locationSearch || window.location.search);
  const isEditing = (window.location.pathname.startsWith("/editor") || window.location.pathname.startsWith("/image-editor")) && params.get("idx") !== null;

  const activeTool = useImageEditorStore((state) => state.activeTool);
  const setActiveTool = useImageEditorStore((state) => state.setActiveTool);
  const slicesCount = useImageEditorStore((state) => state.slicesCount);
  const editingImageIdx = useImageEditorStore((state) => state.editingImageIdx);

  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

  if (isEditing) {
    const cropTools = [
      { key: "adjust", label: "Adjust", icon: Sparkles },
      { key: "edit", label: "Edit", icon: Edit2 },
      { key: "draw", label: "Draw", icon: Brush },
      { key: "slice", label: "Cut", icon: Scissors },
      { key: "crop", label: "Edit", icon: Crop },
      { key: "merge", label: "Merge", icon: Link2 },
    ] as const;

    return (
      <aside
        style={{ top: `${topOffsetPx}px` }}
        className={`hidden md:flex fixed bottom-0 left-0 bg-neutral-950 backdrop-blur-xl border-r border-neutral-800/60 flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[60] py-6 shadow-[4px_0_24px_rgba(0,0,0,0.3)] ${
          isCollapsed ? "w-16" : "w-20"
        }`}
      >
        <div className="flex-1 w-full flex flex-col items-center space-y-4 pt-4">
          {cropTools.map((tool) => {
            const isActive = activeTool === tool.key;
            const Icon = tool.icon;
            const isHovered = hoveredTool === tool.key;

            return (
              <div key={tool.key} className="relative group w-full flex justify-center py-1">
                {/* Premium Floating Active Pill */}
                <div
                  className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-500 ease-out z-10 ${
                    isActive
                      ? "h-6 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.9)] opacity-100"
                      : "h-0 bg-transparent opacity-0"
                  }`}
                />

                <button
                  onClick={() => {
                    console.log(`[EditorMiniSidebar] Selecting tool: ${tool.key}`);
                    setActiveTool(tool.key);
                  }}
                  onMouseEnter={(e) => {
                    setHoveredRect(e.currentTarget.getBoundingClientRect());
                    setHoveredTool(tool.key);
                  }}
                  onMouseLeave={() => setHoveredTool(null)}
                  className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center outline-none focus:outline-none"
                >
                  {/* iOS-style icon pill container with inner shadow */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group-active:scale-90 ${
                      isActive
                        ? "bg-purple-500/20 border border-purple-500/50 shadow-[inset_0_0_12px_rgba(168,85,247,0.2),0_0_14px_rgba(168,85,247,0.3)]"
                        : "bg-neutral-800/80 border border-neutral-700/50 shadow-sm group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                    }`}
                  >
                    <Icon
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`w-[18px] h-[18px] transition-all duration-300 ${
                        isActive
                          ? "text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.5)]"
                          : "text-neutral-400 group-hover:text-purple-300 group-hover:scale-110"
                      }`}
                    />
                  </div>

                  {/* Crop Slices Count Badge */}
                  {tool.key === "crop" && slicesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-gradient-to-br from-purple-500 to-purple-700 text-[10px] text-white font-black rounded-full flex items-center justify-center px-1 border border-neutral-950 shadow-md z-20">
                      {slicesCount}
                    </span>
                  )}
                </button>
                <TooltipPortal text={tool.label} visible={isHovered} anchorRect={hoveredRect} />
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  const menuItems: SidebarMenuItem[] = [
    {
      id: "monitor",
      label: "Video Monitor",
      icon: Film,
    },
    {
      id: "assets",
      label: "Imported Assets",
      icon: Layout,
      badge: scrapedCount > 0 ? scrapedCount : undefined,
    },
    {
      id: "timeline",
      label: "Storyboard Timeline",
      icon: Layers,
      badge: panelsCount > 0 ? panelsCount : undefined,
    },
    {
      id: "production",
      label: "Export & Publish",
      icon: Download,
    },
    {
      id: "autocrop",
      label: "Auto-Crop Panels",
      icon: Scissors,
      isProcessing: isBatchCropping,
    },
    // Added Image Editor Tool
    {
      id: "image-editor",
      label: "Image Editor",
      icon: Edit2,
    },
    {
      id: "settings",
      label: "Video Settings",
      icon: Settings,
    },
  ];

  const handleReturnToWorkspace = () => {
    if (onBackToApp) {
      onBackToApp();
      return;
    }
    const path = resolveWorkspaceReturnPath({
      projectId,
      searchParams: window.location.search,
    });

    if (navigateTo) {
      navigateTo(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const SidebarItem: React.FC<{ item: SidebarMenuItem }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const params = new URLSearchParams(locationSearch || window.location.search);
    const isSettingsActive = params.get("tab") === "settings";
    const isActive =
      item.id === "settings"
        ? isSettingsActive
        : !isSettingsActive && currentSection === item.id;

    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-1">
        {/* Premium Floating Active Pill */}
        <div
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-500 ease-out z-10 ${
            isActive
              ? "h-6 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.9)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => {
            // Remove ?tab query param if navigating to a different section
            if (item.id !== "settings") {
              const p = new URLSearchParams(window.location.search);
              if (p.has("tab")) {
                p.delete("tab");
                const searchStr = p.toString();
                const newPath = `${window.location.pathname}${searchStr ? "?" + searchStr : ""}`;
                if (navigateTo) {
                  navigateTo(newPath);
                } else {
                  window.history.pushState({}, "", newPath);
                  window.dispatchEvent(new Event("popstate"));
                }
              }
            }

            if (item.id === "image-editor") {
              const target = `/workspace/editor/series/${seriesSlug || ""}/chapters/${chapterSlug || ""}/image-editor?idx=${editingImageIdx ?? 0}`;
              if (navigateTo) {
                navigateTo(target);
              } else {
                window.history.pushState({}, "", target);
                window.dispatchEvent(new Event("popstate"));
              }
            } else if (item.id === "autocrop" || item.id === "bubbles") {
              setCurrentSection(item.id);
            } else if (item.id === "settings") {
              const p = new URLSearchParams(window.location.search);
              p.set("tab", "settings");
              const newPath = `${window.location.pathname}?${p.toString()}`;
              if (navigateTo) {
                navigateTo(newPath);
              } else {
                window.history.pushState({}, "", newPath);
                window.dispatchEvent(new Event("popstate"));
              }
            } else {
              setCurrentSection(item.id);
              const el = document.getElementById(`section-${item.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }
          }}
          onMouseEnter={(e) => {
            setRect(e.currentTarget.getBoundingClientRect());
            setHover(true);
          }}
          onMouseLeave={() => setHover(false)}
          className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center outline-none focus:outline-none"
        >
          {/* iOS-style icon pill container with inner shadow */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group-active:scale-90 ${
              isActive
                ? "bg-purple-500/20 border border-purple-500/50 shadow-[inset_0_0_12px_rgba(168,85,247,0.2),0_0_14px_rgba(168,85,247,0.3)]"
                : "bg-neutral-800/80 border border-neutral-700/50 shadow-sm group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]"
            }`}
          >
            <Icon
              strokeWidth={isActive ? 2.5 : 2}
              className={`w-[18px] h-[18px] transition-all duration-300 ${
                isActive
                  ? "text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.5)]"
                  : "text-neutral-400 group-hover:text-purple-300 group-hover:scale-110"
              }`}
            />
          </div>

          {/* Notification Badge */}
          {item.badge !== undefined && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-gradient-to-br from-purple-500 to-purple-700 text-[10px] text-white font-black rounded-full flex items-center justify-center px-1 border border-neutral-950 shadow-md z-20">
              {item.badge}
            </span>
          )}

          {/* Processing Ping */}
          {item.isProcessing && (
            <>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-purple-400 animate-ping z-20 opacity-75" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-purple-500 z-20 shadow-[0_0_6px_rgba(168,85,247,1)]" />
            </>
          )}
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  return (
    // Premium Glassmorphism Container
    <aside
      style={{ top: `${topOffsetPx}px` }}
      className={`hidden md:flex fixed bottom-0 left-0 bg-neutral-950 backdrop-blur-xl border-r border-neutral-800/60 flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[60] py-4 shadow-[4px_0_24px_rgba(0,0,0,0.3)] ${
        isCollapsed ? "w-16" : "w-20"
      }`}
    >
      {/* Scrollable Tools Area */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {menuItems.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </div>

      {/* Bottom Action Footer - Return to Workspace */}
      <div className="mt-auto pt-4 flex justify-center w-full pb-2 border-t border-neutral-800/60 relative">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={handleReturnToWorkspace}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white transition-all duration-300 shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] active:scale-90 border border-purple-400/30 outline-none focus:outline-none"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
          </button>

          {/* Hover Tooltip for the Return Button */}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 -translate-x-2 group-hover:translate-x-0 bg-neutral-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl font-medium tracking-wide">
            Return to Workspace
          </div>
        </div>
      </div>
    </aside>
  );
};

// Wrapping in React.memo prevents the sidebar from re-rendering unless its specific props change
const EditorMiniSidebar = React.memo(EditorMiniSidebarInner);
export default EditorMiniSidebar;
