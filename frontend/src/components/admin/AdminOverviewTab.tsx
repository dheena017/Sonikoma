import React from "react";
import {
  Users,
  Activity,
  Server,
  FolderGit2,
  TrendingUp,
  Clock,
  ShieldCheck,
} from "lucide-react";

export function AdminOverviewTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-purple-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-neutral-400 font-medium">Total Users</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.users?.toLocaleString() || "0"}
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>+12% this week</span>
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FolderGit2 className="w-16 h-16 text-blue-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FolderGit2 className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-neutral-400 font-medium">Total Projects</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.projects?.toLocaleString() || "0"}
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>+5% this week</span>
          </div>
        </div>

        {/* Server Uptime Card */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-neutral-400 font-medium">System Uptime</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.uptime || "99.9%"}
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>All systems operational</span>
          </div>
        </div>

        {/* Resource Usage Card */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server className="w-16 h-16 text-amber-400" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Server className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-neutral-400 font-medium">Resource Usage</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.cpuPct || "0"}% CPU
          </div>
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <span>Memory: {stats.memory || "0MB"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Recent Activity Feed */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Platform Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="flex-1 text-neutral-300">
                New user <span className="font-semibold">john_doe</span>{" "}
                registered.
              </div>
              <div className="text-neutral-600">2 mins ago</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div className="flex-1 text-neutral-300">
                System backup completed successfully.
              </div>
              <div className="text-neutral-600">1 hour ago</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <div className="flex-1 text-neutral-300">
                Project <span className="font-semibold">"Epic Manga Edit"</span>{" "}
                rendered.
              </div>
              <div className="text-neutral-600">3 hours ago</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <div className="flex-1 text-neutral-300">
                High memory usage alert resolved.
              </div>
              <div className="text-neutral-600">5 hours ago</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border border-neutral-800 rounded-lg hover:border-purple-500 hover:bg-purple-500/5 transition-all text-left group">
              <h4 className="text-neutral-200 font-medium group-hover:text-purple-400 transition-colors">
                Broadcast Message
              </h4>
              <p className="text-sm text-neutral-500 mt-1">
                Send a global alert to all users
              </p>
            </button>
            <button className="p-4 border border-neutral-800 rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group">
              <h4 className="text-neutral-200 font-medium group-hover:text-emerald-400 transition-colors">
                Run Health Check
              </h4>
              <p className="text-sm text-neutral-500 mt-1">
                Diagnose services and database
              </p>
            </button>
            <button className="p-4 border border-neutral-800 rounded-lg hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left group">
              <h4 className="text-neutral-200 font-medium group-hover:text-blue-400 transition-colors">
                Export Logs
              </h4>
              <p className="text-sm text-neutral-500 mt-1">
                Download recent audit logs as CSV
              </p>
            </button>
            <button className="p-4 border border-neutral-800 rounded-lg hover:border-rose-500 hover:bg-rose-500/5 transition-all text-left group">
              <h4 className="text-neutral-200 font-medium group-hover:text-rose-400 transition-colors">
                Clear Cache
              </h4>
              <p className="text-sm text-neutral-500 mt-1">
                Reset system memory cache
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
