import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Ghost,
  History,
  Edit2,
  Trash2,
  Coins,
  Lock,
  Unlock,
  Shield,
} from "lucide-react";
import {
  AdminUserEditModal,
  AdminUserDeleteModal,
  AdminUserGrantCreditsModal,
  AdminUserLogsModal,
  AdminUsersBulkBar,
} from "../components";

export interface AdminUsersPageProps {
  fetchWithInterceptor: any;
  addNotification: any;
}

export function AdminUsersPage({
  fetchWithInterceptor,
  addNotification,
}: AdminUsersPageProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastActiveFilter, setLastActiveFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Modals state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [viewLogsUser, setViewLogsUser] = useState<any | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [justificationReason, setJustificationReason] = useState("");

  // Grant Credits Modal State
  const [grantCreditsUser, setGrantCreditsUser] = useState<any | null>(null);
  const [grantAmount, setGrantAmount] = useState<number>(100);
  const [grantReason, setGrantReason] = useState("");
  const [isGranting, setIsGranting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithInterceptor("/api/v1/auth/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const isSensitive =
      editingUser.is_locked !==
        users.find((u) => u.id === editingUser.id)?.is_locked ||
      editingUser.credits !==
        users.find((u) => u.id === editingUser.id)?.credits;

    if (isSensitive && !justificationReason.trim()) {
      addNotification(
        "Justification reason is required for sensitive changes",
        "warning"
      );
      return;
    }

    try {
      const res = await fetchWithInterceptor(
        `/api/v1/auth/admin/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creator_role: editingUser.creator_role,
            credits: editingUser.credits,
            is_locked: editingUser.is_locked,
            reason: justificationReason,
          }),
        }
      );
      if (res.ok) {
        setEditingUser(null);
        setJustificationReason("");
        addNotification("User updated successfully", "success");
        fetchUsers();
      }
    } catch (err) {
      addNotification("Failed to update user", "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    if (!justificationReason.trim()) {
      addNotification("Reason is required for deletion", "warning");
      return;
    }
    try {
      const res = await fetchWithInterceptor(
        `/api/v1/auth/admin/users/${deletingUser.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDeletingUser(null);
        setJustificationReason("");
        addNotification("User deleted permanently", "success");
        fetchUsers();
      }
    } catch (err) {
      addNotification("Failed to delete user", "error");
    }
  };

  const handleFetchLogs = async (user: any) => {
    setViewLogsUser(user);
    setLoadingLogs(true);
    setUserLogs([]);
    try {
      const res = await fetchWithInterceptor(
        `/api/v1/auth/admin/users/${user.id}/logs?limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUserLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedUsers.size === 0) return;
    try {
      const res = await fetchWithInterceptor("/api/v1/auth/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: Array.from(selectedUsers),
          action,
          value,
        }),
      });
      if (res.ok) {
        addNotification(`Bulk action ${action} completed`, "success");
        setSelectedUsers(new Set());
        fetchUsers();
      }
    } catch (err) {
      addNotification("Bulk action failed", "error");
    }
  };

  const handleGrantCreditsSubmit = async () => {
    if (!grantCreditsUser) return;
    if (grantAmount === 0) {
      addNotification?.("Amount cannot be zero", "warning");
      return;
    }
    setIsGranting(true);
    try {
      const res = await fetchWithInterceptor(
        `/api/v1/auth/admin/users/${grantCreditsUser.id}/add-credits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: grantAmount,
            reason: grantReason,
          }),
        }
      );
      if (res.ok) {
        addNotification?.("Credits updated successfully", "success");
        setGrantCreditsUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        addNotification?.(
          err.detail || "Failed to update credits",
          "error"
        );
      }
    } catch {
      addNotification?.("Failed to update credits", "error");
    } finally {
      setIsGranting(false);
    }
  };

  // Sorting and Filtering Logic
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter === "all" || u.creator_role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "locked" ? u.is_locked : !u.is_locked);

      let matchesActive = true;
      if (lastActiveFilter !== "all" && u.last_active) {
        const lastActiveDate = new Date(u.last_active);
        const now = new Date();
        const diffDays =
          (now.getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24);
        if (lastActiveFilter === "7d") matchesActive = diffDays <= 7;
        else if (lastActiveFilter === "30d") matchesActive = diffDays <= 30;
        else if (lastActiveFilter === "inactive") matchesActive = diffDays > 30;
      }

      return matchesSearch && matchesRole && matchesStatus && matchesActive;
    })
    .sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "credits") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl pl-9 pr-4 py-2 text-sm text-[#E5E5E5] placeholder-[#6B7280] focus:border-neutral-600 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#121212] border border-[#2F2F2F] rounded-xl px-3 py-2 text-xs text-[#E5E5E5] focus:border-neutral-600 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="free">Free</option>
            <option value="creator">Creator</option>
            <option value="studio">Studio</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#121212] border border-[#2F2F2F] rounded-xl px-3 py-2 text-xs text-[#E5E5E5] focus:border-neutral-600 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
          </select>

          {/* Last Active Filter */}
          <select
            value={lastActiveFilter}
            onChange={(e) => setLastActiveFilter(e.target.value)}
            className="bg-[#121212] border border-[#2F2F2F] rounded-xl px-3 py-2 text-xs text-[#E5E5E5] focus:border-neutral-600 outline-none"
          >
            <option value="all">All Activity</option>
            <option value="7d">Active &lt; 7 days</option>
            <option value="30d">Active &lt; 30 days</option>
            <option value="inactive">Inactive &gt; 30 days</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#181818] border-b border-[#2F2F2F] text-xs font-semibold text-neutral-400">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.size > 0 &&
                      selectedUsers.size === filteredUsers.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-neutral-700 bg-neutral-900 cursor-pointer"
                  />
                </th>
                <th
                  className="p-4 cursor-pointer hover:text-white"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    User
                    {sortConfig.key === "email" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </div>
                </th>
                <th
                  className="p-4 cursor-pointer hover:text-white"
                  onClick={() => handleSort("creator_role")}
                >
                  <div className="flex items-center gap-1">
                    Role
                    {sortConfig.key === "creator_role" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </div>
                </th>
                <th
                  className="p-4 cursor-pointer hover:text-white"
                  onClick={() => handleSort("credits")}
                >
                  <div className="flex items-center gap-1">
                    Credits
                    {sortConfig.key === "credits" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </div>
                </th>
                <th className="p-4">Status</th>
                <th
                  className="p-4 cursor-pointer hover:text-white"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center gap-1">
                    Joined
                    {sortConfig.key === "created_at" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </div>
                </th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2F2F2F]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-neutral-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center p-8 text-neutral-500 italic"
                  >
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => handleSelectUser(u.id)}
                        className="rounded border-neutral-700 bg-neutral-900 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{u.email}</div>
                      <div className="text-xs text-neutral-500">
                        {u.full_name || "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.creator_role === "admin"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : u.creator_role === "studio"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : u.creator_role === "creator"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {u.creator_role || "free"}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-medium text-white">
                      {u.credits?.toLocaleString() || 0}
                    </td>
                    <td className="p-4">
                      {u.is_locked ? (
                        <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                          <Unlock className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-neutral-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleFetchLogs(u)}
                          className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-md cursor-pointer"
                          title="View Security Audit Logs"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setGrantCreditsUser(u);
                            setGrantAmount(100);
                            setGrantReason("");
                          }}
                          className="p-1.5 hover:bg-neutral-800 text-amber-400 rounded-md cursor-pointer"
                          title="Adjust Credits"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 hover:bg-neutral-800 text-neutral-300 rounded-md cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-md cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Separated Modal Components */}
      <AdminUserLogsModal
        user={viewLogsUser}
        logs={userLogs}
        loading={loadingLogs}
        onClose={() => setViewLogsUser(null)}
      />

      <AdminUserEditModal
        user={editingUser}
        justificationReason={justificationReason}
        onUserChange={setEditingUser}
        onReasonChange={setJustificationReason}
        onClose={() => {
          setEditingUser(null);
          setJustificationReason("");
        }}
        onSave={handleUpdateUser}
      />

      <AdminUserDeleteModal
        user={deletingUser}
        justificationReason={justificationReason}
        onReasonChange={setJustificationReason}
        onClose={() => {
          setDeletingUser(null);
          setJustificationReason("");
        }}
        onConfirm={handleDeleteUser}
      />

      <AdminUserGrantCreditsModal
        user={grantCreditsUser}
        amount={grantAmount}
        reason={grantReason}
        isGranting={isGranting}
        onAmountChange={setGrantAmount}
        onReasonChange={setGrantReason}
        onClose={() => {
          setGrantCreditsUser(null);
          setGrantReason("");
        }}
        onSubmit={handleGrantCreditsSubmit}
      />

      <AdminUsersBulkBar
        selectedCount={selectedUsers.size}
        onAction={handleBulkAction}
      />
    </div>
  );
}

export const AdminUsersTab = AdminUsersPage;
export default AdminUsersPage;
