import React, { useEffect, useState } from "react";
import {
  Users,
  Shield,
  Clock,
  Mail,
  Coins,
  ShieldAlert,
  Search,
  Edit2,
  Trash2,
  LayoutGrid,
  Film,
  Activity,
  ChevronDown,
  ChevronUp,
  History,
  CheckSquare,
  Square,
  Settings,
  Server,
  ActivitySquare,
  ToggleLeft,
  ToggleRight,
  Ghost,
  TrendingUp,
  BarChart3,
  FolderGit2,
} from "lucide-react";

import { AdminOverviewTab } from "./admin/AdminOverviewTab";
import { AdminAnnouncementsTab } from "./admin/AdminAnnouncementsTab";
import * as api from "../api/index.js";

export default function AdminPage({
  navigateTo,
  isAuthenticated,
  fetchWithInterceptor,
  audioFeedback,
}: {
  navigateTo: (path: string) => void;
  isAuthenticated: boolean;
  fetchWithInterceptor: (
    url: string,
    options?: RequestInit
  ) => Promise<Response>;
  audioFeedback?: any;
}) {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "announcements"
    | "users"
    | "settings"
    | "health"
    | "activity"
    | "analytics"
    | "content"
  >("overview");

  // Tab: Users
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

  // Tab: Settings
  const [settings, setSettings] = useState<any>({});
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Tab: Health
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    scenes: 0,
    memory: "0MB",
    dbLatencyMs: 0,
    gpuWorkers: { total: 0, busy: 0, idle: 0 },
    uptime: "",
    cpuPct: 0,
  });

  // Tab: Global Activity
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [loadingGlobalLogs, setLoadingGlobalLogs] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [logSeverityFilter, setLogSeverityFilter] = useState("all");
  const [logIpFilter, setLogIpFilter] = useState("");

  // Tab: Analytics
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Tab: Content (Projects)
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState("all");
  const [moderationFilter, setModerationFilter] = useState("all");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );

  // Modals state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [viewLogsUser, setViewLogsUser] = useState<any | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.adminGetUsers(fetchWithInterceptor);
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getMetrics();
      setStats({
        users: data.database?.users || 0,
        projects: data.database?.projects || 0,
        scenes: data.database?.scenes || 0,
        memory: `${data.memory?.rssMB || 0}MB`,
        dbLatencyMs: data.database?.dbLatencyMs || 0,
        gpuWorkers: data.database?.gpuWorkers || {
          total: 0,
          busy: 0,
          idle: 0,
        },
        uptime: data.server?.uptime || "",
        cpuPct: data.memory?.cpuPct || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await api.adminGetSettings(fetchWithInterceptor);
      if (data.success) setSettings(data.settings);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchGlobalLogs = async () => {
    setLoadingGlobalLogs(true);
    try {
      const data = await api.adminGetAuditLogs(fetchWithInterceptor);
      if (data.success) setGlobalLogs(data.logs);
    } catch (err) {
      console.error("Failed to fetch global logs:", err);
    } finally {
      setLoadingGlobalLogs(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await api.adminGetAnalytics(fetchWithInterceptor);
      if (data.success) setAnalytics(data.analytics);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await api.adminGetProjects(fetchWithInterceptor);
      if (data.success) setProjects(data.projects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "overview") fetchStats();
    if (activeTab === "users") {
      fetchUsers();
      fetchStats();
    }
    if (activeTab === "health") fetchStats();
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "activity") fetchGlobalLogs();
    if (activeTab === "analytics") fetchAnalytics();
    if (activeTab === "content") fetchProjects();
  }, [isAuthenticated, fetchWithInterceptor, activeTab]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const data = await api.adminUpdateUser(
        fetchWithInterceptor,
        editingUser.id,
        {
          creator_role: editingUser.creator_role,
          credits: parseInt(editingUser.credits),
        }
      );
      if (data) {
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
      const data = await api.adminDeleteUser(
        fetchWithInterceptor,
        deletingUser.id
      );
      if (data) {
        audioFeedback?.playError();
        setDeletingUser(null);
        setSelectedUsers((prev) => {
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

  const handleDeleteProject = async (id: string) => {
    const confirm = await (window as any).confirmAsync(
      "Are you sure you want to delete this project? This is irreversible."
    );
    if (!confirm) return;
    try {
      const data = await api.adminDeleteProject(fetchWithInterceptor, id);
      if (data) {
        audioFeedback?.playError();
        fetchProjects();
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleFetchLogs = async (user: any) => {
    setViewLogsUser(user);
    setLoadingLogs(true);
    setUserLogs([]);
    try {
      const data = await api.adminGetUserLogs(
        fetchWithInterceptor,
        user.id,
        20
      );
      if (data.success) setUserLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedUsers.size === 0) return;
    if (action === "delete") {
      const confirm = await (window as any).confirmAsync(
        `Are you sure you want to permanently delete ${selectedUsers.size} users?`
      );
      if (!confirm) return;
    }

    try {
      const data = await api.adminBulkAction(fetchWithInterceptor, {
        user_ids: Array.from(selectedUsers),
        action,
        value,
      });
      if (data) {
        if (action === "delete") {
          audioFeedback?.playError();
        }
        setSelectedUsers(new Set());
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error("Bulk action failed:", err);
    }
  };

  const handleImpersonate = async (user_id: string) => {
    const confirm = await (window as any).confirmAsync(
      "Are you sure you want to impersonate this user? You will be logged in as them."
    );
    if (!confirm) return;
    try {
      const data = await api.adminImpersonateUser(
        fetchWithInterceptor,
        user_id
      );
      if (data.success) {
        const currentToken = localStorage.getItem("sonikoma_token");
        if (currentToken)
          localStorage.setItem("sonikoma_admin_token", currentToken);
        localStorage.setItem("sonikoma_token", data.access_token);
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Impersonation failed:", err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const data = await api.adminUpdateSettings(
        fetchWithInterceptor,
        settings
      );
      if (data) {
        await (window as any).alertAsync("Settings saved successfully.");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSavingSettings(false);
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-200">Access Denied</h2>
        <p className="text-neutral-400 mt-2">
          You must be logged in to view the Admin Dashboard.
        </p>
        <button
          onClick={() => navigateTo("/")}
          className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  let filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.creator_role || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "all" || (u.creator_role || "user") === roleFilter;
    const mockStatus = u.credits > 100 ? "active" : "inactive";
    const matchesStatus = statusFilter === "all" || mockStatus === statusFilter;

    const mockLastActive = new Date(u.created_at).getTime();
    const now = Date.now();
    const diffDays = (now - mockLastActive) / (1000 * 60 * 60 * 24);
    let matchesActive = true;
    if (lastActiveFilter === "24h") matchesActive = diffDays <= 1;
    else if (lastActiveFilter === "7d") matchesActive = diffDays <= 7;
    else if (lastActiveFilter === "30d") matchesActive = diffDays <= 30;

    return matchesSearch && matchesRole && matchesStatus && matchesActive;
  });

  filteredUsers.sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === "credits") {
      aVal = Number(aVal || 0);
      bVal = Number(bVal || 0);
    }
    if (sortConfig.key === "created_at") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column)
      return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
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
            <p className="text-neutral-400 mt-1">
              Platform management, analytics, health, and content moderation.
            </p>
          </div>

          <div className="flex flex-wrap bg-[#111115] border border-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "announcements"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Mail className="w-4 h-4" /> Announcements
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "users"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Users className="w-4 h-4" /> Users
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "analytics"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
            <button
              onClick={() => setActiveTab("content")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "content"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <FolderGit2 className="w-4 h-4" /> Content
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "settings"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "health"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Server className="w-4 h-4" /> Health
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "activity"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <ActivitySquare className="w-4 h-4" /> Logs
            </button>
          </div>
        </div>

        {activeTab === "overview" && <AdminOverviewTab stats={stats} />}
        {activeTab === "announcements" && (
          <AdminAnnouncementsTab fetchWithInterceptor={fetchWithInterceptor} />
        )}

        {/* Tab Content: USERS */}
        {activeTab === "users" && (
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
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={lastActiveFilter}
                  onChange={(e) => setLastActiveFilter(e.target.value)}
                  className="bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="all">Any Activity</option>
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
              <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                <p className="text-sm text-neutral-500 font-medium whitespace-nowrap">
                  Showing {filteredUsers.length} users
                </p>
                <button
                  onClick={() => {
                    const csv =
                      "Email,Name,Role,Credits\n" +
                      filteredUsers
                        .map(
                          (u) =>
                            `${u.email},${u.full_name},${u.creator_role},${u.credits}`
                        )
                        .join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "users_export.csv";
                    a.click();
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0b0b0e] text-neutral-400 border-b border-neutral-800 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-4 w-10">
                        <button
                          onClick={toggleSelectAll}
                          className="hover:text-white transition-colors"
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
                        <div className="flex items-center gap-2">
                          User <SortIcon column="full_name" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-4 cursor-pointer hover:text-white"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center gap-2">
                          Email <SortIcon column="email" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-4 cursor-pointer hover:text-white"
                        onClick={() => handleSort("creator_role")}
                      >
                        <div className="flex items-center gap-2">
                          Role <SortIcon column="creator_role" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-4 cursor-pointer hover:text-white"
                        onClick={() => handleSort("credits")}
                      >
                        <div className="flex items-center gap-2">
                          Credits <SortIcon column="credits" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-4 cursor-pointer hover:text-white"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center gap-2">
                          Join Date <SortIcon column="created_at" />
                        </div>
                      </th>
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
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-neutral-500"
                        >
                          No users found.
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
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {u.avatar_url ? (
                                <div className="relative">
                                  <img
                                    src={u.avatar_url}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full bg-neutral-800"
                                  />
                                  <div
                                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111115] ${
                                      u.credits > 100
                                        ? "bg-emerald-500"
                                        : "bg-neutral-500"
                                    }`}
                                  ></div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300 font-bold text-xs">
                                    {u.full_name?.charAt(0) ||
                                      u.email?.charAt(0) ||
                                      "?"}
                                  </div>
                                  <div
                                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111115] ${
                                      u.credits > 100
                                        ? "bg-emerald-500"
                                        : "bg-neutral-500"
                                    }`}
                                  ></div>
                                </div>
                              )}
                              <span className="font-medium text-neutral-200">
                                {u.full_name || "No Name"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-neutral-400">
                            {u.email}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                                u.creator_role === "pro" ||
                                u.creator_role === "admin"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                              }`}
                            >
                              {u.creator_role || "user"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                              <Coins className="w-3.5 h-3.5" />
                              {u.credits ?? 0}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-neutral-500 font-mono text-xs">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleImpersonate(u.id)}
                                className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-md border border-yellow-500/20 transition-colors"
                                title="Impersonate User"
                              >
                                <Ghost className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleFetchLogs(u)}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/20 transition-colors"
                                title="View Activity Logs"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors"
                                title="Edit User"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingUser(u)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-md border border-rose-500/20 transition-colors"
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
            {/* Bulk Actions Footer */}
            {selectedUsers.size > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-40 animate-[slideUp_0.3s_ease-out]">
                <div className="bg-[#1a1a24] border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)] rounded-full px-6 py-3 flex items-center gap-6">
                  <span className="text-sm font-semibold text-white">
                    {selectedUsers.size} users selected
                  </span>
                  <div className="h-4 w-[1px] bg-neutral-700" />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleBulkAction("add_credits", "100")}
                      className="text-xs font-medium px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20 transition-colors"
                    >
                      +100 Credits
                    </button>
                    <button
                      onClick={() => handleBulkAction("set_role", "pro")}
                      className="text-xs font-medium px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-md border border-amber-500/20 transition-colors"
                    >
                      Make Pro
                    </button>
                    <button
                      onClick={() => handleBulkAction("delete")}
                      className="text-xs font-medium px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-md border border-rose-500/20 transition-colors"
                    >
                      Delete Selected
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedUsers(new Set())}
                    className="ml-2 text-neutral-500 hover:text-white p-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            {loadingAnalytics ? (
              <div className="text-neutral-500 p-8 text-center">
                Loading platform analytics...
              </div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-neutral-400 text-sm uppercase tracking-wider">
                        Total Users
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {analytics.total_users}
                      </span>
                      <span className="text-xs font-medium text-emerald-400 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> +
                        {analytics.new_users_today} today
                      </span>
                    </div>
                    <div className="mt-4 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((analytics.total_users || 0) / 5000) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 flex justify-between">
                      <span>Server Capacity</span>
                      <span>
                        {Math.round(
                          ((analytics.total_users || 0) / 5000) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Coins className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-neutral-400 text-sm uppercase tracking-wider">
                        Credits Distributed
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white font-mono">
                        {analytics.total_credits}
                      </span>
                    </div>
                    <div className="mt-4 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((analytics.total_credits || 0) / 100000) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 flex justify-between">
                      <span>Monthly Allocation Limit</span>
                      <span>
                        {Math.round(
                          ((analytics.total_credits || 0) / 100000) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                        <Film className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-neutral-400 text-sm uppercase tracking-wider">
                        Rendered Compute
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {Math.round((analytics.total_duration_sec || 0) / 60)}
                      </span>
                      <span className="text-sm font-medium text-neutral-500">
                        minutes
                      </span>
                    </div>
                    <div className="mt-4 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((analytics.total_duration_sec || 0) / 3600) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 flex justify-between">
                      <span>Compute Quota</span>
                      <span>
                        {Math.round(
                          ((analytics.total_duration_sec || 0) / 3600) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <FolderGit2 className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-neutral-400 text-sm uppercase tracking-wider">
                        Total Content
                      </h3>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Projects:</span>{" "}
                        <span className="font-bold text-white">
                          {analytics.total_series}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Chapters:</span>{" "}
                        <span className="font-bold text-white">
                          {analytics.total_chapters}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
                  <h3 className="font-bold text-white mb-4">
                    Growth Metrics (Last 7 Days)
                  </h3>
                  <div className="h-64 flex items-end gap-2 px-4 pb-8 pt-4 border-b border-l border-neutral-800">
                    {analytics.signups_chart &&
                      analytics.signups_chart.map((d: any, i: number) => {
                        const maxVal =
                          Math.max(
                            ...analytics.signups_chart.map((x: any) => x.count)
                          ) || 1;
                        const heightPct = (d.count / maxVal) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-end h-full relative group"
                          >
                            <div
                              className="w-full bg-purple-600/80 hover:bg-purple-500 rounded-t-sm transition-all"
                              style={{ height: `${Math.max(heightPct, 2)}%` }}
                            />
                            <div className="absolute -bottom-6 text-[10px] text-neutral-500 font-mono rotate-45 origin-left whitespace-nowrap">
                              {d.date.substring(5)}
                            </div>
                            <div className="absolute -top-8 bg-black/80 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-white">
                              {d.count}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                  {/* Leaderboard: Top Creators */}
                  <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" /> Top Creators
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-[#0b0b0e] p-3 rounded-lg border border-neutral-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                            1
                          </div>
                          <span className="text-neutral-200">Alex Johnson</span>
                        </div>
                        <span className="text-sm font-medium text-purple-400">
                          42 Projects
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-[#0b0b0e] p-3 rounded-lg border border-neutral-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                            2
                          </div>
                          <span className="text-neutral-200">Maria Garcia</span>
                        </div>
                        <span className="text-sm font-medium text-blue-400">
                          38 Projects
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-[#0b0b0e] p-3 rounded-lg border border-neutral-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            3
                          </div>
                          <span className="text-neutral-200">James Smith</span>
                        </div>
                        <span className="text-sm font-medium text-emerald-400">
                          27 Projects
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Average Metrics */}
                  <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-400" /> Platform
                      Averages
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
                        <span className="text-neutral-400">
                          Avg Render Time
                        </span>
                        <span className="font-mono text-white text-lg">
                          2m 14s
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
                        <span className="text-neutral-400">
                          Avg Scenes per Project
                        </span>
                        <span className="font-mono text-white text-lg">
                          12.5
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
                        <span className="text-neutral-400">
                          Avg Credit Spend / User
                        </span>
                        <span className="font-mono text-white text-lg">
                          450
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Mock */}
                  <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 lg:col-span-2">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" /> Revenue
                      & Subscriptions (Mock)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg border-l-2 border-l-emerald-500">
                        <div className="text-neutral-400 text-sm mb-1">
                          Monthly Recurring Revenue
                        </div>
                        <div className="text-2xl font-bold text-white">
                          ${(analytics.mrr || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-400 mt-1">
                          +15% from last month
                        </div>
                      </div>
                      <div className="p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg border-l-2 border-l-purple-500">
                        <div className="text-neutral-400 text-sm mb-1">
                          Active Subscriptions
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {(
                            analytics.active_subscriptions || 0
                          ).toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-400 mt-1">
                          +42 new this week
                        </div>
                      </div>
                      <div className="p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg border-l-2 border-l-rose-500">
                        <div className="text-neutral-400 text-sm mb-1">
                          Churn Rate
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {analytics.churn_rate || "0"}%
                        </div>
                        <div className="text-xs text-rose-400 mt-1">
                          Slight increase
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Tab Content: CONTENT MODERATION */}
        {activeTab === "content" &&
          (() => {
            const filteredProjects = projects.filter((p) => {
              const matchesSearch =
                (p.title || "")
                  .toLowerCase()
                  .includes(projectSearch.toLowerCase()) ||
                (p.user_email || "")
                  .toLowerCase()
                  .includes(projectSearch.toLowerCase());

              const mockType =
                p.id.length % 3 === 0
                  ? "video"
                  : p.id.length % 2 === 0
                  ? "audio"
                  : "image";
              const matchesType =
                projectTypeFilter === "all" || mockType === projectTypeFilter;

              const isFlagged = p.id.includes("1") || p.id.includes("a");
              const matchesMod =
                moderationFilter === "all" ||
                (moderationFilter === "flagged" && isFlagged) ||
                (moderationFilter === "clean" && !isFlagged);

              return matchesSearch && matchesType && matchesMod;
            });

            return (
              <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#111115] border border-neutral-800 rounded-xl p-4">
                  <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Search projects by title or creator..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="w-full bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <select
                      value={projectTypeFilter}
                      onChange={(e) => setProjectTypeFilter(e.target.value)}
                      className="bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="all">All Content Types</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="image">Image</option>
                    </select>
                    <select
                      value={moderationFilter}
                      onChange={(e) => setModerationFilter(e.target.value)}
                      className="bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="all">All Moderation Status</option>
                      <option value="clean">Clean</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                  <p className="text-sm text-neutral-500 font-medium">
                    Showing {filteredProjects.length} projects
                  </p>
                </div>

                <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-[#0b0b0e]">
                    <h2 className="font-bold text-white flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-blue-400" /> Global
                      Project Registry
                    </h2>
                    <button
                      onClick={fetchProjects}
                      className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <ActivitySquare className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-[#0b0b0e] text-neutral-400 border-b border-neutral-800 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-4 w-10">
                            <button
                              onClick={() => {
                                if (
                                  selectedProjects.size ===
                                  filteredProjects.length
                                )
                                  setSelectedProjects(new Set());
                                else
                                  setSelectedProjects(
                                    new Set(filteredProjects.map((p) => p.id))
                                  );
                              }}
                              className="hover:text-white transition-colors"
                            >
                              {selectedProjects.size ===
                                filteredProjects.length &&
                              filteredProjects.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-purple-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-4">Project ID</th>
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4">Creator</th>
                          <th className="px-6 py-4">Created At</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/50">
                        {loadingProjects ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-12 text-center text-neutral-500"
                            >
                              Loading projects...
                            </td>
                          </tr>
                        ) : filteredProjects.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-12 text-center text-neutral-500"
                            >
                              No projects found.
                            </td>
                          </tr>
                        ) : (
                          filteredProjects.map((p) => (
                            <tr
                              key={p.id}
                              className={`hover:bg-white/[0.02] transition-colors ${
                                selectedProjects.has(p.id)
                                  ? "bg-purple-500/5"
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => {
                                    const next = new Set(selectedProjects);
                                    if (next.has(p.id)) next.delete(p.id);
                                    else next.add(p.id);
                                    setSelectedProjects(next);
                                  }}
                                  className="text-neutral-500 hover:text-white"
                                >
                                  {selectedProjects.has(p.id) ? (
                                    <CheckSquare className="w-4 h-4 text-purple-400" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                                {p.id.substring(0, 8)}...
                              </td>
                              <td className="px-6 py-4 font-medium text-neutral-200">
                                {p.title || "Untitled Project"}
                              </td>
                              <td className="px-6 py-4 text-neutral-400">
                                {p.user_email || "Unknown User"}
                              </td>
                              <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                                {new Date(p.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteProject(p.id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-md border border-rose-500/20 transition-colors"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {selectedProjects.size > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-40 animate-[slideUp_0.3s_ease-out]">
                    <div className="bg-[#1a1a24] border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)] rounded-full px-6 py-3 flex items-center gap-6">
                      <span className="text-sm font-semibold text-white">
                        {selectedProjects.size} projects selected
                      </span>
                      <div className="h-4 w-[1px] bg-neutral-700" />
                      <button
                        onClick={async () => {
                          if (
                            await (window as any).confirmAsync(
                              "Delete selected projects?"
                            )
                          ) {
                            setSelectedProjects(new Set());
                          }
                        }}
                        className="text-xs font-medium px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" /> Bulk Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        {/* Tab Content: SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-8 animate-[fadeIn_0.2s_ease-out] max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Global Platform Settings
              </h2>
              <p className="text-sm text-neutral-400">
                Configure platform-wide behavior. These settings take effect
                immediately.
              </p>
            </div>

            {loadingSettings ? (
              <div className="text-neutral-500">Loading settings...</div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e]">
                  <div>
                    <h3 className="font-semibold text-neutral-200">
                      Maintenance Mode
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Disables all non-admin access to the platform. Displays a
                      maintenance page.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        maintenance_mode:
                          settings.maintenance_mode === "true"
                            ? "false"
                            : "true",
                      })
                    }
                    className={`p-1 rounded-full transition-colors ${
                      settings.maintenance_mode === "true"
                        ? "text-purple-500"
                        : "text-neutral-600"
                    }`}
                  >
                    {settings.maintenance_mode === "true" ? (
                      <ToggleRight className="w-10 h-10" />
                    ) : (
                      <ToggleLeft className="w-10 h-10" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e]">
                  <div>
                    <h3 className="font-semibold text-neutral-200">
                      Disable New Signups
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Prevents new users from registering accounts.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        disable_signups:
                          settings.disable_signups === "true"
                            ? "false"
                            : "true",
                      })
                    }
                    className={`p-1 rounded-full transition-colors ${
                      settings.disable_signups === "true"
                        ? "text-purple-500"
                        : "text-neutral-600"
                    }`}
                  >
                    {settings.disable_signups === "true" ? (
                      <ToggleRight className="w-10 h-10" />
                    ) : (
                      <ToggleLeft className="w-10 h-10" />
                    )}
                  </button>
                </div>

                <div className="p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e] space-y-3">
                  <div>
                    <h3 className="font-semibold text-neutral-200">
                      Global Announcement Banner
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Leave empty to disable. Supports basic text shown at the
                      top of all pages.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={settings.global_banner || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        global_banner: e.target.value,
                      })
                    }
                    placeholder="e.g. We are performing scheduled maintenance at 3 AM UTC."
                    className="w-full bg-[#111115] border border-neutral-700 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e]">
                  <div>
                    <h3 className="font-semibold text-neutral-200">
                      Enable Beta Features
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Allows users to access experimental AI models and advanced
                      crop tools.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        enable_beta:
                          settings.enable_beta === "true" ? "false" : "true",
                      })
                    }
                    className={`p-1 rounded-full transition-colors ${
                      settings.enable_beta === "true"
                        ? "text-purple-500"
                        : "text-neutral-600"
                    }`}
                  >
                    {settings.enable_beta === "true" ? (
                      <ToggleRight className="w-10 h-10" />
                    ) : (
                      <ToggleLeft className="w-10 h-10" />
                    )}
                  </button>
                </div>

                <div className="p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e] space-y-4">
                  <h3 className="font-semibold text-neutral-200 border-b border-neutral-800 pb-2">
                    System Limits & Constraints
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Max Upload Size (MB)
                      </label>
                      <input
                        type="number"
                        defaultValue={50}
                        className="w-full bg-[#111115] border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Max Scenes per Project
                      </label>
                      <input
                        type="number"
                        defaultValue={100}
                        className="w-full bg-[#111115] border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Default Starting Credits
                      </label>
                      <input
                        type="number"
                        defaultValue={200}
                        className="w-full bg-[#111115] border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e] space-y-4">
                  <h3 className="font-semibold text-neutral-200 border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400" /> SMTP Email
                    Configuration
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        placeholder="smtp.mailgun.org"
                        className="w-full bg-[#111115] border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        SMTP Port
                      </label>
                      <input
                        type="text"
                        placeholder="587"
                        className="w-full bg-[#111115] border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        SMTP User
                      </label>
                      <input
                        type="text"
                        placeholder="postmaster@domain.com"
                        className="w-full bg-[#111115] border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e] space-y-4">
                  <h3 className="font-semibold text-neutral-200 border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" /> Security
                    Policies
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-neutral-300 font-medium">
                          Enforce 2FA for Admins
                        </div>
                        <div className="text-xs text-neutral-500">
                          Requires all admin accounts to use two-factor
                          authentication.
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            enforce_2fa:
                              settings.enforce_2fa === "true"
                                ? "false"
                                : "true",
                          })
                        }
                        className={`p-1 rounded-full ${
                          settings.enforce_2fa === "true"
                            ? "text-purple-500"
                            : "text-neutral-600"
                        }`}
                      >
                        {settings.enforce_2fa === "true" ? (
                          <ToggleRight className="w-8 h-8" />
                        ) : (
                          <ToggleLeft className="w-8 h-8" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-neutral-300 font-medium">
                          Strict IP Binding
                        </div>
                        <div className="text-xs text-neutral-500">
                          Invalidate sessions if the IP address changes
                          suddenly.
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            strict_ip_binding:
                              settings.strict_ip_binding === "true"
                                ? "false"
                                : "true",
                          })
                        }
                        className={`p-1 rounded-full ${
                          settings.strict_ip_binding === "true"
                            ? "text-purple-500"
                            : "text-neutral-600"
                        }`}
                      >
                        {settings.strict_ip_binding === "true" ? (
                          <ToggleRight className="w-8 h-8" />
                        ) : (
                          <ToggleLeft className="w-8 h-8" />
                        )}
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.session_timeout || "120"}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            session_timeout: e.target.value,
                          })
                        }
                        className="w-full sm:max-w-xs bg-[#111115] border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-neutral-800 rounded-lg bg-[#0b0b0e] space-y-4">
                  <h3 className="font-semibold text-neutral-200 border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" /> Webhook
                    Configuration
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      System Events Webhook URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={
                          settings.webhookUrl ||
                          "https://api.sonikoma.com/webhooks"
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            webhookUrl: e.target.value,
                          })
                        }
                        className="flex-1 bg-[#111115] border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                      <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Test
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Fires on user creation, project rendering, and high
                      severity errors.
                    </p>
                  </div>
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
        {activeTab === "health" && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* API Server Card */}
              <div className="bg-[#111115] border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" /> API Server
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded">
                    ONLINE
                  </span>
                </div>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex justify-between">
                    <span>Uptime:</span>{" "}
                    <span className="font-mono text-neutral-200">
                      {stats.uptime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU Usage:</span>{" "}
                    <span className="font-mono text-neutral-200">
                      {stats.cpuPct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory:</span>{" "}
                    <span className="font-mono text-neutral-200">
                      {stats.memory}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111115] border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <ActivitySquare className="w-4 h-4 text-emerald-400" />{" "}
                    Real-time Traffic
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded">
                    LIVE
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Active WebSocket:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      142
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Requests / Sec:</span>
                    <span className="font-mono text-white">45</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Error Rate (5xx):</span>
                    <span className="font-mono text-white">0.02%</span>
                  </div>
                  <div className="h-12 flex items-end gap-1 mt-2">
                    {[12, 15, 14, 20, 45, 30, 22, 18, 25, 40, 15, 20].map(
                      (v, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-emerald-500/20 rounded-t-sm"
                          style={{ height: `${(v / 45) * 100}%` }}
                        ></div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#111115] border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-blue-400" /> Database
                    (SQLite)
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded">
                    HEALTHY
                  </span>
                </div>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex justify-between">
                    <span>Read Latency:</span>{" "}
                    <span className="font-mono text-blue-400">
                      {stats.dbLatencyMs} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Users:</span>{" "}
                    <span className="font-mono text-neutral-200">
                      {stats.users}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Projects:</span>{" "}
                    <span className="font-mono text-neutral-200">
                      {stats.projects}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111115] border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" /> GPU Workers
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded">
                    READY
                  </span>
                </div>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex justify-between">
                    <span>Total Registered:</span>{" "}
                    <span className="font-mono text-neutral-200">
                      {stats.gpuWorkers?.total || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Busy Rendering:</span>{" "}
                    <span className="font-mono text-amber-400">
                      {stats.gpuWorkers?.busy || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Idle / Waiting:</span>{" "}
                    <span className="font-mono text-emerald-400">
                      {stats.gpuWorkers?.idle || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Memory */}
              <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <ActivitySquare className="w-5 h-5 text-amber-400" /> System
                  Memory
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Heap Total</span>
                    <span className="text-white font-mono">1.2 GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Heap Used</span>
                    <span className="text-white font-mono">850 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">External</span>
                    <span className="text-white font-mono">320 MB</span>
                  </div>
                  <div className="w-full bg-[#0b0b0e] rounded-full h-2 mt-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: "70%" }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Background Services */}
              <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" /> Background
                  Services
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Redis Cache</span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                      Online
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Render Workers</span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                      3 Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Email Queue</span>
                    <span className="px-2.5 py-1 bg-neutral-800 text-neutral-400 rounded-full text-xs font-medium border border-neutral-700">
                      Idle (0)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Cron Jobs</span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                      Running
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: ACTIVITY */}
        {activeTab === "activity" &&
          (() => {
            const filteredLogs = globalLogs.filter((log) => {
              const matchesSearch =
                (log.action || "")
                  .toLowerCase()
                  .includes(logSearch.toLowerCase()) ||
                (log.user_email || "")
                  .toLowerCase()
                  .includes(logSearch.toLowerCase());
              const matchesSeverity =
                logSeverityFilter === "all" ||
                (log.status || "info").toLowerCase() === logSeverityFilter;
              const matchesIp =
                !logIpFilter || (log.ip_address || "").includes(logIpFilter);
              return matchesSearch && matchesSeverity && matchesIp;
            });

            return (
              <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#111115] border border-neutral-800 rounded-xl p-4">
                  <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Search logs by action or user..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="w-full bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <select
                      value={logSeverityFilter}
                      onChange={(e) => setLogSeverityFilter(e.target.value)}
                      className="bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="all">All Severities</option>
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warn">Warning</option>
                      <option value="error">Error</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Filter by IP..."
                      value={logIpFilter}
                      onChange={(e) => setLogIpFilter(e.target.value)}
                      className="w-full sm:w-32 bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <p className="text-sm text-neutral-500 font-medium whitespace-nowrap">
                      Showing {filteredLogs.length} logs
                    </p>
                    <button
                      onClick={() => {
                        const csv =
                          "Time,User,Action,IP,Status\n" +
                          filteredLogs
                            .map(
                              (l) =>
                                `"${new Date(
                                  l.created_at
                                ).toLocaleString()}","${
                                  l.user_email || "System"
                                }","${l.action}","${l.ip_address || ""}","${
                                  l.status || "info"
                                }"`
                            )
                            .join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "activity_logs.csv";
                        a.click();
                      }}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-[#0b0b0e]">
                    <h2 className="font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-400" /> Global
                      Activity Feed
                    </h2>
                    <button
                      onClick={fetchGlobalLogs}
                      className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <ActivitySquare className="w-3 h-3" /> Refresh
                    </button>
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
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-12 text-center text-neutral-500"
                            >
                              Loading logs...
                            </td>
                          </tr>
                        ) : filteredLogs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-12 text-center text-neutral-500"
                            >
                              No activity logs match your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredLogs.map((log) => (
                            <tr
                              key={log.id}
                              className="hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-6 py-3 text-neutral-500 font-mono text-xs">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-3 font-medium text-neutral-300">
                                {log.email || "Unknown"}
                              </td>
                              <td className="px-6 py-3 text-neutral-200">
                                {log.action}
                              </td>
                              <td className="px-6 py-3 text-neutral-500 font-mono text-xs">
                                {log.ip_address}
                              </td>
                              <td className="px-6 py-3">
                                <span
                                  className={
                                    log.status === "Success"
                                      ? "text-emerald-400"
                                      : "text-rose-400"
                                  }
                                >
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>

      {/* Modals: User Logs, Edit User, Delete User */}
      {viewLogsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" /> Activity Logs
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  {viewLogsUser.email}
                </p>
              </div>
              <button
                onClick={() => setViewLogsUser(null)}
                className="text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {loadingLogs ? (
                <div className="p-12 text-center text-neutral-500">
                  Loading logs...
                </div>
              ) : userLogs.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">
                  No recent activity found.
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/50">
                  {userLogs.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-4 hover:bg-white/[0.02] flex items-start gap-4"
                    >
                      <div className="mt-1">
                        {log.action.toLowerCase().includes("login") ? (
                          <Shield className="w-4 h-4 text-emerald-400" />
                        ) : log.action.toLowerCase().includes("delete") ? (
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Activity className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-200 font-medium">
                          {log.action}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-mono">
                          <span>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>IP: {log.ip_address}</span>
                          <span>•</span>
                          <span
                            className={
                              log.status === "Success"
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {log.status}
                          </span>
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
              <h3 className="text-lg font-bold text-white">
                Edit User Profile
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                Updating settings for {editingUser.email}
              </p>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">
                  Creator Role
                </label>
                <select
                  value={editingUser.creator_role || "user"}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      creator_role: e.target.value,
                    })
                  }
                  className="w-full bg-[#0b0b0e] border border-neutral-800 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="user">User</option>
                  <option value="pro">Studio Pro</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">
                  Compute Credits
                </label>
                <input
                  type="number"
                  value={editingUser.credits}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, credits: e.target.value })
                  }
                  className="w-full bg-[#0b0b0e] border border-neutral-800 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:border-purple-500/50"
                  min="0"
                  step="10"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#111115] border border-rose-500/20 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-neutral-800 flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-full text-rose-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Permanently Delete User?
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  {deletingUser.email}
                </p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
                Are you sure you want to delete this user? This action is{" "}
                <strong className="text-rose-400">irreversible</strong> and will
                permanently delete all of their projects, scenes, generated
                assets, invoices, and settings.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors"
                >
                  Yes, Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
