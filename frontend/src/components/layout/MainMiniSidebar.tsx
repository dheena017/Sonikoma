import React, { useState } from "react";
import {
  Menu,
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
  ExternalLink,
  Wand2,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";
import { getHumanEditorPath } from "@/shared/utils/workspaceNavigation";

interface MiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  notificationsCount: number;
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  onToggleSidebar?: () => void;
}

const MiniSidebarInner: React.FC<MiniSidebarProps> = ({
  currentPath,
  navigateTo,
  notificationsCount,
  projectId = null,
  seriesSlug = null,
  chapterSlug = null,
  onToggleSidebar,
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

    const path = getHumanEditorPath({
      projectId: activeProjId,
      seriesSlug: activeSeriesSlug,
      chapterSlug: activeChapterSlug,
    });
    navigateTo(path);
  };

  const isAdmin = React.useMemo(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("sonikoma_admin_token")) return true;
      try {
        const savedUserStr = localStorage.getItem("sonikoma_user");
        if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          if (u?.creator_role === "admin" || u?.role === "admin") return true;
        }
      } catch (e) {}
    }
    return false;
  }, []);

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
          label: "Projects & Series",
          icon: FolderOpen,
          active: isProjects,
          path: "/projects",
          onClick: () => navigateTo("/projects"),
        },
        {
          label: "Webtoon Scraper",
          icon: Layout,
          active: isWorkspace,
          path: "/scraper",
          onClick: handleNavigateToWorkspace,
        },
      ],
    },
    {
      group: "Studios",
      items: [
        {
          label: "AI Series Studio",
          icon: Wand2,
          active: currentPath.startsWith("/series"),
          path: "/series",
          onClick: () =>
            window.dispatchEvent(
              new CustomEvent("sonikoma:open-create-series")
            ),
        },
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
          label: "AI Core & Multi-Engine",
          icon: Brain,
          active:
            currentPath === "/ai-core" || currentPath.startsWith("/ai-core/"),
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
        ...(isAdmin
          ? [
              {
                label: "Admin",
                icon: Shield,
                active: isAdminPath,
                path: "/admin",
                onClick: () => navigateTo("/admin"),
              },
            ]
          : []),
      ],
    },
    {
      group: "Account & Alerts",
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
          label: "Shortcuts",
          icon: Keyboard,
          active: isShortcuts,
          path: "/shortcuts",
          onClick: () => navigateTo("/shortcuts"),
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
    const Icon = item.icon;

    const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      setRect(e.currentTarget.getBoundingClientRect());
      setHover(true);
    };

    const handleLeave = () => {
      setHover(false);
    };

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Left edge active indicator bar */}
        <div
          className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
            item.active
              ? "h-5 bg-[#3B82F6]  opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={item.onClick}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          aria-label={item.label}
          className="p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm ${
              item.active
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white scale-105"
                : "bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-neutral-700 "
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-200 ${
                item.active
                  ? "text-white"
                  : "text-[#9CA3AF] group-hover:text-[#3B82F6]"
              }`}
            />
          </div>
          {item.badge && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-[#3B82F6] text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 border border-neutral-950 z-20">
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
  const [seriesHover, setSeriesHover] = useState(false);
  const [seriesRect, setSeriesRect] = useState<DOMRect | null>(null);

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-20 shrink-0 bg-[#0A0A0A]/95 backdrop-blur-2xl border-r border-[#2F2F2F] hidden lg:flex flex-col items-center py-3 z-40 overflow-hidden select-none">
      {/* Top AI Series Creator Hero Action Trigger */}
      <div className="w-full flex flex-col items-center pt-0.5 pb-2 border-b border-[#2F2F2F]/80 shrink-0 mb-1">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("sonikoma:open-create-series")
              )
            }
            onMouseEnter={(e) => {
              setSeriesRect(e.currentTarget.getBoundingClientRect());
              setSeriesHover(true);
            }}
            onMouseLeave={() => setSeriesHover(false)}
            aria-label="Create AI Series"
            className="p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-pink-500 p-[1.5px] shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105 active:scale-95">
              <div className="w-full h-full bg-[#12111d] rounded-[14px] flex items-center justify-center group-hover:bg-[#1a1728] transition-colors">
                <Sparkles className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors animate-pulse" />
              </div>
            </div>
            <span className="absolute -top-1 -right-0.5 px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-[8px] font-black text-white rounded-full border border-black shadow leading-none">
              AI
            </span>
          </button>
          <TooltipPortal
            text="✨ AI Series Studio (Anime, Manhwa, Comics)"
            visible={seriesHover}
            anchorRect={seriesRect}
          />
        </div>
      </div>

      {/* Navigation Groups */}
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
                marginTop: groupIdx > 0 ? "0.6rem" : "0.2rem",
                marginBottom: "0.4rem",
              }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-[1px] bg-[#2F2F2F] rounded-full mb-1.5" />
              )}
              <span className="text-[8.5px] font-mono font-black uppercase tracking-[0.2em] text-[#9CA3AF] select-none text-center w-full px-1">
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
      <div className="mt-auto pt-3 flex justify-center w-full pb-2 border-t border-[#2F2F2F] shrink-0">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/creative-suite")}
            onMouseEnter={(e) => {
              setCreativeRect(e.currentTarget.getBoundingClientRect());
              setCreativeHover(true);
            }}
            onMouseLeave={() => setCreativeHover(false)}
            aria-label="Creative Suite"
            className="w-11 h-11 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all shadow-lg shadow-blue-500/25 active:scale-90 border border-[#60A5FA]/40 cursor-pointer flex items-center justify-center group"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0 text-white" />
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
