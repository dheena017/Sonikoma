import React, { useEffect, useState } from "react";
import { 
  Users, Shield, Clock, Mail, Coins, ShieldAlert,
  Search, Edit2, Trash2, LayoutGrid, Film, Activity,
  ChevronDown, ChevronUp, History, CheckSquare, Square,
  Settings, Server, ActivitySquare, ToggleLeft, ToggleRight, Ghost
} from "lucide-react";

export default function AdminPage({
  navigateTo,
  isAuthenticated,
  fetchWithInterceptor,
}: {
  navigateTo: (path: string) => void;
  isAuthenticated: boolean;
  fetchWithInterceptor: (
    url: string,
    options?: RequestInit
  ) => Promise<Response>;
}) {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'health' | 'activity'>('users');

  // Tab: Users
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Tab: Settings
  const [settings, setSettings] = useState<any>({});
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Tab: Health
  const [stats, setStats] = useState({ 
    users: 0, projects: 0, scenes: 0, memory: "0MB", dbLatencyMs: 0, 
    gpuWorkers: { total: 0, busy: 0, idle: 0 }, uptime: "", cpuPct: 0 
  });

  // Tab: Global Activity
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [loadingGlobalLogs, setLoadingGlobalLogs] = useState(false);

  // Modals state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [viewLogsUser, setViewLogsUser] = useState<any | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchUsers = async () => {
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

  const fetchStats = async () => {
    try {
      const res = await fetchWithInterceptor("/api/metrics");
      if (res.ok) {
        const data = await res.json();
        setStats({
          users: data.database?.users || 0,
          projects: data.database?.projects || 0,
          scenes: data.database?.scenes || 0,
          memory: `${data.memory?.rssMB || 0}MB`,
          dbLatencyMs: data.database?.dbLatencyMs || 0,
          gpuWorkers: data.database?.gpuWorkers || { total: 0, busy: 0, idle: 0 },
          uptime: data.server?.uptime || "",
          cpuPct: data.memory?.cpuPct || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchGlobalLogs = async () => {
    setLoadingGlobalLogs(true);
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setGlobalLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch global logs:", err);
    } finally {
      setLoadingGlobalLogs(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'users') { fetchUsers(); fetchStats(); }
    if (activeTab === 'health') fetchStats();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'activity') fetchGlobalLogs();
  }, [isAuthenticated, fetchWithInterceptor, activeTab]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetchWithInterceptor(`/api/auth/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_role: editingUser.creator_role,
          credits: parseInt(editingUser.credits)
        })
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const res = await fetchWithInterceptor(`/api/auth/admin/users/${deletingUser.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDeletingUser(null);
        setSelectedUsers(prev => {
          const next = new Set(prev);
          next.delete(deletingUser.id);
          return next;
        });
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleFetchLogs = async (user: any) => {
    setViewLogsUser(user);
    setLoadingLogs(true);
    setUserLogs([]);
    try {
      const res = await fetchWithInterceptor(`/api/auth/admin/users/${user.id}/logs?limit=20`);
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
    if (action === 'delete') {
      const confirm = window.confirm(`Are you sure you want to permanently delete ${selectedUsers.size} users?`);
      if (!confirm) return;
    }

    try {
      const res = await fetchWithInterceptor("/api/auth/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: Array.from(selectedUsers),
          action,
          value
        })
      });
      if (res.ok) {
        setSelectedUsers(new Set());
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error("Bulk action failed:", err);
    }
  };

  const handleImpersonate = async (user_id: string) => {
    const confirm = window.confirm("Are you sure you want to impersonate this user? You will be logged in as them.");
    if (!confirm) return;
    try {
      const res = await fetchWithInterceptor(`/api/auth/admin/impersonate/${user_id}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const currentToken = localStorage.getItem("sonikoma_token");
          if (currentToken) localStorage.setItem("sonikoma_admin_token", currentToken);
          localStorage.setItem("sonikoma_token", data.access_token);
          window.location.href = "/";
        }
      }
    } catch (err) {
      console.error("Impersonation failed:", err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });
      if (res.ok) {
        alert("Settings saved successfully.");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-200">Access Denied</h2>
        <p className="text-neutral-400 mt-2">You must be logged in to view the Admin Dashboard.</p>
        <button
          onClick={() => navigateTo("/")}
          className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  let filteredUsers = users.filter((u) => 
    (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.creator_role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  filteredUsers.sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === 'credits') { aVal = Number(aVal || 0); bVal = Number(bVal || 0); }
    if (sortConfig.key === 'created_at') { aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime(); }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-[fadeIn_0.3s_ease-out] relative pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Ultimate Admin Command Center
            </h1>
            <p className="text-neutral-400 mt-1">Platform management, health, settings, and logs.</p>
          </div>
          
          <div className="flex bg-[#111115] border border-neutral-800 rounded-lg p-1">
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}>
              <Users className="w-4 h-4" /> Users
            </button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}>
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button onClick={() => setActiveTab('health')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'health' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}>
              <Server className="w-4 h-4" /> Health
            </button>
            <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'activity' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}>
              <ActivitySquare className="w-4 h-4" /> Activity
            </button>
          </div>
        </div>

        {/* Tab Content: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#111115] border border-neutral-800 rounded-xl p-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input 
                  type="text" placeholder="Search users by name, email, or role..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <p className="text-sm text-neutral-500 font-medium">Showing {filteredUsers.length} users</p>
            </div>

            <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0b0b0e] text-neutral-400 border-b border-neutral-800 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-4 w-10">
                        <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                          {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-4 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('full_name')}>
                        <div className="flex items-center gap-2">User <SortIcon column="full_name" /></div>
                      </th>
                      <th className="px-4 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('email')}>
                        <div className="flex items-center gap-2">Email <SortIcon column="email" /></div>
                      </th>
                      <th className="px-4 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('creator_role')}>
                        <div className="flex items-center gap-2">Role <SortIcon column="creator_role" /></div>
                      </th>
                      <th className="px-4 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('credits')}>
                        <div className="flex items-center gap-2">Credits <SortIcon column="credits" /></div>
                      </th>
                      <th className="px-4 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center gap-2">Join Date <SortIcon column="created_at" /></div>
                      </th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {loading ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-neutral-500">Loading...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-neutral-500">No users found.</td></tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className={`hover:bg-white/[0.02] transition-colors group ${selectedUsers.has(u.id) ? 'bg-purple-500/5' : ''}`}>
                          <td className="px-4 py-4">
                            <button onClick={() => toggleSelectUser(u.id)} className="text-neutral-500 hover:text-white">
                              {selectedUsers.has(u.id) ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full bg-neutral-800" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300 font-bold text-xs">
                                  {u.full_name?.charAt(0) || u.email?.charAt(0) || "?"}
                                </div>
                              )}
                              <span className="font-medium text-neutral-200">{u.full_name || "No Name"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-neutral-400">{u.email}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${u.creator_role === "pro" || u.creator_role === "admin" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-neutral-800 text-neutral-300 border border-neutral-700"}`}>
                              {u.creator_role || "user"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                              <Coins className="w-3.5 h-3.5" />{u.credits ?? 0}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-neutral-500 font-mono text-xs">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleImpersonate(u.id)} className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-md border border-yellow-500/20 transition-colors" title="Impersonate User">
                                <Ghost className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleFetchLogs(u)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/20 transition-colors" title="View Activity Logs">
                                <History className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingUser(u)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors" title="Edit User">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeletingUser(u)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-md border border-rose-500/20 transition-colors" title="Delete User">
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
            {/* Bulk Actions Footer */}
            {selectedUsers.size > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-40 animate-[slideUp_0.3s_ease-out]">
                <div className="bg-[#1a1a24] border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)] rounded-full px-6 py-3 flex items-center gap-6">
                  <span className="text-sm font-semibold text-white">{selectedUsers.size} users selected</span>
                  <div className="h-4 w-[1px] bg-neutral-700" />
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleBulkAction('add_credits', '100')} className="text-xs font-medium px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20 transition-colors">+100 Credits</button>
                    <button onClick={() => handleBulkAction('set_role', 'pro')} className="text-xs font-medium px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-md border border-amber-500/20 transition-colors">Make Pro</button>
                    <button onClick={() => handleBulkAction('delete')} className="text-xs font-medium px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-md border border-rose-500/20 transition-colors">Delete Selected</button>
                  </div>
                  <button onClick={() => setSelectedUsers(new Set())} className="ml-2 text-neutral-500 hover:text-white p-1"><ChevronDown className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-8 animate-[fadeIn_0.2s_ease-out] max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Global Platform Settings</h2>
              <p className="text-sm text-neutral-400">Configure platform-wide behavior. These settings take effect immediately.</p>
            </div>
            
            {loadingSettings ? <div className="text-neutral-500">Loading settings...</div> : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e]">
                  <div>
                    <h3 className="font-semibold text-neutral-200">Maintenance Mode</h3>
                    <p className="text-xs text-neutral-500 mt-1">Disables all non-admin access to the platform. Displays a maintenance page.</p>
                  </div>
                  <button onClick={() => setSettings({...settings, maintenance_mode: settings.maintenance_mode === 'true' ? 'false' : 'true'})} className={`p-1 rounded-full transition-colors ${settings.maintenance_mode === 'true' ? 'text-purple-500' : 'text-neutral-600'}`}>
                    {settings.maintenance_mode === 'true' ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e]">
                  <div>
                    <h3 className="font-semibold text-neutral-200">Disable New Signups</h3>
                    <p className="text-xs text-neutral-500 mt-1">Prevents new users from registering accounts.</p>
                  </div>
                  <button onClick={() => setSettings({...settings, disable_signups: settings.disable_signups === 'true' ? 'false' : 'true'})} className={`p-1 rounded-full transition-colors ${settings.disable_signups === 'true' ? 'text-purple-500' : 'text-neutral-600'}`}>
                    {settings.disable_signups === 'true' ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </button>
                </div>

                <div className="p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e] space-y-3">
                  <div>
                    <h3 className="font-semibold text-neutral-200">Global Announcement Banner</h3>
                    <p className="text-xs text-neutral-500 mt-1">Leave empty to disable. Supports basic text shown at the top of all pages.</p>
                  </div>
                  <input 
                    type="text" 
                    value={settings.global_banner || ''}
                    onChange={(e) => setSettings({...settings, global_banner: e.target.value})}
                    placeholder="e.g. We are performing scheduled maintenance at 3 AM UTC."
                    className="w-full bg-[#111115] border border-neutral-700 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {savingSettings ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: HEALTH */}
        {activeTab === 'health' && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#111115] border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2"><Server className="w-4 h-4 text-emerald-400"/> API Server</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded">ONLINE</span>
                </div>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex justify-between"><span>Uptime:</span> <span className="font-mono text-neutral-200">{stats.uptime}</span></div>
                  <div className="flex justify-between"><span>CPU Usage:</span> <span className="font-mono text-neutral-200">{stats.cpuPct}%</span></div>
                  <div className="flex justify-between"><span>Memory:</span> <span className="font-mono text-neutral-200">{stats.memory}</span></div>
                </div>
              </div>

              <div className="bg-[#111115] border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-blue-400"/> Database (SQLite)</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded">HEALTHY</span>
                </div>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex justify-between"><span>Read Latency:</span> <span className="font-mono text-blue-400">{stats.dbLatencyMs} ms</span></div>
                  <div className="flex justify-between"><span>Total Users:</span> <span className="font-mono text-neutral-200">{stats.users}</span></div>
                  <div className="flex justify-between"><span>Total Projects:</span> <span className="font-mono text-neutral-200">{stats.projects}</span></div>
                </div>
              </div>

              <div className="bg-[#111115] border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-purple-400"/> GPU Workers</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded">READY</span>
                </div>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex justify-between"><span>Total Registered:</span> <span className="font-mono text-neutral-200">{stats.gpuWorkers?.total || 0}</span></div>
                  <div className="flex justify-between"><span>Busy Rendering:</span> <span className="font-mono text-amber-400">{stats.gpuWorkers?.busy || 0}</span></div>
                  <div className="flex justify-between"><span>Idle / Waiting:</span> <span className="font-mono text-emerald-400">{stats.gpuWorkers?.idle || 0}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-xl animate-[fadeIn_0.2s_ease-out]">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-[#0b0b0e]">
              <h2 className="font-bold text-white flex items-center gap-2"><History className="w-4 h-4 text-blue-400"/> Global Activity Feed</h2>
              <button onClick={fetchGlobalLogs} className="text-xs text-neutral-400 hover:text-white transition-colors">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0b0b0e] text-neutral-400 border-b border-neutral-800 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {loadingGlobalLogs ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-neutral-500">Loading global logs...</td></tr>
                  ) : globalLogs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-neutral-500">No recent activity.</td></tr>
                  ) : (
                    globalLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3 text-neutral-500 font-mono text-xs">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-3 font-medium text-neutral-300">{log.email || "Unknown"}</td>
                        <td className="px-6 py-3 text-neutral-200">{log.action}</td>
                        <td className="px-6 py-3 text-neutral-500 font-mono text-xs">{log.ip_address}</td>
                        <td className="px-6 py-3">
                          <span className={log.status === 'Success' ? 'text-emerald-400' : 'text-rose-400'}>{log.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modals: User Logs, Edit User, Delete User */}
      {viewLogsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><History className="w-5 h-5 text-blue-400" /> Activity Logs</h3>
                <p className="text-sm text-neutral-400 mt-1">{viewLogsUser.email}</p>
              </div>
              <button onClick={() => setViewLogsUser(null)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {loadingLogs ? (
                <div className="p-12 text-center text-neutral-500">Loading logs...</div>
              ) : userLogs.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">No recent activity found.</div>
              ) : (
                <div className="divide-y divide-neutral-800/50">
                  {userLogs.map((log, idx) => (
                    <div key={log.id || idx} className="p-4 hover:bg-white/[0.02] flex items-start gap-4">
                      <div className="mt-1">
                        {log.action.toLowerCase().includes('login') ? <Shield className="w-4 h-4 text-emerald-400" /> :
                         log.action.toLowerCase().includes('delete') ? <Trash2 className="w-4 h-4 text-rose-400" /> :
                         <Activity className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-200 font-medium">{log.action}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-mono">
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                          <span>•</span>
                          <span>IP: {log.ip_address}</span>
                          <span>•</span>
                          <span className={log.status === 'Success' ? 'text-emerald-400' : 'text-rose-400'}>{log.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white">Edit User Profile</h3>
              <p className="text-sm text-neutral-400 mt-1">Updating settings for {editingUser.email}</p>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Creator Role</label>
                <select value={editingUser.creator_role || "user"} onChange={(e) => setEditingUser({...editingUser, creator_role: e.target.value})} className="w-full bg-[#0b0b0e] border border-neutral-800 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:border-purple-500/50">
                  <option value="user">User</option>
                  <option value="pro">Studio Pro</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Compute Credits</label>
                <input type="number" value={editingUser.credits} onChange={(e) => setEditingUser({...editingUser, credits: e.target.value})} className="w-full bg-[#0b0b0e] border border-neutral-800 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:border-purple-500/50" min="0" step="10" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#111115] border border-rose-500/20 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-neutral-800 flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-full text-rose-500"><ShieldAlert className="w-6 h-6" /></div>
              <div>
                <h3 className="text-lg font-bold text-white">Permanently Delete User?</h3>
                <p className="text-sm text-neutral-400 mt-1">{deletingUser.email}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
                Are you sure you want to delete this user? This action is <strong className="text-rose-400">irreversible</strong> and will permanently delete all of their projects, scenes, generated assets, invoices, and settings.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingUser(null)} className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors">Cancel</button>
                <button onClick={handleDeleteUser} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors">Yes, Delete User</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
