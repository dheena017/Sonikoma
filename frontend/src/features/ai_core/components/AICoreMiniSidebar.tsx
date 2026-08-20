import React, { useState } from "react";
import {
  LayoutGrid,
  Key,
  BarChart3,
  CreditCard,
  Workflow,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Activity,
  Zap,
  Cpu,
  TrendingUp,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

interface AICoreMiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  onOpenSidebar?: () => void;
}

const AICoreMiniSidebarInner: React.FC<AICoreMiniSidebarProps> = ({
  currentPath,
  navigateTo,
  onOpenSidebar,
}) => {
  const groups = [
    {
      name: "Hub",
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
      name: "Engines",
      items: [
        {
          id: "api_keys",
          label: "API Keys & Providers",
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
      name: "Costs",
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
      name: "Gov",
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

  const SidebarItem: React.FC<{ item: any }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const active = isActive(item.path);
    const Icon = item.icon;

    const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      setRect(e.currentTarget.getBoundingClientRect());
      setHover(true);
    };

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Active side indicator */}
        <div
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 ${
            active
              ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => navigateTo(item.path)}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setHover(false)}
          className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95"
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              active
                ? "bg-purple-550/20 border border-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                : "bg-neutral-900 border border-neutral-800 group-hover:bg-purple-500/10 group-hover:border-purple-500/20"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-300 ${
                active
                  ? "text-purple-400"
                  : "text-neutral-400 group-hover:text-purple-300"
              }`}
            />
          </div>
        </button>
        <TooltipPortal
          text={item.label}
          visible={hover}
          anchorRect={rect}
        />
      </div>
    );
  };

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-20 bg-[#070709] border-r border-neutral-900 hidden lg:flex flex-col items-center py-4 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.3)] select-none overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-2"
          >
            {/* Section divider + label */}
            <div
              className="w-full flex flex-col items-center"
              style={{
                marginTop: groupIdx > 0 ? "0.5rem" : "0",
                marginBottom: "0.375rem",
              }}
            >
              {groupIdx > 0 && (
                <div className="w-8 h-[1px] bg-neutral-700/60 rounded-full mb-1.5" />
              )}
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-purple-400/80 font-mono select-none text-center w-full truncate whitespace-nowrap overflow-hidden px-1 drop-shadow-sm">
                {group.name}
              </span>
            </div>

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Return to Creative Suite / App Dashboard */}
      <div className="mt-auto pt-4 flex justify-center w-full pb-2 border-t border-neutral-900">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/creative-suite")}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white transition-all shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] active:scale-90 border border-purple-400/30 cursor-pointer"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0" />
          </button>

          <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-x-2 group-hover:translate-x-0 bg-neutral-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl font-medium tracking-wide">
            Creative Suite
          </div>
        </div>
      </div>
    </aside>
  );
};

const AICoreMiniSidebar = React.memo(AICoreMiniSidebarInner);
export default AICoreMiniSidebar;
