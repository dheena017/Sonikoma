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
import { useProjectStore } from "@/store/useProjectStore";

const ActiveProjectSidebarWidget: React.FC<{
  setDrawerOpen: (open: boolean) => void;
}> = ({ setDrawerOpen }) => {
  const { activeProjectId, activeProjectData } = useProjectStore();

  return (
    <div className="p-3 rounded-2xl bg-[#0e0f17] border border-white/10 text-xs shadow-md my-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-purple-400" /> Active Context
        </span>
        {activeProjectId ? (
          <span className="text-[9px] text-emerald-400 font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            ● Active
          </span>
        ) : null}
      </div>

      {activeProjectId && activeProjectData ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
              {activeProjectData.project?.cover_image ||
              activeProjectData.panels?.[0]?.image_url ? (
                <img
                  src={
                    activeProjectData.project?.cover_image ||
                    activeProjectData.panels?.[0]?.image_url
                  }
                  alt={activeProjectData.project?.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-purple-300 font-bold text-xs">
                  {activeProjectData.project?.title?.charAt(0).toUpperCase() ||
                    "P"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex flex-col">
              <h4 className="font-semibold text-xs text-white truncate">
                {activeProjectData.project?.title || "Untitled Project"}
              </h4>
              <span className="text-[10px] text-neutral-400 truncate">
                {activeProjectData.panels?.length || 0} Panels
              </span>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-1.5 px-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
            className="w-full py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
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

  // Lock body scroll when sidebar drawer is open
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
          id: "overview",
          label: "AI Command Center",
          icon: LayoutGrid,
          path: "/ai-core",
        },
      ],
    },
    {
      name: "Engines & Providers",
      items: [
        {
          id: "api_keys",
          label: "API Keys & Provider Vault",
          icon: Key,
          path: "/ai-core/api-keys",
        },
        {
          id: "models",
          label: "Model Routing & Fallbacks",
          icon: Workflow,
          path: "/ai-core/models",
        },
      ],
    },
    {
      name: "Operations & Costs",
      items: [
        {
          id: "tokens",
          label: "Tokens by Model & Key",
          icon: Cpu,
          path: "/ai-core/tokens",
        },
        {
          id: "charts",
          label: "Peak Usage & Rate Charts",
          icon: TrendingUp,
          path: "/ai-core/charts",
        },
        {
          id: "analytics",
          label: "AI Analytics & Ledger",
          icon: BarChart3,
          path: "/ai-core/analytics",
        },
        {
          id: "billing",
          label: "Billing & Credit Wallet",
          icon: CreditCard,
          path: "/ai-core/billing",
        },
      ],
    },
    {
      name: "Governance & Safety",
      items: [
        {
          id: "safety_quotas",
          label: "Safety & Quota Limits",
          icon: ShieldCheck,
          path: "/ai-core/safety-quotas",
        },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/ai-core") {
      return (
        currentPath === "/ai-core" ||
        currentPath === "/ai-core/" ||
        currentPath === "/ai-core/overview"
      );
    }
    return (
      currentPath === path ||
      currentPath.startsWith(path + "?") ||
      currentPath.startsWith(path + "/")
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-neutral-950/85 backdrop-blur-3xl border-r border-white/10 shadow-[8px_0_32px_rgba(0,0,0,0.45)]">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-900/80 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 opacity-40 blur-sm group-hover:opacity-75 transition-opacity" />
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              className="relative h-10 w-10 rounded-full border border-purple-500/30 shrink-0 object-cover bg-black"
              alt="Sonikoma Logo"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white font-sans">
                AI Core Suite
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md font-mono">
                MULTI-AI
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans tracking-wide">
              Neural Orchestrator
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
          title="Close sidebar drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Project Widget in AICoreSidebar */}
      <div className="px-4 pt-3">
        <ActiveProjectSidebarWidget
          setDrawerOpen={(open) =>
            useProjectStore.getState().setDrawerOpen(open)
          }
        />
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group, groupIdx) => (
          <div key={group.name} className="space-y-2.5">
            {groupIdx > 0 && (
              <div className="w-full flex flex-col pt-1">
                <div className="w-8 h-[1px] bg-neutral-800 rounded-full mb-2 ml-3" />
              </div>
            )}
            <h4 className="px-3 text-[9px] font-black text-purple-400/50 uppercase tracking-[0.25em] font-mono">
              {group.name}
            </h4>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);

                return (
                  <li key={item.id} className="relative">
                    {/* Premium Active Side Indicator */}
                    <div
                      className={`absolute left-2 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                        active
                          ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] opacity-100"
                          : "h-0 bg-transparent opacity-0"
                      }`}
                    />

                    <button
                      onClick={() => {
                        navigateTo(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between gap-3.5 px-4 py-2.5 rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-purple-500/10 text-neutral-100 shadow-[inset_0_0_16px_rgba(168,85,247,0.08)] border border-purple-500/20"
                          : "text-neutral-500 hover:text-neutral-250 hover:bg-neutral-900 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${
                            active
                              ? "text-purple-400"
                              : "text-neutral-500 group-hover:scale-110 group-hover:text-neutral-400"
                          }`}
                        />
                        <span className="text-xs font-bold tracking-wide font-sans">
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

      {/* Footer Info Pill */}
      <div className="p-4 border-t border-neutral-900 shrink-0 bg-neutral-950/40">
        <button
          onClick={() => {
            navigateTo("/creative-suite");
            onClose();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>Creative Suite</span>
          </span>
          <span className="text-[10px] text-neutral-500 font-bold">Return →</span>
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
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-80 transform transition-transform duration-300 ease-out shadow-2xl ${
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
