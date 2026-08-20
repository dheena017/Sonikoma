import React, { useState, useEffect, useMemo } from "react";
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
  Copy,
  Check,
  ExternalLink,
  Eye,
  Download,
  Terminal,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  X,
  Gauge,
  Sparkles,
} from "lucide-react";
import type { JobStatusResponse } from "@/api";
import JobInspectorModal from "@/shared/ui/modal/JobInspectorModal";

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
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedJob, setSelectedJob] = useState<JobStatusResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, typeFilter]);

  // Auto-refresh active running/queued jobs every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchJobs(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, statusFilter, typeFilter]);

  const fetchJobs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "150" });
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter && typeFilter !== "all") params.append("job_type", typeFilter);

      const res = await fetchWithInterceptor(`/api/auth/admin/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        
        // Sync selected job if open
        if (selectedJob) {
          const updated = (data.jobs || []).find((j: JobStatusResponse) => j.job_id === selectedJob.job_id);
          if (updated) setSelectedJob(updated);
        }
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
        if (selectedJob?.job_id === jobId) setSelectedJob(null);
        fetchJobs(false);
      }
    } catch {
      addNotification?.(`Failed to delete job`, "error");
    }
  };

  const handleCancelAllActive = async () => {
    if (!window.confirm("Are you sure you want to cancel all currently running and queued jobs?")) return;
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/jobs/cancel-all-active`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        addNotification?.(
          `Cancelled ${data.cancelled_count || 0} active jobs`,
          "success"
        );
        fetchJobs();
      }
    } catch {
      addNotification?.(`Failed to cancel active jobs`, "error");
    }
  };

  const handlePurgeCompleted = async () => {
    if (!window.confirm("Are you sure you want to purge all completed, failed, and cancelled jobs from the database?")) return;
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

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jobs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sonikoma_jobs_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addNotification?.("Exported jobs report as JSON", "success");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    addNotification?.(`Copied to clipboard`, "info");
  };

  // Distinct job types for filter
  const distinctJobTypes = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.job_type) set.add(j.job_type);
    });
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (typeFilter !== "all" && j.job_type !== typeFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        j.job_id.toLowerCase().includes(q) ||
        j.job_type.toLowerCase().includes(q) ||
        (j.project_id && j.project_id.toLowerCase().includes(q)) ||
        (j.chapter_id && j.chapter_id.toLowerCase().includes(q)) ||
        (j.user_id && j.user_id.toLowerCase().includes(q)) ||
        (j.stage && j.stage.toLowerCase().includes(q)) ||
        (j.execution?.model && j.execution.model.toLowerCase().includes(q))
      );
    });
  }, [jobs, searchQuery, typeFilter]);

  const totalCount = jobs.length;
  const runningCount = jobs.filter((j) => j.status === "running").length;
  const queuedCount = jobs.filter((j) => j.status === "queued").length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const successRate = totalCount > 0 ? Math.round((completedCount / (completedCount + failedCount || 1)) * 100) : 100;

  const calculateDuration = (job: JobStatusResponse) => {
    if (!job.started_at) return null;
    const start = new Date(job.started_at).getTime();
    const end = job.completed_at ? new Date(job.completed_at).getTime() : Date.now();
    const durationMs = end - start;
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${(durationMs / 60000).toFixed(1)}m`;
  };

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
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        <div className="bg-[#111115] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 uppercase font-medium">Total Jobs</span>
            <Layers className="w-4 h-4 text-neutral-500" />
          </div>
          <h4 className="text-2xl font-bold text-white mt-2">{totalCount}</h4>
        </div>

        <div className="bg-[#111115] border border-blue-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-400 uppercase font-medium">Running</span>
            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <h4 className="text-2xl font-bold text-blue-400 mt-2">{runningCount}</h4>
        </div>

        <div className="bg-[#111115] border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 uppercase font-medium">In Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-2xl font-bold text-amber-400 mt-2">{queuedCount}</h4>
        </div>

        <div className="bg-[#111115] border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 uppercase font-medium">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-2xl font-bold text-emerald-400 mt-2">{completedCount}</h4>
        </div>

        <div className="bg-[#111115] border border-rose-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 uppercase font-medium">Failed</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <h4 className="text-2xl font-bold text-rose-400 mt-2">{failedCount}</h4>
        </div>

        <div className="bg-[#111115] border border-violet-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-violet-400 uppercase font-medium">Success Rate</span>
            <Gauge className="w-4 h-4 text-violet-400" />
          </div>
          <h4 className="text-2xl font-bold text-violet-400 mt-2">{successRate}%</h4>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-[#111115] border border-neutral-800 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, model, stage, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
            {["all", "running", "queued", "completed", "failed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize text-xs transition-colors ${
                  statusFilter === st
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type Filter Dropdown */}
          {distinctJobTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by job operation type"
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-neutral-600"
            >
              <option value="all">All Types ({distinctJobTypes.length})</option>
              {distinctJobTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              autoRefresh
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
            title="Auto-refresh every 3s"
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
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg text-xs font-medium transition-colors"
            title="Export all background jobs as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          {runningCount + queuedCount > 0 && (
            <button
              onClick={handleCancelAllActive}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors"
              title="Cancel all active/queued jobs"
            >
              <StopCircle className="w-3.5 h-3.5" />
              Cancel All Active
            </button>
          )}

          <button
            onClick={handlePurgeCompleted}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors"
            title="Purge finished records from DB"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge Finished
          </button>
        </div>
      </div>

      {/* Main Jobs Table */}
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
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Project Context</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                    Loading system background jobs...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                    No matching background jobs found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const duration = calculateDuration(job);
                  return (
                    <tr
                      key={job.job_id}
                      onClick={() => setSelectedJob(job)}
                      className={`hover:bg-neutral-900/50 cursor-pointer transition-colors ${
                        selectedJob?.job_id === job.job_id ? "bg-neutral-900/80 border-l-2 border-blue-500" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-white font-medium">
                            {job.job_id}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(job.job_id);
                            }}
                            className="p-1 text-neutral-500 hover:text-neutral-300 rounded"
                            title="Copy Job ID"
                          >
                            {copiedId === job.job_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {job.created_at && (
                          <span className="text-[10px] text-neutral-500 block font-mono">
                            {new Date(job.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-neutral-200 block text-xs">
                          {job.job_type}
                        </span>
                        {job.capability && job.capability !== job.job_type && (
                          <span className="text-[11px] text-neutral-400 block">
                            Cap: {job.capability}
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

                      <td className="px-4 py-3 text-xs font-mono text-neutral-400">
                        {duration || "—"}
                      </td>

                      <td className="px-4 py-3 text-xs text-neutral-400 font-mono">
                        {job.project_id ? (
                          <div>
                            <span className="text-neutral-300 block">{job.project_id}</span>
                            {job.chapter_id && (
                              <span className="text-[11px] text-neutral-500 block">
                                {job.chapter_id}
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Inspect job details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(job.status === "running" || job.status === "queued") && (
                            <button
                              onClick={() => handleCancelJob(job.job_id)}
                              className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Cancel job"
                            >
                              <StopCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job.job_id)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete job record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Job Inspector Modal */}
      {selectedJob && (
        <JobInspectorModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onCancelJob={handleCancelJob}
          onDeleteJob={handleDeleteJob}
        />
      )}
    </div>
  );
}
