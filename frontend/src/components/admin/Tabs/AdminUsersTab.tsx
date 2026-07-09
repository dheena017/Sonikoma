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
  X,
  Shield,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

export function AdminUsersTab({
  fetchWithInterceptor,
  addNotification,
}: {
  fetchWithInterceptor: any;
  addNotification: any;
}) {
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

  // Modals
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
      const res = await fetchWithInterceptor("/api/auth/admin/users");
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

    // Check if reason is required
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
        `/api/auth/admin/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creator_role: editingUser.creator_role,
            credits: parseInt(editingUser.credits),
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
      } else {
        const err = await res.json();
        addNotification(err.detail || "Failed to update user", "error");
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
        `/api/auth/admin/users/${deletingUser.id}`,
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
        `/api/auth/admin/users/${user.id}/logs?limit=50`
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
      const res = await fetchWithInterceptor("/api/auth/admin/users/bulk", {
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

  const handleImpersonate = async (user_id: string) => {
    if (!confirm("Impersonate this user?")) return;
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/impersonate/${user_id}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const currentToken = localStorage.getItem("sonikoma_token");
          if (currentToken)
            localStorage.setItem("sonikoma_admin_token", currentToken);
          localStorage.setItem("sonikoma_token", data.access_token);
          window.location.href = "/";
        }
      }
    } catch (err) {
      addNotification("Impersonation failed", "error");
    }
  };

  let filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" || (u.creator_role || "user") === roleFilter;
    const status = u.is_locked ? "locked" : "active";
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length)
      setSelectedUsers(new Set());
    else setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#111115] border border-neutral-800 rounded-xl p-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="pro">Pro</option>
            <option value="user">User</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
          </select>
        </div>
        <p className="text-sm text-neutral-500 font-medium whitespace-nowrap">
          Showing {filteredUsers.length} users
        </p>
      </div>

      <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0b0b0e] text-neutral-400 border-b border-neutral-800 text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="hover:text-white"
                  >
                    {selectedUsers.size === filteredUsers.length &&
                    filteredUsers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th
                  className="px-4 py-4 cursor-pointer hover:text-white"
                  onClick={() => handleSort("full_name")}
                >
                  User
                </th>
                <th
                  className="px-4 py-4 cursor-pointer hover:text-white"
                  onClick={() => handleSort("email")}
                >
                  Email
                </th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Credits</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-neutral-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-white/[0.02] transition-colors group ${
                      selectedUsers.has(u.id) ? "bg-purple-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleSelectUser(u.id)}
                        className="text-neutral-500 hover:text-white"
                      >
                        {selectedUsers.has(u.id) ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 font-medium text-neutral-200">
                      {u.full_name || "No Name"}
                    </td>
                    <td className="px-4 py-4 text-neutral-400">{u.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                          u.creator_role === "admin"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                        }`}
                      >
                        {u.creator_role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-emerald-400 font-mono">
                      <Coins className="w-3 h-3 inline mr-1" />
                      {u.credits}
                    </td>
                    <td className="px-4 py-4">
                      {u.is_locked ? (
                        <span className="text-rose-400 flex items-center gap-1 text-xs">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 text-xs">
                          <Unlock className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleImpersonate(u.id)}
                          className="p-1.5 hover:bg-yellow-500/10 text-yellow-500 rounded-md"
                          title="Impersonate"
                        >
                          <Ghost className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFetchLogs(u)}
                          className="p-1.5 hover:bg-blue-500/10 text-blue-500 rounded-md"
                          title="Logs"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setGrantCreditsUser(u);
                            setGrantAmount(100);
                            setGrantReason("Manual admin credit grant");
                          }}
                          className="p-1.5 hover:bg-purple-500/10 text-purple-400 rounded-md"
                          title="Grant Credits"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 hover:bg-neutral-800 text-neutral-300 rounded-md"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-md"
                          title="Delete"
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

      {/* Modals */}
      {viewLogsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5" /> Logs for {viewLogsUser.email}
              </h3>
              <button onClick={() => setViewLogsUser(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {loadingLogs ? (
                <p className="text-center p-8">Loading...</p>
              ) : (
                userLogs.map((l) => (
                  <div
                    key={l.id}
                    className="text-xs font-mono p-2 bg-black/20 rounded border border-neutral-800 flex justify-between"
                  >
                    <span className="text-neutral-400">{l.action}</span>
                    <span className="text-neutral-600">
                      {new Date(l.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl w-full max-w-md p-6">
            <h3 className="font-bold text-white mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Role
                </label>
                <select
                  value={editingUser.creator_role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      creator_role: e.target.value,
                    })
                  }
                  className="w-full bg-[#0b0b0e] border border-neutral-800 rounded p-2 text-white"
                >
                  <option value="user">User</option>
                  <option value="pro">Pro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  value={editingUser.credits}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, credits: e.target.value })
                  }
                  className="w-full bg-[#0b0b0e] border border-neutral-800 rounded p-2 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingUser.is_locked}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      is_locked: e.target.checked,
                    })
                  }
                  className="rounded border-neutral-800 bg-neutral-900"
                />
                <label className="text-sm text-neutral-300">Lock Account</label>
              </div>

              <div className="pt-4 border-t border-neutral-800">
                <label className="text-xs text-neutral-500 block mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />{" "}
                  Justification / Reason
                </label>
                <textarea
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                  placeholder="Reason for change (required for sensitive actions)..."
                  className="w-full bg-[#0b0b0e] border border-neutral-800 rounded p-2 text-white text-sm h-20 focus:border-purple-500/50 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setJustificationReason("");
                }}
                className="flex-1 p-2 bg-neutral-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="flex-1 p-2 bg-purple-600 rounded shadow-lg shadow-purple-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111115] border border-rose-500/20 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold">Delete User?</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-6">
              Are you sure you want to delete{" "}
              <strong>{deletingUser.email}</strong>? This is irreversible.
            </p>

            <div className="mb-6">
              <label className="text-xs text-neutral-500 block mb-1">
                Audit Reason
              </label>
              <textarea
                value={justificationReason}
                onChange={(e) => setJustificationReason(e.target.value)}
                placeholder="Ticket # or deletion reason..."
                className="w-full bg-[#0b0b0e] border border-neutral-800 rounded p-2 text-white text-sm h-16 focus:border-rose-500/50 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeletingUser(null);
                  setJustificationReason("");
                }}
                className="flex-1 p-2 bg-neutral-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 p-2 bg-rose-600 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {grantCreditsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-purple-400 mb-4">
              <Coins className="w-6 h-6" />
              <h3 className="font-bold text-white">Grant / Adjust Credits</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Adjust credits for <strong>{grantCreditsUser.email}</strong>. Use positive numbers to add, or negative numbers to deduct.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0b0b0e] border border-neutral-800 rounded p-2 text-white text-sm focus:border-purple-500/50 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">
                  Reason / Justification
                </label>
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Reason for manual adjustment..."
                  className="w-full bg-[#0b0b0e] border border-neutral-800 rounded p-2 text-white text-sm h-20 focus:border-purple-500/50 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setGrantCreditsUser(null);
                  setGrantReason("");
                }}
                className="flex-1 p-2 bg-neutral-800 rounded"
                disabled={isGranting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (grantAmount === 0) {
                    addNotification("Amount cannot be zero", "warning");
                    return;
                  }
                  setIsGranting(true);
                  try {
                    const res = await fetchWithInterceptor(
                      `/api/auth/admin/users/${grantCreditsUser.id}/add-credits`,
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
                      addNotification("Credits updated successfully", "success");
                      setGrantCreditsUser(null);
                      fetchUsers();
                    } else {
                      const err = await res.json();
                      addNotification(err.detail || "Failed to update credits", "error");
                    }
                  } catch (err) {
                    addNotification("Failed to update credits", "error");
                  } finally {
                    setIsGranting(false);
                  }
                }}
                className="flex-1 p-2 bg-purple-650 hover:bg-purple-600 text-white rounded transition-all shadow-lg shadow-purple-500/20"
                disabled={isGranting}
              >
                {isGranting ? "Updating..." : "Grant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUsers.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a24] border border-purple-500/30 px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl">
          <span className="text-sm font-bold text-white">
            {selectedUsers.size} Selected
          </span>
          <div className="w-px h-4 bg-neutral-700" />
          <button
            onClick={() => handleBulkAction("lock")}
            className="text-xs text-rose-400 hover:underline"
          >
            Lock All
          </button>
          <button
            onClick={() => handleBulkAction("unlock")}
            className="text-xs text-emerald-400 hover:underline"
          >
            Unlock All
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            className="text-xs text-rose-500 hover:underline"
          >
            Delete All
          </button>
        </div>
      )}
    </div>
  );
}
