import React from "react";
import { Search, Keyboard, Navigation, Settings, Play, Layers, Image as ImageIcon } from "lucide-react";
import { Category } from "./shortcutTypes";
import { categoryOptions } from "./shortcutUtils";

interface ShortcutSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

interface ShortcutCategoryTabsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const iconMap: Record<Category, React.ReactNode> = {
  all: <Keyboard className="h-4 w-4" />,
  nav: <Navigation className="h-4 w-4" />,
  trigger: <Settings className="h-4 w-4" />,
  playback: <Play className="h-4 w-4" />,
  editor: <Layers className="h-4 w-4" />,
  deck: <ImageIcon className="h-4 w-4" />,
};

const labelMap: Record<Category, string> = {
  all: "All",
  nav: "Navigation",
  trigger: "Trigger",
  playback: "Playback",
  editor: "Editor",
  deck: "Gallery",
};

export function ShortcutSearch({ searchQuery, onSearchChange }: ShortcutSearchProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-500" />
      <input
        type="text"
        placeholder="Search shortcuts (e.g. 'Zoom', 'Dashboard', 'Alt+S')..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-neutral-200 outline-none transition-all placeholder:text-neutral-600 shadow-inner"
      />
    </div>
  );
}

export function ShortcutCategoryTabs({ activeCategory, onCategoryChange }: ShortcutCategoryTabsProps) {
  return (
    <div className="w-full md:w-56 shrink-0 flex flex-col gap-1.5">
      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-3 mb-2 font-mono">
        Command Groups
      </p>
      {categoryOptions.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${
            activeCategory === cat
              ? "bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold"
              : "text-neutral-450 hover:text-neutral-300 hover:bg-neutral-900/50"
          }`}
        >
          {iconMap[cat]}
          <span className="capitalize">{labelMap[cat]}</span>
        </button>
      ))}
    </div>
  );
}
