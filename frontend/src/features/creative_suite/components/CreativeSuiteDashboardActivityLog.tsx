import React from "react";
import { Clock } from "lucide-react";

interface CreativeSuiteDashboardActivity {
  time: string;
  text: string;
  type: string;
}

interface CreativeSuiteDashboardActivityLogProps {
  activities: CreativeSuiteDashboardActivity[];
}

const CreativeSuiteDashboardActivityLog: React.FC<
  CreativeSuiteDashboardActivityLogProps
> = ({ activities }) => {
  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 shadow-md hover:border-[#3B82F6]/40 transition-all duration-200 text-left">
      <h3 className="text-xs font-black text-[#3B82F6] uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
        <Clock className="w-4 h-4" /> Creative Logs
      </h3>

      <div className="space-y-3.5">
        {activities.map((act, idx) => (
          <div key={idx} className="flex gap-3 text-xs leading-normal">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[#E5E5E5] font-medium text-[11px]">
                {act.text}
              </p>
              <span className="text-[9px] text-[#6B7280] font-mono mt-0.5 block">
                {act.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreativeSuiteDashboardActivityLog;
