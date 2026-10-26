import React from "react";
import { Users, Search, ArrowRight } from "lucide-react";
import { formatDate } from "../utils/adminFormatters";

export interface AdminDashboardUsersProps {
  users: any[];
  search: string;
  loading: boolean;
  onSearchChange: (val: string) => void;
  onImpersonate: (userId: string) => void;
}

export const AdminDashboardUsers: React.FC<AdminDashboardUsersProps> = ({
  users,
  search,
  loading,
  onSearchChange,
  onImpersonate,
}) => {
  return (
    <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-xl text-left">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-md font-extrabold text-[#E5E5E5] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3B82F6]" /> Active Platform
            Creators
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name, handle, or email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] placeholder-[#6B7280] focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-6 text-xs text-[#9CA3AF]">
              Loading creators...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#6B7280] italic">
              No matching creators found.
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="p-3 bg-[#181818] border border-[#2F2F2F] rounded-xl flex items-center justify-between text-xs hover:border-neutral-700 transition-all gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[#E5E5E5] truncate">
                    {u.full_name || u.username || "Anonymous Creator"}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] truncate">
                    {u.email}
                  </div>
                  <div className="text-[9px] text-[#6B7280] font-mono mt-0.5">
                    Joined {formatDate(u.created_at)}
                  </div>
                </div>
                <button
                  onClick={() => onImpersonate(u.id)}
                  className="btn-secondary flex-shrink-0 flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-[#3B82F6] hover:text-white border-[#3B82F6]/30 hover:bg-[#3B82F6]/10 rounded-lg cursor-pointer"
                >
                  Impersonate <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardUsers;
