import React from "react";
import { X, AlertTriangle } from "lucide-react";

export interface AdminUserEditModalProps {
  user: any;
  originalUser?: any;
  justificationReason: string;
  onUserChange: (updated: any) => void;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({
  user,
  originalUser,
  justificationReason,
  onUserChange,
  onReasonChange,
  onClose,
  onSave,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-white mb-4">Edit User Account</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Email</label>
            <input
              type="text"
              disabled
              value={user.email}
              className="w-full bg-[#181818] border border-[#2F2F2F] rounded-xl p-2.5 text-neutral-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1">
              Platform Role
            </label>
            <select
              value={user.creator_role || "free"}
              onChange={(e) =>
                onUserChange({ ...user, creator_role: e.target.value })
              }
              className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl p-2.5 text-white text-sm focus:border-neutral-600 outline-none"
            >
              <option value="free">Free Creator</option>
              <option value="creator">Verified Creator</option>
              <option value="studio">Studio Pro</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1">
              Balance Credits
            </label>
            <input
              type="number"
              value={user.credits || 0}
              onChange={(e) =>
                onUserChange({
                  ...user,
                  credits: parseInt(e.target.value) || 0,
                })
              }
              className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl p-2.5 text-white text-sm focus:border-neutral-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="lockAccountCheck"
              checked={user.is_locked || false}
              onChange={(e) =>
                onUserChange({
                  ...user,
                  is_locked: e.target.checked,
                })
              }
              className="rounded border-neutral-800 bg-neutral-900 cursor-pointer"
            />
            <label
              htmlFor="lockAccountCheck"
              className="text-sm text-neutral-300 cursor-pointer select-none"
            >
              Lock Account / Suspend Access
            </label>
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <label className="text-xs text-neutral-400 block mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Justification / Reason (Audit Log)
            </label>
            <textarea
              value={justificationReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Reason for change (required for sensitive role/credit updates)..."
              className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl p-2.5 text-white text-sm h-20 focus:border-neutral-600 outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="btn-primary flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserEditModal;
