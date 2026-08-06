import React, { useState } from "react";
import {
  FolderKanban,
  Film,
  Subtitles,
  Music,
  Box,
  Layers,
  Sparkles,
  Wand2,
  Settings,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

interface VideoEditorMiniSidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onBackToApp?: () => void;
}

const navGroups = [
  {
    name: "Media",
    items: [
      { id: "project", label: "Project", icon: FolderKanban },
      { id: "scenes", label: "Scenes", icon: Film },
    ],
  },
  {
    name: "Audio",
    items: [
      { id: "subtitles", label: "Subtitles", icon: Subtitles },
      { id: "audio", label: "Audio Track", icon: Music },
    ],
  },
  {
    name: "VFX",
    items: [
      { id: "elements", label: "Elements", icon: Box },
      { id: "transitions", label: "Transitions", icon: Layers },
      { id: "effects", label: "FX & Filters", icon: Sparkles },
    ],
  },
  {
    name: "AI",
    items: [{ id: "ai-tools", label: "AI Suite", icon: Wand2 }],
  },
];

const bottomNavItems = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help & Keys", icon: HelpCircle },
];

const VideoEditorMiniSidebar: React.FC<VideoEditorMiniSidebarProps> = ({
  activeNav,
  setActiveNav,
  onBackToApp,
}) => {
  const SidebarItem: React.FC<{ item: any }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const isActive = activeNav === item.id;
    const Icon = item.icon;

    const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      setRect(e.currentTarget.getBoundingClientRect());
      setHover(true);
    };

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Floating Active Pill */}
        <div
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
            isActive
              ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => setActiveNav(item.id)}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setHover(false)}
          className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95"
        >
          {/* iOS-style icon pill */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              isActive
                ? "bg-purple-500/20 border border-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                : "bg-neutral-900 border border-neutral-800 group-hover:bg-purple-500/10 group-hover:border-purple-500/20"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-300 ${
                isActive ? "text-purple-400" : "text-neutral-400 group-hover:text-purple-300"
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

  return (
    <aside className="w-20 shrink-0 bg-neutral-950/90 backdrop-blur-xl border-r border-neutral-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.3)] flex flex-col items-center py-3 z-30 select-none h-full overflow-hidden">
      {/* Scrollable Nav Items */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 mini-sidebar-scrollbar pt-1">
        {navGroups.map((group, groupIdx) => (
          <div key={group.name} className="w-full flex flex-col items-center pb-2">
            {/* Group Label */}
            <div
              className="w-full flex flex-col items-center"
              style={{ marginTop: groupIdx > 0 ? "0.5rem" : "0", marginBottom: "0.375rem" }}
            >
              {groupIdx > 0 && <div className="w-8 h-[1px] bg-neutral-800/80 rounded-full mb-1.5" />}
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400 font-mono select-none text-center w-full truncate whitespace-nowrap overflow-hidden px-1 drop-shadow-sm">
                {group.name}
              </span>
            </div>

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}

        {/* Preferences / Help Group */}
        <div className="w-full flex flex-col items-center pb-2">
          <div className="w-full flex flex-col items-center mt-2 mb-1.5">
            <div className="w-8 h-[1px] bg-neutral-800/80 rounded-full mb-1.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400 font-mono select-none text-center w-full truncate whitespace-nowrap overflow-hidden px-1 drop-shadow-sm">
              System
            </span>
          </div>
          {bottomNavItems.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Return to Manga CTA Button */}
      <div className="mt-auto pt-3 flex justify-center w-full pb-1 border-t border-neutral-800/60">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => onBackToApp?.()}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white transition-all shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] active:scale-90 border border-purple-400/30 cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
          </button>
          <TooltipPortal text="Return to Storyboard" visible={returnHover} anchorRect={returnRect} />
        </div>
      </div>
    </aside>
  );
};

export default React.memo(VideoEditorMiniSidebar);
