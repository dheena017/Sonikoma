import React, { useState, useEffect } from "react";
import {
  Activity,
  RefreshCw,
  Zap,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  Layers,
  Search,
  Filter,
  Cpu,
  StopCircle,
} from "lucide-react";
import type { JobStatusResponse } from "@/api";

interface AdminJobsTabProps {
  fetchWithInterceptor: typeof fetch;
  addNotification?: (msg: string, type?: string) => void;
}

export function AdminJobsTab({
  fetchWithInterceptor,
  addNotification,
}: AdminJobsTabProps) {
  const [jobs, setJobs] = useState<JobStatusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  // Auto-refresh active running/queued jobs every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchJobs(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, statusFilter]);

  const fetchJobs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const url =
        statusFilter && statusFilter !== "all"
          ? `/api/auth/admin/jobs?status=${statusFilter}&limit=100`
          : `/api/auth/admin/jobs?limit=100`;

      const res = await fetchWithInterceptor(url);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Admin jobs fetch failed", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/jobs/${jobId}/cancel`,
        { method: "POST" }
      );
      if (res.ok) {
        addNotification?.(`Job ${jobId} cancelled successfully`, "success");
        fetchJobs(false);
      } else {
        addNotification?.(`Failed to cancel job ${jobId}`, "error");
      }
    } catch {
      addNotification?.(`Error cancelling job ${jobId}`, "error");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/jobs/${jobId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        addNotification?.(`Job record deleted`, "success");
        fetchJobs(false);
      }
    } catch {
      addNotification?.(`Failed to delete job`, "error");
    }
  };

  const handlePurgeCompleted = async () => {
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/jobs/purge-completed`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        addNotification?.(
          `Purged ${data.purged_count || 0} finished jobs`,
          "success"
        );
        fetchJobs();
      }
    } catch {
      addNotification?.(`Failed to purge jobs`, "error");
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.job_id.toLowerCase().includes(q) ||
      j.job_type.toLowerCase().includes(q) ||
      (j.project_id && j.project_id.toLowerCase().includes(q)) ||
      (j.chapter_id && j.chapter_id.toLowerCase().includes(q)) ||
      (j.execution?.model && j.execution.model.toLowerCase().includes(q))
    );
  });

  const totalCount = jobs.length;
  const runningCount = jobs.filter((j) => j.status === "running").length;
  const queuedCount = jobs.filter((j) => j.status === "queued").length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            Running
          </span>
        );
      case "queued":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Queued
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
            <StopCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase font-medium">Total Tracked</p>
          <h4 className="text-2xl font-bold text-white mt-1">{totalCount}</h4>
        </div>
        <div className="bg-[#111115] border border-blue-500/20 rounded-xl p-4">
          <p className="text-xs text-blue-400 uppercase font-medium">Active Running</p>
          <h4 className="text-2xl font-bold text-blue-400 mt-1">{runningCount}</h4>
        </div>
        <div className="bg-[#111115] border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-amber-400 uppercase font-medium">In Queue</p>
          <h4 className="text-2xl font-bold text-amber-400 mt-1">{queuedCount}</h4>
        </div>
        <div className="bg-[#111115] border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-emerald-400 uppercase font-medium">Completed</p>
          <h4 className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</h4>
        </div>
        <div className="bg-[#111115] border border-rose-500/20 rounded-xl p-4">
          <p className="text-xs text-rose-400 uppercase font-medium">Failed</p>
          <h4 className="text-2xl font-bold text-rose-400 mt-1">{failedCount}</h4>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-[#111115] border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by job_id, type, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
            {["all", "running", "queued", "completed", "failed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              autoRefresh
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-neutral-900 border-neutral-800 text-neutral-400"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto-Sync
          </button>

          <button
            onClick={() => fetchJobs(true)}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePurgeCompleted}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge Finished
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/60 text-xs uppercase text-neutral-400 border-b border-neutral-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Operation / Type</th>
                <th className="px-4 py-3">Status & Progress</th>
                <th className="px-4 py-3">Current Stage</th>
                <th className="px-4 py-3">AI Model / Provider</th>
                <th className="px-4 py-3">Project Context</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                    Loading system background jobs...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    No active or historical background jobs found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr
                    key={job.job_id}
                    className="hover:bg-neutral-900/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-white font-medium">
                      {job.job_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-neutral-200 block text-xs">
                        {job.job_type}
                      </span>
                      {job.capability && job.capability !== job.job_type && (
                        <span className="text-[11px] text-neutral-500 block">
                          Capability: {job.capability}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        {getStatusBadge(job.status)}
                        {job.status === "running" && (
                          <div className="w-28 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-300 font-mono">
                      {job.stage || "queued"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {job.execution?.model ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[11px]">
                          <Cpu className="w-3 h-3 text-neutral-400" />
                          {job.execution.model}
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400 font-mono">
                      {job.project_id ? (
                        <span className="text-neutral-300">{job.project_id}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(job.status === "running" || job.status === "queued") && (
                          <button
                            onClick={() => handleCancelJob(job.job_id)}
                            className="p-1 text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                            title="Cancel job"
                          >
                            <StopCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteJob(job.job_id)}
                          className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete job record"
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
    </div>
  );
}
