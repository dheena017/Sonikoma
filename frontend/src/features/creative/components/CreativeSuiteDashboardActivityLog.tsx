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

const CreativeSuiteDashboardActivityLog: React.FC<CreativeSuiteDashboardActivityLogProps> = ({
  activities,
}) => {
  return (
    <div className="bg-[#0c0a15] border border-[#1f1b2e] rounded-2xl p-6 shadow-md text-left">
      <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
        <Clock className="w-4 h-4" /> Creative Logs
      </h3>

      <div className="space-y-3.5">
        {activities.map((act, idx) => (
          <div key={idx} className="flex gap-3 text-xs leading-normal">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <div className="flex-1 min-w-0">
              <p className="text-neutral-300 font-medium text-[11px]">{act.text}</p>
              <span className="text-[9px] text-neutral-500 font-mono mt-0.5 block">{act.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreativeSuiteDashboardActivityLog;
