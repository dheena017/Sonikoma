import React from "react";
import { ShieldCheck, Clock } from "lucide-react";
import { formatDate } from "../utils/adminFormatters";

export interface AdminDashboardAuditEventsProps {
  logs: any[];
}

export const AdminDashboardAuditEvents: React.FC<AdminDashboardAuditEventsProps> = ({
  logs,
}) => {
  return (
    <div className="self-start h-fit bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 flex flex-col justify-between shadow-xl text-left">
      <div>
        <h3 className="text-md font-extrabold text-[#E5E5E5] mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#3B82F6]" /> Security Audit
          Events
        </h3>
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#6B7280] italic">
              No security audit events logs found.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-[#181818] border border-[#2F2F2F] rounded-xl flex items-start justify-between text-xs hover:border-neutral-700 transition-all gap-2"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-bold text-[#E5E5E5] text-xs">
                    {log.action}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF]">
                    {log.email || "System"} · {log.ip_address}
                  </div>
                  <div className="text-[9px] text-[#6B7280] font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 inline" />
                    {formatDate(log.created_at)}
                  </div>
                </div>
                <span
                  className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    log.status === "Success"
                      ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                      : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardAuditEvents;
