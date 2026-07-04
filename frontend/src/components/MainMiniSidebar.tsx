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
  ChevronRight,
} from "lucide-react";
import TooltipPortal from "./TooltipPortal";

interface MiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  notificationsCount: number;
}

const MiniSidebarInner: React.FC<MiniSidebarProps> = ({
  currentPath,
  navigateTo,
  notificationsCount,
}) => {
  const isDashboardOverview = currentPath === "/" || currentPath === "/dashboard";
  const isWorkspace = currentPath.startsWith("/workspace");
  const isProjects = currentPath.startsWith("/projects");
  const isAutoCrop = currentPath.startsWith("/auto-crop");
  const isBubbleCleaner = currentPath.startsWith("/bubble-cleaner");
  const isEditor = currentPath.startsWith("/editor") || currentPath.startsWith("/workspace/editor");

  const isLogs = currentPath.startsWith("/logs");
  const isStatus = currentPath.startsWith("/status");
  const isAIModels = currentPath.startsWith("/ai-models");
  const isShortcuts = currentPath.startsWith("/shortcuts");
  const isSettings = currentPath.startsWith("/settings");
  const isAdminPath = currentPath.startsWith("/admin");
  const isProEditorPage =
    currentPath === "/editor" ||
    currentPath === "/editor/" ||
    currentPath.startsWith("/editor/") ||
    currentPath.startsWith("/workspace/editor");

  const groups = [
    {
      group: "Main Workspace",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, active: isDashboardOverview, onClick: () => navigateTo("/dashboard") },
        { label: "Workspace", icon: Layout, active: isWorkspace, onClick: () => navigateTo("/workspace") },
        { label: "Projects", icon: FolderOpen, active: isProjects, onClick: () => navigateTo("/projects") },
      ],
    },
    {
      group: "Editor Tools",
      items: [
        { label: "Auto-Crop", icon: Scissors, active: isAutoCrop, onClick: () => navigateTo("/auto-crop") },
        { label: "Clean-Bubbles", icon: Brain, active: isBubbleCleaner, onClick: () => navigateTo("/bubble-cleaner") },
        { label: "Video Studio", icon: Film, active: isEditor, onClick: () => {
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          navigateTo(`/workspace/editor?id=${tempId}`);
        }},
      ],
    },
    {
      group: "System & Tools",
      items: [
        { label: "Logs", icon: Terminal, active: isLogs, onClick: () => navigateTo("/logs") },
        { label: "Status", icon: Activity, active: isStatus, onClick: () => navigateTo("/status") },
        { label: "AI Models", icon: Award, active: isAIModels, onClick: () => navigateTo("/ai-models") },
        { label: "Keys", icon: Keyboard, active: isShortcuts, onClick: () => navigateTo("/shortcuts") },
        { label: "Settings", icon: Sliders, active: isSettings, onClick: () => navigateTo("/settings") },
      ],
    },
    {
      group: "User Area",
      items: [
        { label: "Notifications", icon: Bell, active: currentPath === "/notifications", onClick: () => navigateTo("/notifications"), badge: notificationsCount > 0 ? notificationsCount : undefined },
        { label: "Profile", icon: Sparkles, active: currentPath === "/profile", onClick: () => navigateTo("/profile") },
        { label: "Admin Dashboard", icon: Shield, active: isAdminPath, onClick: () => navigateTo("/admin") },
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
              ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)] opacity-100" 
              : "h-0 bg-transparent opacity-0"
          }`} 
        />

        <button
          onClick={item.onClick}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          title={item.label}
          className={`p-2.5 transition-all duration-300 rounded-xl cursor-pointer relative flex items-center justify-center group-active:scale-95 ${
            item.active
              ? "bg-purple-500/10 text-white border border-purple-500/20 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5 border border-transparent hover:scale-105"
          }`}
        >
          <Icon
            className={`w-[18px] h-[18px] transition-transform duration-300 ${
              item.active ? "text-purple-400" : "group-hover:text-neutral-200"
            }`}
          />
          {item.badge && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] bg-purple-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 border border-neutral-950 shadow-sm z-20">
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
    <aside className={`fixed ${isProEditorPage ? "top-12" : "top-16"} bottom-0 left-0 w-20 shrink-0 bg-[#0a0a0e]/80 backdrop-blur-xl border-r border-purple-900/10 shadow-[4px_0_24px_rgba(0,0,0,0.4)] hidden lg:flex flex-col items-center py-4 z-40`}>
      <div
        className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2"
      >
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="w-full flex flex-col items-center pb-2">
            
            {/* Soft, premium gradient dot separator between groups */}
            {groupIdx > 0 && (
               <div className="w-1 h-1 rounded-full bg-purple-900/50 shadow-[0_0_4px_rgba(168,85,247,0.3)] my-2" />
            )}
            
            {group.items.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Creative Tools Button - Matched to the Premium "Return" styling */}
      <div className="mt-auto pt-4 flex justify-center w-full pb-2 border-t border-white/[0.02]">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/workspace")}
            onMouseEnter={(e) => {
              setCreativeRect(e.currentTarget.getBoundingClientRect());
              setCreativeHover(true);
            }}
            onMouseLeave={() => setCreativeHover(false)}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white transition-all shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] active:scale-90 border border-purple-400/30 cursor-pointer flex items-center justify-center"
          >
            <Sparkles className="w-[18px] h-[18px] shrink-0" />
            <div className="absolute -bottom-1 -right-1 bg-[#0a0a0e] rounded-full p-0.5 border border-purple-900/50 shadow-sm">
              <ChevronRight className="h-2.5 w-2.5 text-neutral-300" />
            </div>
          </button>
          <TooltipPortal text="Creative Suite" visible={creativeHover} anchorRect={creativeRect} />
        </div>
      </div>
    </aside>
  );
};

const MiniSidebar = React.memo(MiniSidebarInner);
export default MiniSidebar;
