import React from "react";
import { Search, Filter, Maximize2, X, Check, Play, Pause } from "lucide-react";

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
      className={`h-full w-full flex flex-col bg-[#0c0c12] text-white select-none overflow-hidden ${className}`}
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
}
export const WorkspaceLayoutHeader: React.FC<HeaderProps> = ({
  title,
  isExpanded,
  onToggleExpand,
  onClose,
}) => {
  return (
    <div className="p-3 border-b border-neutral-800/70 bg-[#09090f] flex items-center justify-between shrink-0">
      <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
      <div className="flex items-center gap-1.5">
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            title={isExpanded ? "Collapse panel" : "Expand panel"}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
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
  return (
    <div className="px-3 border-b border-neutral-800/70 flex items-center gap-4 overflow-x-auto [scrollbar-width:none] shrink-0 bg-[#09090f] text-xs font-semibold">
      {tabs.map((tab) => {
        const isActive = activeTab.toLowerCase() === tab.toLowerCase();
        return (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            className={`py-2 relative transition-all whitespace-nowrap cursor-pointer ${
              isActive ? "text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span>{tab}</span>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full animate-fade-in" />
            )}
          </button>
        );
      })}
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
  placeholder = "Search...",
  onFilterClick,
}) => {
  return (
    <div className="p-3 bg-[#09090f] border-b border-neutral-800/60 flex items-center gap-2 shrink-0">
      <div className="flex-1 relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded-full pl-9 pr-3 py-2 outline-none focus:border-purple-500 transition-all placeholder:text-neutral-500"
        />
        <Search className="h-4 w-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          title="Filter options"
          className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-purple-500/50 transition-colors cursor-pointer shrink-0"
        >
          <Filter className="h-4 w-4" />
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
    <div className="p-3 bg-purple-950/20 border-b border-purple-900/30 flex flex-col gap-2 shrink-0">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl p-2.5 outline-none focus:border-purple-500 transition-all resize-none"
      />
      <button
        onClick={onSubmit}
        className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold border border-purple-400/40 shadow transition-all cursor-pointer"
      >
        Generate AI Output
      </button>
    </div>
  );
};

// ── Content Area Block ───────────────────────────────────────────────────────
export const WorkspaceLayoutContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex-1 min-h-0 relative overflow-y-auto p-3 space-y-4 [scrollbar-width:none]">
      {children}
    </div>
  );
};

// ── Footer Block ─────────────────────────────────────────────────────────────
export const WorkspaceLayoutFooter: React.FC<{ text?: string }> = ({
  text = "Powered by Sonikoma Comic Studio Engine",
}) => {
  return (
    <div className="p-2 border-t border-neutral-800/60 bg-[#09090f] text-center text-[10px] text-neutral-500 shrink-0 font-sans">
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
