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
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

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
          label: "Video Studio",
          icon: Film,
          active: isVideoEditorPath,
          path: "/video-editor",
          onClick: () => navigateTo("/video-editor"),
        },
        {
          label: "Image Editor",
          icon: Image,
          active: isImageEditorPath,
          path: "/image-editor",
          onClick: () => navigateTo("/image-editor"),
        },
        {
          label: "Auto-Crop Studio",
          icon: Scissors,
          active: isAutoCrop,
          path: "/auto-crop",
          onClick: () => navigateTo("/auto-crop"),
        },
      ],
    },
    {
      group: "System",
      items: [
        {
          label: "Creative Suite",
          icon: Sparkles,
          active: currentPath.startsWith("/creative-suite"),
          path: "/creative-suite",
          onClick: () => navigateTo("/creative-suite"),
        },
        {
          label: "AI Neural Core",
          icon: Brain,
          active: currentPath.startsWith("/ai-core"),
          path: "/ai-core",
          onClick: () => navigateTo("/ai-core"),
        },
        {
          label: "Keyboard Shortcuts",
          icon: Keyboard,
          active: isShortcuts,
          path: "/shortcuts",
          onClick: () => navigateTo("/shortcuts"),
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
              ? "h-5 bg-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.9)] opacity-100"
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
          {/* iOS Squircle Icon Container */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              item.active
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 shadow-[0_0_20px_rgba(59,130,246,0.6)] text-white scale-105"
                : "bg-[#18191f]/60 border border-white/5 text-neutral-400 group-hover:bg-[#23242c] group-hover:border-white/10 group-hover:text-white"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-200 ${
                item.active
                  ? "text-white"
                  : "text-neutral-400 group-hover:text-white"
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
  const [menuHover, setMenuHover] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-20 shrink-0 bg-[#0c0d12]/95 backdrop-blur-2xl border-r border-white/10 hidden lg:flex flex-col items-center py-3 z-40 overflow-hidden select-none">
      {/* Navigation Groups */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
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
                <div className="w-6 h-[1px] bg-neutral-800/80 rounded-full mb-1.5" />
              )}
              <span className="text-[8.5px] font-mono font-black uppercase tracking-[0.2em] text-[#3B82F6] select-none text-center w-full px-1">
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
      <div className="mt-auto pt-3 flex justify-center w-full pb-2 border-t border-white/10 shrink-0">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/creative-suite")}
            onMouseEnter={(e) => {
              setCreativeRect(e.currentTarget.getBoundingClientRect());
              setCreativeHover(true);
            }}
            onMouseLeave={() => setCreativeHover(false)}
            aria-label="Creative Suite"
            className="w-11 h-11 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_28px_rgba(59,130,246,0.8)] active:scale-90 border border-[#60A5FA]/40 cursor-pointer flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 shrink-0" />
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
