import React, { useState } from "react";
import { Search, Filter, Maximize2, X, Check, Play, Pause, Star, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// ── Root Layout Container ───────────────────────────────────────────────────
export const WorkspaceLayoutRoot: React.FC<WorkspaceLayoutProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`h-full w-full flex flex-col bg-gradient-to-b from-[#0e0c1a] via-[#0a0814] to-[#06050c] text-white select-none overflow-hidden backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
};

// ── Header Block ─────────────────────────────────────────────────────────────
interface HeaderProps {
  title: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
  onToggleFavorite?: (starred: boolean) => void;
}
export const WorkspaceLayoutHeader: React.FC<HeaderProps> = ({
  title,
  isExpanded,
  onToggleExpand,
  onClose,
  onToggleFavorite,
}) => {
  const [isStarred, setIsStarred] = useState(false);

  return (
    <div className="px-3.5 py-2.5 border-b border-purple-900/20 bg-neutral-950/70 backdrop-blur-md flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">{title}</h2>
        <button
          onClick={() => {
            const next = !isStarred;
            setIsStarred(next);
            if (onToggleFavorite) onToggleFavorite(next);
          }}
          title={isStarred ? "Remove from Favorites" : "Add to Favorites"}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Star
            className={`h-3.5 w-3.5 transition-all ${
              isStarred ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" : "text-neutral-500 hover:text-amber-300"
            }`}
          />
        </button>
      </div>
      <div className="flex items-center gap-1">
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            title={isExpanded ? "Collapse panel" : "Expand panel"}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Tabs Bar Block ───────────────────────────────────────────────────────────
interface TabsProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
}
export const WorkspaceLayoutTabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onSelectTab,
}) => {
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = React.useState(false);
  const [showRight, setShowRight] = React.useState(true);

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeft(scrollLeft > 5);
      setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  React.useEffect(() => {
    checkScroll();
    const el = tabsRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [tabs]);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const amount = direction === "left" ? -140 : 140;
      tabsRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="shrink-0 bg-[#0a0814]/95 backdrop-blur-md border-b border-purple-900/30 flex items-center px-2 py-1.5 min-w-0 gap-1 overflow-hidden">
      {/* Scroll Left Button */}
      {showLeft && (
        <button
          onClick={() => scrollTabs("left")}
          title="Scroll left"
          className="shrink-0 h-6 w-6 rounded-full bg-neutral-900/90 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-600 hover:border-purple-400 hover:shadow-[0_0_10px_rgba(168,85,247,0.6)] transition-all cursor-pointer flex items-center justify-center active:scale-90 shadow-md"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Tabs Container (flex-1 min-w-0 handles tab overflow within bounds) */}
      <div
        ref={tabsRef}
        onScroll={checkScroll}
        className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth py-0.5"
      >
        {tabs.map((tab) => {
          const isActive = activeTab.toLowerCase() === tab.toLowerCase();
          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`relative px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? "bg-gradient-to-r from-purple-600/50 to-indigo-600/50 text-white border border-purple-400/80 shadow-[0_0_14px_rgba(168,85,247,0.5)]"
                  : "bg-neutral-900/50 text-neutral-400 border border-neutral-800/80 hover:text-white hover:bg-white/10 hover:border-neutral-700"
              }`}
            >
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-purple-300 shadow-[0_0_6px_rgba(216,180,254,1)] animate-pulse" />
              )}
              <span>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button (">" arrow icon) */}
      {showRight && (
        <button
          onClick={() => scrollTabs("right")}
          title="Scroll right"
          className="shrink-0 h-6 w-6 rounded-full bg-neutral-900/90 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-600 hover:border-purple-400 hover:shadow-[0_0_10px_rgba(168,85,247,0.6)] transition-all cursor-pointer flex items-center justify-center active:scale-90 shadow-md"
        >
          <ChevronRight className="h-3.5 w-3.5 drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]" />
        </button>
      )}
    </div>
  );
};

// ── Search Bar Block ─────────────────────────────────────────────────────────
interface SearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
}
export const WorkspaceLayoutSearch: React.FC<SearchProps> = ({
  value,
  onChange,
  placeholder = "Search assets...",
  onFilterClick,
}) => {
  return (
    <div className="px-3 py-2 bg-neutral-950/70 border-b border-purple-900/25 flex items-center gap-2 shrink-0">
      <div className="flex-1 relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#120f24]/90 border border-neutral-800/90 focus:border-purple-500/80 focus:shadow-[0_0_14px_rgba(168,85,247,0.3)] text-[11px] text-white rounded-2xl pl-8 pr-3 py-1.5 outline-none transition-all placeholder:text-neutral-500 font-mono tracking-tight"
        />
        <Search className="h-3.5 w-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
      </div>
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          title="Filter options"
          className="p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-purple-500/50 transition-colors cursor-pointer shrink-0"
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

// ── Prompt Box Block (For AI Workspace) ──────────────────────────────────────
interface PromptBoxProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}
export const WorkspaceLayoutPromptBox: React.FC<PromptBoxProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe prompt...",
}) => {
  return (
    <div className="p-3 bg-gradient-to-br from-purple-950/30 via-indigo-950/20 to-black/40 border-b border-purple-900/40 flex flex-col gap-2 shrink-0">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full bg-neutral-900/90 border border-neutral-800 text-xs text-white rounded-xl p-2.5 outline-none focus:border-purple-500 transition-all resize-none font-mono shadow-inner"
      />
      <button
        onClick={onSubmit}
        className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold border border-purple-400/40 shadow-[0_4px_14px_rgba(168,85,247,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
      >
        <Sparkles className="h-3.5 w-3.5 text-purple-200" />
        <span>Generate AI Output</span>
      </button>
    </div>
  );
};

// ── Content Area Block ───────────────────────────────────────────────────────
export const WorkspaceLayoutContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex-1 min-h-0 relative overflow-y-auto p-3 space-y-3 [scrollbar-width:none]">
      {children}
    </div>
  );
};

// ── Footer Block ─────────────────────────────────────────────────────────────
export const WorkspaceLayoutFooter: React.FC<{ text?: string }> = ({
  text = "Powered by Sonikoma Comic Studio Engine",
}) => {
  return (
    <div className="p-2 border-t border-purple-900/20 bg-neutral-950/80 text-center text-[9px] text-neutral-500 shrink-0 font-mono tracking-wide">
      <span>{text}</span>
    </div>
  );
};

// ── Composable Export ────────────────────────────────────────────────────────
export const WorkspaceLayout = Object.assign(WorkspaceLayoutRoot, {
  Header: WorkspaceLayoutHeader,
  Tabs: WorkspaceLayoutTabs,
  Search: WorkspaceLayoutSearch,
  PromptBox: WorkspaceLayoutPromptBox,
  Content: WorkspaceLayoutContent,
  Footer: WorkspaceLayoutFooter,
});
