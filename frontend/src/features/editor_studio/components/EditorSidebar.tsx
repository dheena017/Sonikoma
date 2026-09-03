import React from "react";
import { resolveWorkspaceReturnPath } from "@/shared/utils/workspaceNavigation";
import {
  Layout,
  Scissors,
  Film,
  Layers,
  Settings,
  ExternalLink,
  X,
  Edit2,
  Mic,
  type LucideIcon,
} from "lucide-react";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import { SonikomaLogo } from "@/shared/ui/branding";

interface EditorSidebarProps {
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
  locationSearch?: string;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
}

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  isProcessing?: boolean;
  type: "section" | "tool" | "link";
}

interface SidebarGroup {
  title: string;
  items: SidebarMenuItem[];
}

const EditorSidebar = ({
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
  locationSearch,
  seriesSlug,
  chapterSlug,
}: EditorSidebarProps) => {
  const editingImageIdx = useImageEditorStore((state) => state.editingImageIdx);
  const episodeGroups =
    ((window as any).__scrapeEpisodeGroups as Array<{
      episodeLabel: string;
      startIndex: number;
      count: number;
    }>) || [];

  const menuGroups: SidebarGroup[] = [
    {
      title: "Workspace Navigation",
      items: [
        {
          id: "monitor",
          label: "Video Monitor",
          icon: Film,
          type: "section",
        },
        {
          id: "assets",
          label: "Imported Assets",
          icon: Layout,
          badge: scrapedCount > 0 ? scrapedCount : undefined,
          type: "section",
        },
        {
          id: "storyboard",
          label: "Storyboard",
          icon: Layers,
          badge: panelsCount > 0 ? panelsCount : undefined,
          type: "section",
        },
      ],
    },
    {
      title: "Tools",
      items: [
        {
          id: "video-editor",
          label: "Video Studio",
          icon: Film,
          type: "tool",
        },
        {
          id: "image-editor",
          label: "Image Editor",
          icon: Edit2,
          type: "tool",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "settings",
          label: "Video Settings",
          icon: Settings,
          type: "link",
        },
        {
          id: "audio-settings",
          label: "Audio Settings",
          icon: Mic,
          type: "link",
        },
        {
          id: "autocrop-settings",
          label: "Auto-Crop Settings",
          icon: Scissors,
          type: "link",
        },
      ],
    },
  ];

  const handleReturnToWorkspace = () => {
    if (onBackToApp) {
      onBackToApp();
      setIsCollapsed(true);
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
    setIsCollapsed(true);
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 h-screen bg-[#06060c]/90 backdrop-blur-3xl border-r border-white/8 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[120] shadow-[10px_0_40px_rgba(0,0,0,0.7),inset_-1px_0_0_rgba(168,85,247,0.06)] overflow-hidden select-none ${isCollapsed ? "w-20" : "w-[280px]"
        }`}
    >
      {/* Top Header / Close Area */}
      <div
        className={`flex items-center border-b border-white/5 transition-all duration-300 shrink-0 ${isCollapsed ? "p-4 justify-center" : "h-16 px-4 justify-between"
          }`}
      >
        {!isCollapsed && (
          <SonikomaLogo
            size="sm"
            badge="Studio"
            showSubtitle={true}
            subtitleText="Storyboard & Scraper"
          />
        )}

        {/* Mobile/Desktop Close Button */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/8 text-neutral-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.title} className="space-y-2">
            {!isCollapsed && groupIdx > 0 && (
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent my-3" />
            )}
            {!isCollapsed && (
              <h3 className="px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] font-sans mb-1">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const params = new URLSearchParams(
                  locationSearch || window.location.search
                );
                const activeTab = params.get("tab");
                const isSettingsTab =
                  item.id === "settings" ||
                  item.id === "audio-settings" ||
                  item.id === "autocrop-settings";
                const isActive = isSettingsTab
                  ? activeTab === item.id
                  : !activeTab && currentSection === item.id;

                return (
                  <div key={item.id} className="relative flex justify-center">
                    {/* Premium Floating Active Pill */}
                    <div
                      className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${isActive
                          ? "h-5 bg-gradient-to-b from-purple-400 to-amber-400 shadow-[0_0_14px_rgba(168,85,247,0.9)] opacity-100"
                          : "h-0 bg-transparent opacity-0"
                        }`}
                    />

                    <button
                      onClick={() => {
                        // Remove ?tab query param if navigating to a different section
                        if (!isSettingsTab) {
                          const p = new URLSearchParams(window.location.search);
                          if (p.has("tab")) {
                            p.delete("tab");
                            const searchStr = p.toString();
                            const newPath = `${window.location.pathname}${searchStr ? "?" + searchStr : ""
                              }`;
                            if (navigateTo) {
                              navigateTo(newPath);
                            } else {
                              window.history.pushState({}, "", newPath);
                              window.dispatchEvent(new Event("popstate"));
                            }
                          }
                        }

                        if (item.id === "video-editor") {
                          const target = "/video-editor";
                          if (navigateTo) {
                            navigateTo(target);
                          } else {
                            window.history.pushState({}, "", target);
                            window.dispatchEvent(new Event("popstate"));
                          }
                        } else if (item.id === "image-editor") {
                          const target = `/image-editor?idx=${editingImageIdx ?? 0
                            }`;
                          if (navigateTo) {
                            navigateTo(target);
                          } else {
                            window.history.pushState({}, "", target);
                            window.dispatchEvent(new Event("popstate"));
                          }
                        } else if (isSettingsTab) {
                          const p = new URLSearchParams(window.location.search);
                          p.set("tab", item.id);
                          const newPath = `${window.location.pathname
                            }?${p.toString()}`;
                          if (navigateTo) {
                            navigateTo(newPath);
                          } else {
                            window.history.pushState({}, "", newPath);
                            window.dispatchEvent(new Event("popstate"));
                          }
                        } else {
                          if (item.id === "monitor") {
                            useImageEditorStore
                              .getState()
                              .setPlayerSettings({ isPlayerOpen: true });
                          }
                          setCurrentSection(item.id);
                          requestAnimationFrame(() => {
                            setTimeout(() => {
                              const targetMap: Record<string, string[]> = {
                                monitor: ["section-monitor", "section-monitor-placeholder"],
                                storyboard: ["section-storyboard", "section-timeline", "panels_timeline_section"],
                                timeline: ["section-storyboard", "section-timeline", "panels_timeline_section"],
                                assets: ["section-assets", "section-raw-images"],
                                autocrop: ["section-storyboard", "section-timeline", "panels_timeline_section"],
                              };
                              const candidateIds = targetMap[item.id] || [`section-${item.id}`, item.id];
                              for (const id of candidateIds) {
                                const el = document.getElementById(id);
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                                  break;
                                }
                              }
                            }, 60);
                          });
                        }
                        setIsCollapsed(true);
                      }}
                      className={`w-full flex items-center ${isCollapsed
                          ? "justify-center p-3"
                          : "justify-between px-4 py-3"
                        } rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-[0.98] ${isActive
                          ? "bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-purple-950/40 text-white shadow-[0_4px_20px_rgba(168,85,247,0.2)] border border-purple-500/40 font-bold"
                          : "text-neutral-300 hover:text-white hover:bg-neutral-900/80 border border-transparent hover:border-neutral-800/60"
                        }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${isActive
                              ? "text-purple-400"
                              : "group-hover:scale-110 group-hover:text-neutral-300"
                            }`}
                        />
                        {!isCollapsed && (
                          <span className="text-sm font-bold tracking-wide">
                            {item.label}
                          </span>
                        )}
                      </div>

                      {/* Badge Logic */}
                      {item.badge !== undefined && (
                        <span
                          className={`absolute ${isCollapsed
                              ? "-top-1 -right-1"
                              : "relative top-0 right-0"
                            } flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[10px] font-bold font-mono transition-colors border ${isActive
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-neutral-900 text-neutral-500 border-white/5"
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Processing Ping */}
                      {item.isProcessing && (
                        <span
                          className={`absolute ${isCollapsed
                              ? "top-1 right-1"
                              : "top-1/2 -translate-y-1/2 right-3"
                            } h-2 w-2 rounded-full bg-purple-500 animate-ping`}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Footer - Return to Workspace */}
      <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/30 to-transparent flex justify-center w-full">
        <button
          onClick={handleReturnToWorkspace}
          className={`flex items-center justify-center rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white transition-all active:scale-95 border border-purple-400/30 cursor-pointer shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] ${isCollapsed ? "h-12 w-12 p-0" : "w-full py-3 gap-3"
            }`}
          title="Return to Workspace"
        >
          <ExternalLink className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-bold tracking-wide">
              Return to Workspace
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default EditorSidebar;
