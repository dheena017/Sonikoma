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
  Image,
  User,
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
  const isImageEditorPath =
    currentPath === "/image-editor" ||
    currentPath === "/image-editor/" ||
    currentPath.startsWith("/image-editor/") ||
    currentPath.includes("/image-editor");
  const isVideoEditorPath =
    currentPath === "/video-editor" ||
    currentPath === "/video-editor/" ||
    currentPath.startsWith("/video-editor/");

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
          path: "/dashboard",
          onClick: () => navigateTo("/dashboard"),
        },
        {
          label: "Workspace",
          icon: Layout,
          active: isWorkspace,
          path: "/scraper",
          onClick: handleNavigateToWorkspace,
        },
        {
          label: "Projects",
          icon: FolderOpen,
          active: isProjects,
          path: "/projects",
          onClick: () => navigateTo("/projects"),
        },
      ],
    },
    {
      group: "Creative",
      items: [
        {
          label: "Creative Suite",
          icon: Sparkles,
          active:
            currentPath === "/creative-suite" ||
            currentPath.startsWith("/creative-suite/") ||
            currentPath.startsWith("/ai-") ||
            currentPath === "/panel-assistant" ||
            currentPath === "/youtube",
          path: "/creative-suite",
          onClick: () => navigateTo("/creative-suite"),
        },
        {
          label: "AI Core",
          icon: Brain,
          active: currentPath === "/ai-core" || currentPath.startsWith("/ai-core/"),
          path: "/ai-core",
          onClick: () => navigateTo("/ai-core"),
        },
        {
          label: "Image Editor",
          icon: Image,
          active: isImageEditorPath,
          path: "/image-editor",
          onClick: () => navigateTo("/image-editor"),
        },
        {
          label: "Video Editor",
          icon: Film,
          active: isVideoEditorPath,
          path: "/video-editor",
          onClick: () => navigateTo("/video-editor"),
        },
        {
          label: "Admin",
          icon: Shield,
          active: isAdminPath,
          path: "/admin",
          onClick: () => navigateTo("/admin"),
        },
      ],
    },
    {
      group: "User",
      items: [
        {
          label: "Notifications",
          icon: Bell,
          active: currentPath === "/notifications",
          path: "/notifications",
          onClick: () => navigateTo("/notifications"),
          badge: notificationsCount > 0 ? notificationsCount : undefined,
        },
        {
          label: "Profile",
          icon: User,
          active: currentPath === "/profile",
          path: "/profile",
          onClick: () => navigateTo("/profile"),
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
      if (item.path) {
        (window as any).prefetchRoute?.(item.path);
      }
    };
    const handleLeave = () => setHover(false);

    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Simple Clean Active Pill */}
        <div
          className={`absolute left-1 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-150 z-10 ${
            item.active
              ? "h-4 bg-purple-400 opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={item.onClick}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          aria-label={item.label}
          className="p-1 transition-all duration-150 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
        >
          {/* Flat clean icon pill */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
              item.active
                ? "bg-purple-500/15 border border-purple-500/30 text-purple-300"
                : "bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-150 ${
                item.active
                  ? "text-purple-300"
                  : "text-neutral-400 group-hover:text-neutral-200"
              }`}
            />
          </div>
          {item.badge && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-purple-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 border border-neutral-950 z-20">
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
    <aside className="fixed top-16 bottom-0 left-0 w-20 shrink-0 bg-neutral-950 border-r border-neutral-800/80 hidden lg:flex flex-col items-center py-3 z-40 overflow-hidden select-none">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1">
        {groups.map((group, groupIdx) => (
          <div
            key={groupIdx}
            className="w-full flex flex-col items-center pb-1"
          >
            {/* Section divider + label */}
            <div
              className="w-full flex flex-col items-center"
              style={{
                marginTop: groupIdx > 0 ? "0.375rem" : "0",
                marginBottom: "0.25rem",
              }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-px bg-neutral-800 rounded-full mb-1" />
              )}
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500 select-none text-center w-full px-1">
                {group.group}
              </span>
            </div>

            {group.items.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Bottom Action Button */}
      <div className="mt-auto pt-3 flex justify-center w-full pb-1 border-t border-neutral-800/80">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/creative-suite")}
            onMouseEnter={(e) => {
              setCreativeRect(e.currentTarget.getBoundingClientRect());
              setCreativeHover(true);
            }}
            onMouseLeave={() => setCreativeHover(false)}
            aria-label="Creative Suite"
            className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700 hover:text-white transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
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
