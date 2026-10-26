import React from "react";
import { Coins } from "lucide-react";

export interface AdminUserGrantCreditsModalProps {
  user: any;
  amount: number;
  reason: string;
  isGranting: boolean;
  onAmountChange: (amount: number) => void;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const AdminUserGrantCreditsModal: React.FC<AdminUserGrantCreditsModalProps> = ({
  user,
  amount,
  reason,
  isGranting,
  onAmountChange,
  onReasonChange,
  onClose,
  onSubmit,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-[#3B82F6] mb-4">
          <Coins className="w-6 h-6" />
          <h3 className="font-bold text-white text-lg">Grant / Adjust Credits</h3>
        </div>
        <p className="text-sm text-[#9CA3AF] mb-4">
          Adjust credits for{" "}
          <strong className="text-white">{user.email}</strong>. Use positive
          numbers to add, or negative numbers to deduct.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] block mb-1">
              Credit Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(parseInt(e.target.value) || 0)}
              className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl p-2.5 text-white text-sm focus:border-neutral-600 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#9CA3AF] block mb-1">
              Reason / Justification
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Reason for manual adjustment (e.g. VIP top-up, compensation)..."
              className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl p-2.5 text-white text-sm h-20 focus:border-neutral-600 outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            disabled={isGranting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="btn-primary flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer"
            disabled={isGranting}
          >
            {isGranting ? "Updating..." : "Grant Credits"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserGrantCreditsModal;
