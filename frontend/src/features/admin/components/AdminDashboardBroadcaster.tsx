import React from "react";
import { Mail } from "lucide-react";

export interface AdminDashboardBroadcasterProps {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  processing: boolean;
  onTitleChange: (val: string) => void;
  onMessageChange: (val: string) => void;
  onTypeChange: (val: "info" | "warning" | "success" | "error") => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AdminDashboardBroadcaster: React.FC<AdminDashboardBroadcasterProps> = ({
  title,
  message,
  type,
  processing,
  onTitleChange,
  onMessageChange,
  onTypeChange,
  onSubmit,
}) => {
  return (
    <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 shadow-xl text-left">
      <h3 className="text-md font-extrabold text-[#E5E5E5] mb-4 flex items-center gap-2">
        <Mail className="w-4 h-4 text-[#3B82F6]" /> Push Broadcast
      </h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Headline/Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-3 py-2 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] placeholder-[#6B7280] focus:outline-none focus:border-neutral-600"
        />
        <textarea
          placeholder="Announcement message..."
          rows={2}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="w-full px-3 py-2 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] placeholder-[#6B7280] focus:outline-none focus:border-neutral-600 resize-none"
        />
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e: any) => onTypeChange(e.target.value)}
            className="px-2.5 py-1.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] focus:outline-none focus:border-neutral-600"
          >
            <option value="info">💡 Info</option>
            <option value="warning">⚠️ Warning</option>
            <option value="success">✅ Success</option>
            <option value="error">🚨 Alert</option>
          </select>
          <button
            type="submit"
            disabled={processing}
            className="btn-primary flex-1 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {processing ? "Broadcasting..." : "Publish Banner"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminDashboardBroadcaster;
