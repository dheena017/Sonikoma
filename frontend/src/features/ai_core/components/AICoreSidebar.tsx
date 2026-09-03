import React, { useEffect } from "react";
import {
  Sparkles,
  LayoutGrid,
  Key,
  BarChart3,
  CreditCard,
  Sliders,
  ShieldCheck,
  Cpu,
  ArrowLeft,
  X,
  Zap,
  FolderOpen,
  FolderSync,
  Workflow,
  TrendingUp,
} from "lucide-react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { SonikomaLogo } from "@/shared/ui/branding";

const ActiveProjectSidebarWidget: React.FC<{
  setDrawerOpen: (open: boolean) => void;
}> = ({ setDrawerOpen }) => {
  const { activeProjectId, activeProjectData } = useProjectStore();
  const [imgError, setImgError] = React.useState(false);

  const coverUrl =
    activeProjectData?.project?.cover_image ||
    activeProjectData?.panels?.[0]?.image_url;

  React.useEffect(() => {
    setImgError(false);
  }, [coverUrl]);

  return (
    <div className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 text-xs shadow-sm my-2 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-purple-400" /> Active Project
        </span>
        {activeProjectId ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                useProjectStore.getState().clearActiveProject();
              }}
              title="Close Active Project"
              aria-label="Close Active Project"
              className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {activeProjectId && activeProjectData ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/60 hover:border-neutral-700/80 transition-colors">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700/50 shrink-0 flex items-center justify-center shadow-inner">
              {coverUrl && !imgError ? (
                <img
                  src={
                    coverUrl.startsWith("http")
                      ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}`
                      : coverUrl
                  }
                  alt={activeProjectData.project?.title || "Project Cover"}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-xs">
                  {activeProjectData.project?.title?.charAt(0).toUpperCase() || "P"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs text-neutral-100 truncate leading-tight">
                {activeProjectData.project?.title || "Untitled Project"}
              </h4>
              <span className="text-[10px] text-neutral-400 truncate font-mono">
                {activeProjectData.panels?.length || activeProjectData.project?.panels_count || 0} panels
              </span>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-800/80 hover:bg-purple-600/20 text-neutral-300 hover:text-purple-200 border border-neutral-700/60 hover:border-purple-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Switch Project</span>
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-neutral-400 mb-2">
            No active project selected.
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer active:scale-98"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Select Active Project</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface AICoreSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AICoreSidebar: React.FC<AICoreSidebarProps> = ({
  currentPath,
  navigateTo,
  isOpen,
  onClose,
}) => {
  const { themeMode } = useThemeMode();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const groups = [
    {
      name: "Intelligence Hub",
      items: [
        {
          id: "dashboard",
          label: "Neural Overview",
          icon: LayoutGrid,
          path: "/ai-core",
        },
        {
          id: "models",
          label: "Model Matrix",
          icon: Cpu,
          path: "/ai-core/models",
        },
      ],
    },
    {
      name: "Infrastructure & Security",
      items: [
        {
          id: "api_keys",
          label: "API Gateway & Keys",
          icon: Key,
          path: "/ai-core/api-keys",
        },
        {
          id: "rate_limits",
          label: "Quotas & Boundaries",
          icon: ShieldCheck,
          path: "/ai-core/rate-limits",
        },
      ],
    },
    {
      name: "Analytics & Economy",
      items: [
        {
          id: "analytics",
          label: "Token Consumption",
          icon: BarChart3,
          path: "/ai-core/analytics",
        },
        {
          id: "billing",
          label: "Ledger & Subscriptions",
          icon: CreditCard,
          path: "/ai-core/billing",
        },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/ai-core") {
      return currentPath === "/ai-core" || currentPath === "/ai-core/";
    }
    return (
      currentPath === path ||
      currentPath.startsWith(path + "?") ||
      currentPath.startsWith(path + "/")
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0d0d12]/95 backdrop-blur-3xl border-r border-white/10 shadow-[8px_0_32px_rgba(0,0,0,0.6)]">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
        <SonikomaLogo
          size="sm"
          badge="AI Core"
          showSubtitle={true}
          subtitleText="Neural Orchestrator"
        />
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
          title="Close sidebar drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Project Widget */}
      <div className="px-4 pt-3 shrink-0">
        <ActiveProjectSidebarWidget
          setDrawerOpen={(open) =>
            useProjectStore.getState().setDrawerOpen(open)
          }
        />
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group, groupIdx) => (
          <div key={group.name} className="space-y-2">
            {groupIdx > 0 && (
              <div className="w-full flex flex-col pt-1 pb-1">
                <div className="w-8 h-[1px] bg-white/10 rounded-full ml-3" />
              </div>
            )}
            <h4 className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">
              {group.name}
            </h4>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);

                return (
                  <li key={item.id} className="relative">
                    {/* Active Side Accent Indicator */}
                    <div
                      className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                        active
                          ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.9)] opacity-100"
                          : "h-0 bg-transparent opacity-0"
                      }`}
                    />

                    <button
                      onClick={() => {
                        navigateTo(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 group relative cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-purple-600/15 text-white shadow-[inset_0_0_16px_rgba(168,85,247,0.12)] border border-purple-500/30 font-bold"
                          : "text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            active
                              ? "text-purple-400"
                              : "text-neutral-400 group-hover:scale-110 group-hover:text-purple-300"
                          }`}
                        />
                        <span className="text-xs font-semibold tracking-wide font-sans">
                          {item.label}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer Return Button */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <button
          onClick={() => {
            navigateTo("/creative-suite");
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(168,85,247,0.45)] hover:shadow-[0_0_28px_rgba(168,85,247,0.65)] active:scale-95 border border-purple-400/40 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>CREATIVE SUITE</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <div
        id="ai_core_sidebar_pane"
        className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[300px] transform transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="AI Core Navigation"
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default AICoreSidebar;
