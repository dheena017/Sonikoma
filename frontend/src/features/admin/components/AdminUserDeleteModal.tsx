import React from "react";
import { ShieldAlert } from "lucide-react";

export interface AdminUserDeleteModalProps {
  user: any;
  justificationReason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const AdminUserDeleteModal: React.FC<AdminUserDeleteModalProps> = ({
  user,
  justificationReason,
  onReasonChange,
  onClose,
  onConfirm,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141414] border border-[#EF4444]/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-[#EF4444] mb-4">
          <ShieldAlert className="w-6 h-6" />
          <h3 className="font-bold text-white text-lg">Delete User Account?</h3>
        </div>
        <p className="text-sm text-[#9CA3AF] mb-6">
          Are you sure you want to permanently delete{" "}
          <strong className="text-white">{user.email}</strong>? All associated
          assets, storyboards, and history will be purged. This action cannot be
          undone.
        </p>

        <div className="mb-6">
          <label className="text-xs text-[#9CA3AF] block mb-1">
            Audit Reason / Ticket #
          </label>
          <textarea
            value={justificationReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Security ticket # or deletion justification..."
            className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl p-2.5 text-white text-sm h-16 focus:border-[#EF4444] outline-none resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDeleteModal;
