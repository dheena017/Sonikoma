import React, { useEffect, useState } from "react";
import { Users, Shield, Clock, Mail, Coins, ShieldAlert } from "lucide-react";
import { useAppLogic } from "../hooks/useAppLogic";

export default function AdminPage({
  navigateTo,
}: {
  navigateTo: (path: string) => void;
}) {
  const { fetchWithInterceptor, isAuthenticated } = useAppLogic();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    
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
    fetchUsers();
  }, [isAuthenticated, fetchWithInterceptor]);

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

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Admin Dashboard
            </h1>
            <p className="text-neutral-400 mt-1">Manage and view all registered users across the platform.</p>
          </div>
          <div className="bg-[#111115] border border-neutral-800 rounded-lg px-4 py-3 flex items-center gap-4">
            <div className="p-2 bg-purple-900/30 rounded-md">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase font-semibold">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0b0b0e] text-neutral-400 border-b border-neutral-800 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Credits</th>
                  <th className="px-6 py-4 text-right">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      <div className="flex justify-center mb-3">
                        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      </div>
                      Loading database records...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      No users found in the database.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={u.id || i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full bg-neutral-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300 font-bold text-xs">
                              {u.full_name?.charAt(0) || u.email?.charAt(0) || "?"}
                            </div>
                          )}
                          <span className="font-medium text-neutral-200">
                            {u.full_name || "No Name"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Mail className="w-3.5 h-3.5" />
                          {u.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                          u.creator_role === 'pro' || u.creator_role === 'admin'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}>
                          {u.creator_role || "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                          <Coins className="w-3.5 h-3.5" />
                          {u.credits ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-500 font-mono text-xs flex items-center justify-end gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
