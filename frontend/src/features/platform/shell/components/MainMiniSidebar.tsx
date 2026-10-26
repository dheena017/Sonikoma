import React, { useState } from"react";
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
} from"lucide-react";
import TooltipPortal from"@/shared/ui/common/TooltipPortal";
import {
  getHumanEditorPath,
  getImageEditorPath,
} from"@/shared/utils/workspaceNavigation";

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
    currentPath ==="/" || currentPath ==="/dashboard";
  const isWorkspace = currentPath.startsWith("/scraper");
  const isProjects = currentPath.startsWith("/projects");
  const isAutoCrop = currentPath.startsWith("/auto-crop");
  const isEditor =
    currentPath.startsWith("/editor") ||
    currentPath.startsWith("/scraper/editor");
  const isImageEditorPath =
    currentPath ==="/image-editor" ||
    currentPath ==="/image-editor/" ||
    currentPath.startsWith("/image-editor/") ||
    currentPath.includes("/image-editor");
  const isVideoEditorPath =
    currentPath ==="/video-editor" ||
    currentPath ==="/video-editor/" ||
    currentPath.startsWith("/video-editor/");

  const isShortcuts = currentPath.startsWith("/shortcuts");
  const isAdminPath = currentPath.startsWith("/admin");
  const isProEditorPage =
    currentPath ==="/editor" ||
    currentPath ==="/editor/" ||
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
    if (typeof window !=="undefined") {
      if (localStorage.getItem("sonikoma_admin_token")) return true;
      try {
        const savedUserStr = localStorage.getItem("sonikoma_user");
        if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          if (u?.creator_role ==="admin" || u?.role ==="admin") return true;
        }
      } catch (e) {}
    }
    return false;
  }, []);

  const groups = [
    {
      group:"Main",
      items: [
        {
          label:"Dashboard",
          icon: LayoutDashboard,
          active: isDashboardOverview,
          path:"/dashboard",
          onClick: () => navigateTo("/dashboard"),
        },
        {
          label:"Projects & Series",
          icon: FolderOpen,
          active: isProjects,
          path:"/projects",
          onClick: () => navigateTo("/projects"),
        },
        {
          label:"Webtoon Scraper",
          icon: Layout,
          active: isWorkspace,
          path:"/scraper",
          onClick: handleNavigateToWorkspace,
        },
      ],
    },
    {
      group:"Studios",
      items: [
        {
          label:"Creative Suite",
          icon: Sparkles,
          active:
            currentPath ==="/creative-suite" ||
            currentPath.startsWith("/creative-suite/") ||
            (currentPath.startsWith("/ai-") &&
              !currentPath.startsWith("/ai-core")) ||
            currentPath ==="/translation" ||
            currentPath ==="/panel-assistant" ||
            currentPath ==="/youtube",
          path:"/creative-suite",
          onClick: () => navigateTo("/creative-suite"),
        },
        {
          label:"AI Core & Multi-Engine",
          icon: Brain,
          active:
            currentPath ==="/ai-core" || currentPath.startsWith("/ai-core/"),
          path:"/ai-core",
          onClick: () => navigateTo("/ai-core"),
        },
        {
          label:"Image Editor",
          icon: Image,
          active: isImageEditorPath,
          path:"/image-editor",
          onClick: () =>
            navigateTo(
              getImageEditorPath({
                seriesSlug,
                chapterSlug,
                projectId,
              })
            ),
        },
        {
          label:"Video Editor",
          icon: Film,
          active: isVideoEditorPath,
          path:"/video-editor",
          onClick: () => navigateTo("/video-editor"),
        },
        ...(isAdmin
          ? [
              {
                label:"Admin",
                icon: Shield,
                active: isAdminPath,
                path:"/admin",
                onClick: () => navigateTo("/admin"),
              },
            ]
          : []),
      ],
    },
    {
      group:"Account & Alerts",
      items: [
        {
          label:"Notifications",
          icon: Bell,
          active: currentPath ==="/notifications",
          path:"/notifications",
          onClick: () => navigateTo("/notifications"),
          badge: notificationsCount > 0 ? notificationsCount : undefined,
        },
        {
          label:"Shortcuts",
          icon: Keyboard,
          active: isShortcuts,
          path:"/shortcuts",
          onClick: () => navigateTo("/shortcuts"),
        },
        {
          label:"Profile",
          icon: User,
          active: currentPath ==="/profile",
          path:"/profile",
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
              ?"h-5 bg-[#3B82F6]  opacity-100"
              :"h-0 bg-transparent opacity-0"
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
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${
              item.active
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white scale-105"
                : "bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-neutral-700"
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-colors duration-200 ${
                item.active
                  ? "text-white"
                  : "text-[#9CA3AF] group-hover:text-[#3B82F6]"
              }`}
            />
          </div>
          {item.badge && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-[#3B82F6] text-[9px] text-white font-bold rounded-full flex items-center justify-center px-1 border border-neutral-950 z-20">
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
    <aside className="fixed top-0 bottom-0 left-0 w-14 h-screen shrink-0 bg-[#0A0A0A]/95 backdrop-blur-2xl border-r border-[#2F2F2F] hidden lg:flex flex-col items-center z-40 overflow-hidden select-none">
      {/* Top Header / Menu Toggle Button Area (Matches Header h-16) */}
      <div className="h-16 w-full flex items-center justify-center border-b border-[#2F2F2F] shrink-0">
        <button
          onClick={onToggleSidebar}
          onMouseEnter={(e) => {
            setMenuRect(e.currentTarget.getBoundingClientRect());
            setMenuHover(true);
          }}
          onMouseLeave={() => setMenuHover(false)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 text-white transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
          aria-label="Toggle Navigation Menu"
          title="Toggle Navigation Menu (Ctrl+B)"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <TooltipPortal
          text="Toggle Navigation Menu"
          visible={menuHover}
          anchorRect={menuRect}
        />
      </div>

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
                <div className="w-6 h-[1px] bg-[#2F2F2F] rounded-full mb-1.5" />
              )}
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.14em] text-[#9CA3AF] select-none text-center w-full px-0.5 truncate">
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
            className="w-9 h-9 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all shadow-lg active:scale-90 border border-[#60A5FA]/40 cursor-pointer flex items-center justify-center group"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-white" />
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
