import React from "react";
import { resolveWorkspaceReturnPath } from "../../../utils/workspaceNavigation";
import {
  Layout,
  Scissors,
  Film,
  Layers,
  Brain,
  Download,
  Settings,
  ArrowLeft,
  X,
  Edit2,
  type LucideIcon,
} from "lucide-react";

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
}: EditorSidebarProps) => {
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
          id: "timeline",
          label: "Storyboard Timeline",
          icon: Layers,
          badge: panelsCount > 0 ? panelsCount : undefined,
          type: "section",
        },
        {
          id: "production",
          label: "Export & Publish",
          icon: Download,
          type: "section",
        },
      ],
    },
    {
      title: "AI Automation Suite",
      items: [
        {
          id: "autocrop",
          label: "Auto-Crop Panels",
          icon: Scissors,
          isProcessing: isBatchCropping,
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
      className={`fixed top-0 bottom-0 left-0 h-screen bg-[#0a0a0e]/95 backdrop-blur-2xl border-r border-purple-900/10 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 shadow-[8px_0_32px_rgba(0,0,0,0.6)] overflow-hidden ${
        isCollapsed ? "w-20" : "w-[280px]"
      }`}
    >
      {/* Top Header / Close Area */}
      <div
        className={`flex items-center border-b border-white/[0.02] transition-all duration-300 shrink-0 ${
          isCollapsed ? "p-4 justify-center" : "h-16 px-4 justify-between"
        }`}
      >
        {!isCollapsed && (
          <span className="text-[10px] font-black text-purple-400/50 uppercase tracking-[0.25em] font-mono ml-2">
            Workspace
          </span>
        )}

        {/* Mobile/Desktop Close Button */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-95"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-4 text-[9px] font-black text-purple-400/40 uppercase tracking-[0.2em] font-mono mb-1">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const params = new URLSearchParams(locationSearch || window.location.search);
                const isSettingsActive = params.get("tab") === "settings";
                const isActive =
                  item.id === "settings"
                    ? isSettingsActive
                    : !isSettingsActive && currentSection === item.id;

                return (
                  <div key={item.id} className="relative flex justify-center">
                    {/* Premium Floating Active Pill */}
                    <div
                      className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                        isActive
                          ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)] opacity-100"
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

                        if (item.type === "tool") {
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
                        setIsCollapsed(true);
                      }}
                      className={`w-full flex items-center ${
                        isCollapsed
                          ? "justify-center p-3"
                          : "justify-between px-4 py-3"
                      } rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-[0.98] ${
                        isActive
                          ? "bg-purple-500/10 text-white shadow-[inset_0_0_16px_rgba(168,85,247,0.15)] border border-purple-500/20"
                          : "text-neutral-500 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${
                            isActive
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
                          className={`absolute ${
                            isCollapsed ? "-top-1 -right-1" : "relative top-0 right-0"
                          } flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[10px] font-bold font-mono transition-colors border ${
                            isActive
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
                          className={`absolute ${
                            isCollapsed
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
      <div className="p-4 border-t border-white/[0.02] bg-gradient-to-t from-black/20 to-transparent">
        <button
          onClick={handleReturnToWorkspace}
          className={`flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all active:scale-95 border border-white/10 cursor-pointer ${
            isCollapsed ? "h-12 w-12 p-0" : "w-full py-3 gap-3"
          }`}
          title="Return to Workspace"
        >
          <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
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
