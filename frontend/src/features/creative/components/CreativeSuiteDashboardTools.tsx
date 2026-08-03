import React from "react";
import { ArrowRight, Lock } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface CreativeSuiteDashboardTool {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  path: string;
  requiresPanels: boolean;
  badge: string;
}

interface CreativeSuiteDashboardToolsProps {
  tools: CreativeSuiteDashboardTool[];
  activePanelsCount: number;
  navigateTo: (path: string) => void;
}

const CreativeSuiteDashboardTools: React.FC<CreativeSuiteDashboardToolsProps> = ({
  tools,
  activePanelsCount,
  navigateTo,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isLocked = tool.requiresPanels && activePanelsCount === 0;

        return (
          <div
            key={tool.id}
            onClick={() => navigateTo(tool.path)}
            className={`bg-[#0c0a15] border border-[#1f1b2e] rounded-2xl p-5 hover:bg-[#120f21] hover:border-purple-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative shadow-md ${
              isLocked ? "opacity-75 hover:border-rose-900/40" : ""
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-[#151124] border border-[#25203b] rounded-xl text-neutral-400 group-hover:text-purple-300 group-hover:border-purple-500/30 transition-all">
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold bg-[#141122] px-2 py-0.5 rounded text-neutral-400 uppercase border border-[#241f38]">
                    {tool.badge}
                  </span>

                  {isLocked && (
                    <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> LCK
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                {tool.label}
              </h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed font-mono">
                {tool.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1b172b] flex justify-end">
              <button
                className={`text-[10px] font-bold font-mono tracking-wider uppercase flex items-center gap-1 transition-all ${
                  isLocked
                    ? "text-neutral-500 group-hover:text-rose-400"
                    : "text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1"
                }`}
              >
                <span>{isLocked ? "Open Locker" : "Launch"}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CreativeSuiteDashboardTools;
