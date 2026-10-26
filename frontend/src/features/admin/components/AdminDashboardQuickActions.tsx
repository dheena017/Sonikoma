import React from "react";
import { Zap, Download, Activity } from "lucide-react";

export interface AdminDashboardQuickActionsProps {
  onExportLogs: () => void;
  navigateTo: (path: string) => void;
}

export const AdminDashboardQuickActions: React.FC<AdminDashboardQuickActionsProps> = ({
  onExportLogs,
  navigateTo,
}) => {
  return (
    <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 lg:col-span-2 shadow-xl text-left">
      <h3 className="text-md font-extrabold text-[#E5E5E5] mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#3B82F6]" /> Executive Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onExportLogs}
          className="p-4 border border-[#2F2F2F] bg-[#181818] rounded-xl hover:border-neutral-700 hover:bg-[#3B82F6]/5 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-[#E5E5E5] font-bold text-xs group-hover:text-[#3B82F6] transition-colors">
              Export Audit Log CSV
            </h4>
            <Download className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#3B82F6]" />
          </div>
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            Download the complete security audit events history as a file.
          </p>
        </button>

        <button
          onClick={() => navigateTo("/admin/jobs")}
          className="p-4 border border-[#2F2F2F] bg-[#181818] rounded-xl hover:border-neutral-700 hover:bg-[#3B82F6]/5 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-[#E5E5E5] font-bold text-xs group-hover:text-[#3B82F6] transition-colors">
              Manage Background Jobs
            </h4>
            <Activity className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#3B82F6]" />
          </div>
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            Monitor live tasks, cancel queued workers, and purge completed jobs.
          </p>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboardQuickActions;
