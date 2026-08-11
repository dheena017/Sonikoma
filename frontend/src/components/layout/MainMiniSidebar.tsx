import React, { useState } from "react";
import {
  LayoutDashboard,
  Layout,
  FolderOpen,
  Scissors,
  Brain,
  Film,
  Terminal,
  Activity,
  Award,
  Keyboard,
  Sliders,
  Bell,
  Sparkles,
  Shield,
  Zap,
  Database,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

interface MiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  notificationsCount: number;
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
}

const MiniSidebarInner: React.FC<MiniSidebarProps> = ({
  currentPath,
  navigateTo,
  notificationsCount,
  projectId = null,
  seriesSlug = null,
  chapterSlug = null,
}) => {
  const isDashboardOverview =
    currentPath === "/" || currentPath === "/dashboard";
  const isWorkspace = currentPath.startsWith("/scraper");
  const isProjects = currentPath.startsWith("/projects");
  const isAutoCrop = currentPath.startsWith("/auto-crop");
  const isEditor =
    currentPath.startsWith("/editor") ||
    currentPath.startsWith("/scraper/editor");

  const isShortcuts = currentPath.startsWith("/shortcuts");
  const isAdminPath = currentPath.startsWith("/admin");
  const isProEditorPage =
    currentPath === "/editor" ||
    currentPath === "/editor/" ||
    currentPath.startsWith("/editor/") ||
    currentPath.startsWith("/scraper/editor");

  const handleNavigateToWorkspace = () => {
    const activeProjId = projectId || localStorage.getItem("active_project_id");
    const activeSeriesSlug =
      seriesSlug || localStorage.getItem("active_series_slug");
    const activeChapterSlug =
      chapterSlug || localStorage.getItem("active_chapter_slug");

    if (activeProjId) {
      if (activeSeriesSlug && activeChapterSlug) {
        navigateTo(
          `/scraper/editor/series/${activeSeriesSlug}/chapters/${activeChapterSlug}`
        );
      } else if (activeProjId.startsWith("temp_")) {
        navigateTo(`/scraper/editor?id=${activeProjId}`);
      } else {
        navigateTo(`/scraper?id=${activeProjId}`);
      }
    } else {
      navigateTo("/scraper");
    }
  };

  const groups = [
    {
      group: "Main",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          active: isDashboardOverview,
          onClick: () => navigateTo("/dashboard"),
        },
        {
          label: "Workspace",
          icon: Layout,
          active: isWorkspace,
          onClick: handleNavigateToWorkspace,
        },
        {
          label: "Projects",
          icon: FolderOpen,
          active: isProjects,
          onClick: () => navigateTo("/projects"),
        },
      ],
    },
    {
      group: "Editor",
      items: [
        {
          label: "Auto-Crop",
          icon: Scissors,
          active: isAutoCrop,
          onClick: () => navigateTo("/auto-crop"),
        },

        {
          label: "Video Studio",
          icon: Film,
          active: isEditor,
          onClick: () => {
            const tempId = `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            navigateTo(`/scraper/editor?id=${tempId}`);
          },
        },
      ],
    },
    {
      group: "Creative",
      items: [
        {
          label: "Creative Suite",
          icon: Sparkles,
          active: false,
          onClick: () => navigateTo("/creative-suite"),
        },
      ],
    },
    {
      group: "System",
      items: [






      ],
    },
    {
      group: "User",
      items: [
        {
          label: "Notifications",
          icon: Bell,
          active: currentPath === "/notifications",
          onClick: () => navigateTo("/notifications"),
          badge: notificationsCount > 0 ? notificationsCount : undefined,
        },
        {
          label: "Profile",
          icon: Sparkles,
          active: currentPath === "/profile",
          onClick: () => navigateTo("/profile"),
        },
        {
          label: "Admin Dashboard",
          icon: Shield,
          active: isAdminPath,
          onClick: () => navigateTo("/admin"),
        },
      ],
    },
  ];

  const SidebarItem: React.FC<{ item: any }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setRect(r);
      setHover(true);
    };
    const handleLeave = () => setHover(false);

    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Premium Floating Active Pill */}
        <div
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
            item.active
              ? "h-5 bg-gradient-to-b from-purple-400 to-amber-400 shadow-[0_0_14px_rgba(168,85,247,0.9)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={item.onClick}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          title={item.label}
          className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95"
        >
          {/* iOS-style icon pill */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              item.active
                ? "bg-gradient-to-br from-purple-900/50 to-purple-950/60 border border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.3)] scale-105"
                : "bg-neutral-800/80 border border-neutral-700/80 group-hover:bg-purple-500/15 group-hover:border-purple-500/30"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-300 ${
                item.active ? "text-purple-300" : "text-neutral-400 group-hover:text-purple-300"
              }`}
            />
          </div>
          {item.badge && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-gradient-to-r from-purple-500 to-indigo-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 border border-neutral-950 shadow-sm z-20">
              {item.badge}
            </span>
          )}
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  const [creativeHover, setCreativeHover] = useState(false);
  const [creativeRect, setCreativeRect] = useState<DOMRect | null>(null);

  return (
    // Premium Glassmorphism Container
    <aside
      className="fixed top-16 bottom-0 left-0 w-20 shrink-0 bg-neutral-950/90 backdrop-blur-2xl border-r border-neutral-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.4)] hidden lg:flex flex-col items-center py-4 z-[90] overflow-hidden"
    >
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div
            key={groupIdx}
            className="w-full flex flex-col items-center pb-2"
          >
            {/* Section divider (only between groups) + label for every group */}
            <div className="w-full flex flex-col items-center" style={{ marginTop: groupIdx > 0 ? '0.5rem' : '0', marginBottom: '0.375rem' }}>
              {groupIdx > 0 && <div className="w-8 h-[1px] bg-neutral-700/60 rounded-full mb-1.5" />}
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400 font-mono select-none text-center w-full truncate whitespace-nowrap overflow-hidden px-1 drop-shadow-sm">
                {group.group}
              </span>
            </div>

            {group.items.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Creative Tools Button - Matched to the Premium "Return" styling */}
      <div className="mt-auto pt-4 flex justify-center w-full pb-2 border-t border-neutral-800/60">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/scraper")}
            onMouseEnter={(e) => {
              setCreativeRect(e.currentTarget.getBoundingClientRect());
              setCreativeHover(true);
            }}
            onMouseLeave={() => setCreativeHover(false)}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white transition-all shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] active:scale-90 border border-purple-400/30 cursor-pointer flex items-center justify-center"
          >
            <Sparkles className="w-[18px] h-[18px] shrink-0" />
          </button>
          <TooltipPortal
            text="Creative Suite"
            visible={creativeHover}
            anchorRect={creativeRect}
          />
        </div>
      </div>
    </aside>
  );
};

const MiniSidebar = React.memo(MiniSidebarInner);
export default MiniSidebar;
