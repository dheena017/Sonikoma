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

const CreativeSuiteDashboardTools: React.FC<
  CreativeSuiteDashboardToolsProps
> = ({ tools, activePanelsCount, navigateTo }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isLocked = tool.requiresPanels && activePanelsCount === 0;

        return (
          <div
            key={tool.id}
            onClick={() => navigateTo(tool.path)}
            className={`bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-5 hover:border-[#3B82F6]/60 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group relative shadow-md ${
              isLocked ? "opacity-75 hover:border-[#EF4444]/40" : ""
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-[#9CA3AF] group-hover:text-[#3B82F6] group-hover:border-[#3B82F6]/40 group-hover:bg-[#3B82F6]/10 transition-all shadow-inner">
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold bg-[#121212] px-2.5 py-0.5 rounded-md text-[#9CA3AF] uppercase border border-[#2F2F2F]">
                    {tool.badge}
                  </span>

                  {isLocked && (
                    <span className="text-[9px] font-mono font-bold bg-[#EF4444]/10 text-[#EF4444] px-2 py-0.5 rounded-md border border-[#EF4444]/25 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> LCK
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-black text-[#E5E5E5] group-hover:text-[#3B82F6] transition-colors">
                {tool.label}
              </h4>
              <p className="text-[11px] text-[#9CA3AF] mt-1 leading-relaxed font-sans">
                {tool.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#2F2F2F] flex justify-end">
              <button
                className={`text-[10px] font-bold font-mono tracking-wider uppercase flex items-center gap-1 transition-all ${
                  isLocked
                    ? "text-[#6B7280] group-hover:text-[#EF4444]"
                    : "text-[#3B82F6] group-hover:text-[#00FFFF] group-hover:translate-x-1"
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
