import React from "react";
import { ArrowRight, Plus, RefreshCw, Sparkles } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface CreativeSuiteDashboardQuickAction {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  path: string;
  disabled?: boolean;
}

interface CreativeSuiteDashboardQuickActionsProps {
  actions: CreativeSuiteDashboardQuickAction[];
  navigateTo: (path: string) => void;
}

const CreativeSuiteDashboardQuickActions: React.FC<CreativeSuiteDashboardQuickActionsProps> = ({
  actions,
  navigateTo,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => !action.disabled && navigateTo(action.path)}
            disabled={action.disabled}
            className={`group relative rounded-2xl border p-4 text-left transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${
              action.disabled
                ? "border-[#1f1b2e] bg-[#0c0a15] text-neutral-500 cursor-not-allowed"
                : "border-[#2f2644] bg-[#120f1f] hover:border-purple-500/40 hover:bg-[#180f2f]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-2xl bg-[#1d1737] p-3 text-purple-300">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
                Quick
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                {action.label}
              </h4>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
                {action.desc}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] font-bold text-purple-300">
              <span>{action.disabled ? "Locked" : "Launch"}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            {action.disabled && (
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/40" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CreativeSuiteDashboardQuickActions;
