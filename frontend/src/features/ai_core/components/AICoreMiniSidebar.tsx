import React, { useState } from "react";
import {
  Menu,
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
      name: "Studio",
      items: [
        {
          id: "overview",
          label: "AI Command Center",
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
      name: "Engines",
      items: [
        {
          id: "api_keys",
          label: "API Keys & Providers",
          icon: Key,
          path: "/ai-core/api-keys",
        },
        {
          id: "rate_limits",
          label: "Rate Limits & Quotas",
          icon: ShieldCheck,
          path: "/ai-core/rate-limits",
        },
      ],
    },
    {
      name: "Usage",
      items: [
        {
          id: "usage",
          label: "AI Token Analytics",
          icon: TrendingUp,
          path: "/ai-core/analytics",
        },
        {
          id: "wallet",
          label: "Billing & Credits",
          icon: CreditCard,
          path: "/ai-core/billing",
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
        {/* Left edge active indicator bar */}
        <div
          className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
            active
              ? "h-5 bg-[#3B82F6]  opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => navigateTo(item.path)}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setHover(false)}
          aria-label={item.label}
          className="p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none"
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm ${
              active
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white scale-105"
                : "bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-[#3B82F6] group-hover:text-white"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-200 ${
                active ? "text-white" : "text-[#9CA3AF] group-hover:text-[#3B82F6]"
              }`}
            />
          </div>
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);
  const [menuHover, setMenuHover] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-20 bg-[#121212] border-r border-[#2F2F2F] hidden lg:flex flex-col items-center py-3 z-40 shadow-xl select-none overflow-hidden">
      {/* Navigation Groups */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
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
              <span className="text-[8.5px] font-mono font-black uppercase tracking-[0.2em] text-[#3B82F6] select-none text-center w-full px-1">
                {group.name}
              </span>
            </div>

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Return to Creative Suite */}
      <div className="mt-auto pt-3 flex justify-center w-full pb-2 border-t border-[#2F2F2F] shrink-0">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/creative-suite")}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            aria-label="Creative Suite"
            className="w-11 h-11 rounded-2xl bg-[#1E1E1E] hover:bg-[#2A2A2A] text-neutral-400 hover:text-[#3B82F6] transition-all active:scale-90 border border-[#2F2F2F] hover:border-[#3B82F6] cursor-pointer flex items-center justify-center"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0" />
          </button>
          <TooltipPortal
            text="Creative Suite"
            visible={returnHover}
            anchorRect={returnRect}
          />
        </div>
      </div>
    </aside>
  );
};

const AICoreMiniSidebar = React.memo(AICoreMiniSidebarInner);
export default AICoreMiniSidebar;
