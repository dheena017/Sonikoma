import React from "react";
import { History, X } from "lucide-react";
import { formatDate } from "../utils/adminFormatters";

export interface AdminUserLogsModalProps {
  user: any;
  logs: any[];
  loading: boolean;
  onClose: () => void;
}

export const AdminUserLogsModal: React.FC<AdminUserLogsModalProps> = ({
  user,
  logs,
  loading,
  onClose,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111115] border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#3B82F6]" /> Logs for{" "}
            <span className="text-[#3B82F6]">{user.email}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="text-center p-8 text-xs text-neutral-500 font-mono">
              Loading security logs...
            </p>
          ) : logs.length === 0 ? (
            <p className="text-center p-8 text-xs text-neutral-600 font-mono italic">
              No activity logs recorded for this account.
            </p>
          ) : (
            logs.map((l) => (
              <div
                key={l.id}
                className="text-xs font-mono p-3 bg-black/30 rounded-xl border border-neutral-800 flex justify-between items-center gap-2"
              >
                <span className="text-neutral-300 font-bold">{l.action}</span>
                <span className="text-neutral-500 text-[10px]">
                  {formatDate(l.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserLogsModal;
