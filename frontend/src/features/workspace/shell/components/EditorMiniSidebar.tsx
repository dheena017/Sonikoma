import React, { useState } from"react";
import {
  Menu,
  Layout,
  Scissors,
  Film,
  Layers,
  Settings,
  ExternalLink,
  Sparkles,
  Edit2,
  Brush,
  Crop,
  Link2,
  Mic,
  type LucideIcon,
} from"lucide-react";
import TooltipPortal from"@/shared/ui/common/TooltipPortal";
import {
  resolveWorkspaceReturnPath,
  getImageEditorPath,
} from"@/shared/utils/workspaceNavigation";
import {
  useImageEditorStore,
  type EditorTool,
} from"@/features/workspace/shell/hooks/useEditorState";

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
  settingsPath ="/settings",
  topOffsetPx = 64,
  locationSearch,
}: EditorMiniSidebarProps) => {
  const params = new URLSearchParams(locationSearch || window.location.search);
  const isEditing =
    (window.location.pathname.startsWith("/editor") ||
      window.location.pathname.startsWith("/image-editor")) &&
    params.get("idx") !== null;

  const activeTool = useImageEditorStore((state) => state.activeTool);
  const setActiveTool = useImageEditorStore((state) => state.setActiveTool);
  const slicesCount = useImageEditorStore((state) => state.slicesCount);
  const editingImageIdx = useImageEditorStore((state) => state.editingImageIdx);

  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);
  const [menuHover, setMenuHover] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  const CropSidebarToolItem = ({
    tool,
  }: {
    tool: { key: EditorTool; label: string; icon: any };
  }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const isActive = activeTool === tool.key;
    const Icon = tool.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Left edge active indicator bar */}
        <div
          className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full transition-all duration-300 z-10 ${isActive
              ?"h-6 bg-[#3B82F6] opacity-100"
              :"h-0 bg-transparent opacity-0"
            }`}
        />

        <button
          onClick={() => {
            setActiveTool(tool.key);
          }}
          onMouseEnter={(e) => {
            setRect(e.currentTarget.getBoundingClientRect());
            setHover(true);
          }}
          onMouseLeave={() => setHover(false)}
          className="p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
          aria-label={tool.label}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${isActive
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white shadow-lg  scale-105"
                : "bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-neutral-700"
              }`}
          >
            <Icon
              className={`w-4 h-4 transition-colors duration-200 ${isActive
                  ? "text-white"
                  : "text-[#9CA3AF] group-hover:text-[#3B82F6]"
                }`}
            />
          </div>

          {/* Crop Slices Count Badge */}
          {tool.key === "crop" && slicesCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] bg-[#3B82F6] text-[9px] text-white font-bold rounded-full flex items-center justify-center px-1 border-2 border-neutral-950 shadow-md z-20">
              {slicesCount}
            </span>
          )}
        </button>
        <TooltipPortal text={tool.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  const handleReturnToWorkspace = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onBackToApp) {
      onBackToApp();
      return;
    }

    const targetUrl = resolveWorkspaceReturnPath({
      searchParams: window.location.search,
      projectId,
      seriesSlug,
      chapterSlug,
    });

    if (navigateTo) {
      navigateTo(targetUrl);
    } else {
      window.location.href = targetUrl;
    }
  };

  if (isEditing) {
    const cropToolGroups = [
      {
        label:"Adjust",
        tools: [
          { key:"adjust" as EditorTool, label:"Adjust", icon: Sparkles },
          { key:"edit" as EditorTool, label:"Edit", icon: Edit2 },
          { key:"draw" as EditorTool, label:"Draw", icon: Brush },
        ],
      },
      {
        label:"Cut",
        tools: [
          { key:"slice" as EditorTool, label:"Cut", icon: Scissors },
          { key:"crop" as EditorTool, label:"Crop", icon: Crop },
          { key:"merge" as EditorTool, label:"Merge", icon: Link2 },
        ],
      },
    ];

    return (
      <aside
        className="hidden md:flex fixed top-0 bottom-0 left-0 w-14 h-screen bg-[#0c0d12]/95 backdrop-blur-2xl border-r border-white/10 flex-col items-center z-[60] shadow-xl select-none overflow-hidden"
      >
        {/* Top Header / Menu Toggle Button Area (Matches Header h-16) */}
        <div className="h-16 w-full flex items-center justify-center border-b border-white/10 shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            onMouseEnter={(e) => {
              setMenuRect(e.currentTarget.getBoundingClientRect());
              setMenuHover(true);
            }}
            onMouseLeave={() => setMenuHover(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/10 hover:border-neutral-500 text-neutral-300 hover:text-white transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
            aria-label="Toggle navigation menu"
            title="Toggle Navigation Menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <TooltipPortal
            text="Toggle Navigation Menu"
            visible={menuHover}
            anchorRect={menuRect}
          />
        </div>

        <div className="flex-1 w-full flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
          {cropToolGroups.map((group, gi) => (
            <div
              key={group.label}
              className="w-full flex flex-col items-center pb-1"
            >
              {/* Section divider + label */}
              <div
                className="w-full flex flex-col items-center"
                style={{
                  marginTop: gi > 0 ? "0.6rem" : "0.2rem",
                  marginBottom: "0.4rem",
                }}
              >
                {gi > 0 && (
                  <div className="w-6 h-[1px] bg-neutral-800/80 rounded-full mb-1.5" />
                )}
                <span className="text-[8px] font-mono font-bold uppercase tracking-[0.14em] text-neutral-400 select-none text-center w-full px-0.5 truncate">
                  {group.label}
                </span>
              </div>
              <div className="w-full flex flex-col items-center space-y-0.5">
                {group.tools.map((tool) => (
                  <CropSidebarToolItem key={tool.key} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  const menuGroups: Array<{ label: string; items: SidebarMenuItem[] }> = [
    {
      label:"Main",
      items: [
        {
          id:"storyboard",
          label:"Storyboard",
          icon: Layers,
          badge: panelsCount > 0 ? panelsCount : undefined,
        },
        {
          id:"assets",
          label:"Imported Assets",
          icon: Layout,
          badge: scrapedCount > 0 ? scrapedCount : undefined,
        },
        {
          id:"monitor",
          label:"Video Monitor",
          icon: Film,
        },
      ],
    },
    {
      label:"Studios",
      items: [
        {
          id:"video-editor",
          label:"Video Studio",
          icon: Film,
        },
        {
          id:"image-editor",
          label:"Image Editor",
          icon: Edit2,
        },
      ],
    },
    {
      label:"Preferences",
      items: [
        {
          id:"settings",
          label:"Video Settings",
          icon: Settings,
        },
        {
          id:"audio-settings",
          label:"Audio Settings",
          icon: Mic,
        },
        {
          id:"autocrop-settings",
          label:"Auto-Crop Settings",
          icon: Scissors,
        },
      ],
    },
  ];

  const SidebarItem = ({ item }: { item: SidebarMenuItem }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const isSettingsTab =
      item.id ==="settings" ||
      item.id ==="audio-settings" ||
      item.id ==="autocrop-settings";

    const currentTab = params.get("tab");
    const isActive =
      currentSection === item.id ||
      (isSettingsTab && currentTab === item.id) ||
      (item.id ==="video-editor" &&
        window.location.pathname.startsWith("/video-editor")) ||
      (item.id ==="image-editor" &&
        window.location.pathname.startsWith("/image-editor"));

    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Left edge active indicator bar */}
        <div
          className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full transition-all duration-300 z-10 ${isActive
              ?"h-6 bg-[#3B82F6] opacity-100"
              :"h-0 bg-transparent opacity-0"
            }`}
        />

        <button
          onClick={() => {
            if (!isSettingsTab) {
              const p = new URLSearchParams(window.location.search);
              if (p.has("tab")) {
                p.delete("tab");
                const searchStr = p.toString();
                const newPath =`${window.location.pathname}${searchStr ?"?" + searchStr :""
                  }`;
                if (navigateTo) {
                  navigateTo(newPath);
                } else {
                  window.history.pushState({},"", newPath);
                  window.dispatchEvent(new Event("popstate"));
                }
              }
            }

            if (item.id ==="video-editor") {
              const target ="/video-editor";
              if (navigateTo) {
                navigateTo(target);
              } else {
                window.history.pushState({},"", target);
                window.dispatchEvent(new Event("popstate"));
              }
            } else if (item.id ==="image-editor") {
              const target = getImageEditorPath({
                seriesSlug,
                chapterSlug,
                projectId,
                idx: editingImageIdx ?? 0,
              });
              if (navigateTo) {
                navigateTo(target);
              } else {
                window.history.pushState({},"", target);
                window.dispatchEvent(new Event("popstate"));
              }
            } else if (isSettingsTab) {
              const p = new URLSearchParams(window.location.search);
              p.set("tab", item.id);
              const newPath =`${window.location.pathname}?${p.toString()}`;
              if (navigateTo) {
                navigateTo(newPath);
              } else {
                window.history.pushState({},"", newPath);
                window.dispatchEvent(new Event("popstate"));
              }
            } else {
              if (item.id ==="monitor") {
                useImageEditorStore
                  .getState()
                  .setPlayerSettings({ isPlayerOpen: true });
              }
              setCurrentSection(item.id);
              requestAnimationFrame(() => {
                setTimeout(() => {
                  const targetMap: Record<string, string[]> = {
                    monitor: ["section-monitor","section-monitor-placeholder"],
                    storyboard: ["section-storyboard","section-timeline","panels_timeline_section",
                    ],
                    timeline: ["section-storyboard","section-timeline","panels_timeline_section",
                    ],
                    assets: ["section-assets","section-raw-images"],
                  };
                  const candidateIds = targetMap[item.id] || [`section-${item.id}`,
                    item.id,
                  ];
                  for (const id of candidateIds) {
                    const el = document.getElementById(id);
                    if (el) {
                      el.scrollIntoView({ behavior:"smooth", block:"start" });
                      break;
                    }
                  }
                }, 60);
              });
            }
          }}
          onMouseEnter={(e) => {
            setRect(e.currentTarget.getBoundingClientRect());
            setHover(true);
          }}
          onMouseLeave={() => setHover(false)}
          className="p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
          aria-label={item.label}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${isActive
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white scale-105 shadow-lg"
                : "bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-neutral-700"
              }`}
          >
            <Icon
              className={`w-4 h-4 transition-colors duration-200 ${isActive
                  ? "text-white"
                  : "text-[#9CA3AF] group-hover:text-[#3B82F6]"
                }`}
            />
          </div>

          {/* Notification Badge */}
          {item.badge !== undefined && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] bg-[#3B82F6] text-[9px] text-white font-bold rounded-full flex items-center justify-center px-1 border-2 border-neutral-950 shadow-md z-20">
              {item.badge}
            </span>
          )}

          {/* Processing Ping */}
          {item.isProcessing && (
            <>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-400 animate-ping z-20 opacity-75" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500 z-20 shadow-sm" />
            </>
          )}
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  return (
    <aside
      className="hidden md:flex fixed top-0 bottom-0 left-0 w-14 h-screen bg-[#0A0A0A]/95 backdrop-blur-2xl border-r border-[#2F2F2F] flex-col items-center z-[90] shadow-xl select-none overflow-hidden"
    >
      {/* Top Header / Menu Toggle Button Area (Matches Header h-16) */}
      <div className="h-16 w-full flex items-center justify-center border-b border-[#2F2F2F] shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          onMouseEnter={(e) => {
            setMenuRect(e.currentTarget.getBoundingClientRect());
            setMenuHover(true);
          }}
          onMouseLeave={() => setMenuHover(false)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-700 text-neutral-300 hover:text-white transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
          aria-label="Toggle navigation menu"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <TooltipPortal
          text="Toggle Navigation Menu"
          visible={menuHover}
          anchorRect={menuRect}
        />
      </div>

      {/* Scrollable Tools Area */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {menuGroups.map((group, gi) => (
          <div
            key={group.label}
            className="w-full flex flex-col items-center pb-1"
          >
            {/* Section divider + label */}
            <div
              className="w-full flex flex-col items-center"
              style={{
                marginTop: gi > 0 ? "0.6rem" : "0.2rem",
                marginBottom: "0.4rem",
              }}
            >
              {gi > 0 && (
                <div className="w-6 h-[1px] bg-[#2F2F2F] rounded-full mb-1.5" />
              )}
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.14em] text-[#9CA3AF] select-none text-center w-full px-0.5 truncate">
                {group.label}
              </span>
            </div>
            {/* Items in the group */}
            <div className="w-full flex flex-col items-center space-y-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Footer - Creative Suite / Return */}
      <div className="mt-auto pt-3 flex justify-center w-full pb-2 border-t border-[#2F2F2F] shrink-0">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={handleReturnToWorkspace}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            aria-label="Return to Workspace"
            className="w-9 h-9 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all shadow-lg active:scale-90 border border-[#60A5FA]/40 cursor-pointer flex items-center justify-center group"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-white" />
          </button>
          <TooltipPortal
            text="Return to Workspace"
            visible={returnHover}
            anchorRect={returnRect}
          />
        </div>
      </div>
    </aside>
  );
};

const EditorMiniSidebar = React.memo(EditorMiniSidebarInner);
export default EditorMiniSidebar;
