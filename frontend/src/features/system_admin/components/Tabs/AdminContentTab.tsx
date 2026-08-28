import React, { useState, useEffect } from "react";
import {
  Search,
  FolderGit2,
  ActivitySquare,
  Archive,
  Flag,
  RefreshCw,
  Trash2,
  User,
  Hash,
  Clock,
  ExternalLink,
  AlertTriangle,
  X,
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils";
import { adminGetProjects } from "@/api";

export function AdminContentTab({
  fetchWithInterceptor,
  addNotification,
}: {
  fetchWithInterceptor: any;
  addNotification: any;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState("");
  const [moderationFilter, setModerationFilter] = useState("all");

  // Justification Modal
  const [pendingAction, setPendingAction] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await adminGetProjects(fetchWithInterceptor);
      if (data.success) setProjects(data.projects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const executeProjectAction = async () => {
    if (!pendingAction) return;
    if (!reason.trim()) {
      addNotification("Justification reason is required", "warning");
      return;
    }

    const { id, type, payload } = pendingAction;
    try {
      let res;
      if (type === "DELETE") {
        res = await fetchWithInterceptor(`/api/auth/admin/projects/${id}`, {
          method: "DELETE",
        });
      } else {
        res = await fetchWithInterceptor(`/api/auth/admin/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, reason }),
        });
      }

      if (res.ok) {
        addNotification(`Action ${type} completed`, "success");
        setPendingAction(null);
        setReason("");
        fetchProjects();
      }
    } catch (err) {
      addNotification("Action failed", "error");
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      (p.title || "").toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.user_email || "")
        .toLowerCase()
        .includes(projectSearch.toLowerCase()) ||
      (p.author || "").toLowerCase().includes(projectSearch.toLowerCase());
    const isFlagged = p.is_flagged === 1;
    const matchesMod =
      moderationFilter === "all" ||
      (moderationFilter === "flagged" && isFlagged) ||
      (moderationFilter === "clean" && !isFlagged) ||
      (moderationFilter === "archived" && p.status === "archived");

    return matchesSearch && matchesMod;
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-4 shadow-md">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by Title, Author, or Creator..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full bg-[#121212] border border-[#2F2F2F] text-xs sm:text-sm text-[#E5E5E5] rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 placeholder:text-[#6B7280] transition-all"
            />
          </div>
          <select
            value={moderationFilter}
            onChange={(e) => setModerationFilter(e.target.value)}
            className="bg-[#121212] border border-[#2F2F2F] text-xs sm:text-sm text-[#E5E5E5] rounded-xl px-4 py-2.5 outline-none focus:border-[#3B82F6] cursor-pointer transition-all font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="clean">Clean</option>
            <option value="flagged">Flagged</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <p className="text-xs text-[#9CA3AF] font-mono font-bold whitespace-nowrap">
          {filteredProjects.length} Projects found
        </p>
      </div>

      <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#2F2F2F] flex justify-between items-center bg-[#141414]">
          <h2 className="font-bold text-[#E5E5E5] flex items-center gap-2 text-sm sm:text-base">
            <FolderGit2 className="w-4 h-4 text-[#3B82F6]" /> Content Inventory
          </h2>
          <button
            onClick={fetchProjects}
            className="btn-secondary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-mono"
          >
            <ActivitySquare className="w-3.5 h-3.5 text-[#3B82F6]" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#141414] text-[#9CA3AF] border-b border-[#2F2F2F] text-xs uppercase font-mono font-bold">
              <tr>
                <th className="px-6 py-4">Series Info</th>
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2F2F2F]">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[#9CA3AF] font-mono text-xs"
                  >
                    Scanning content registry...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[#9CA3AF] font-mono text-xs"
                  >
                    No projects match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#262626] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {p.cover_image ? (
                          <img
                            src={getProxiedImageUrl(p.cover_image)}
                            alt=""
                            className="w-10 h-14 object-cover rounded-xl bg-black border border-[#2F2F2F]"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-[#121212] rounded-xl border border-[#2F2F2F] flex items-center justify-center">
                            <FolderGit2 className="w-4 h-4 text-[#6B7280]" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#E5E5E5] group-hover:text-[#3B82F6] transition-colors flex items-center gap-1">
                            {p.title || "Untitled"}
                            {p.is_flagged === 1 && (
                              <Flag className="w-3 h-3 text-[#EF4444] fill-[#EF4444]" />
                            )}
                          </p>
                          <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                            {p.id.substring(0, 16)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-neutral-300 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-neutral-500" />{" "}
                          {p.user_email || "System"}
                        </p>
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />{" "}
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-[11px]">
                        <p className="text-neutral-400 font-medium">
                          Author:{" "}
                          <span className="text-neutral-200">
                            {p.author || "N/A"}
                          </span>
                        </p>
                        <p className="text-neutral-400 font-medium flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Chapters:{" "}
                          <span className="text-neutral-200 font-mono">
                            {p.chapters_count || 0}
                          </span>
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === "archived"
                            ? "bg-neutral-800 text-neutral-500 border border-neutral-700"
                            : p.status === "processing"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {p.status || "ready"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setPendingAction({
                              id: p.id,
                              type: "FLAG",
                              payload: { is_flagged: p.is_flagged ? 0 : 1 },
                            })
                          }
                          className={`p-1.5 rounded-md border ${
                            p.is_flagged
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700"
                          }`}
                          title="Toggle Flag"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setPendingAction({
                              id: p.id,
                              type: "STATUS",
                              payload: {
                                status:
                                  p.status === "archived"
                                    ? "pending"
                                    : "archived",
                              },
                            })
                          }
                          className={`p-1.5 rounded-md border ${
                            p.status === "archived"
                              ? "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
                              : "bg-[#181818] text-[#9CA3AF] border-[#2F2F2F] hover:bg-[#262626]"
                          }`}
                          title={
                            p.status === "archived" ? "Restore" : "Archive"
                          }
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setPendingAction({
                              id: p.id,
                              type: "REPROCESS",
                              payload: { status: "pending" },
                            })
                          }
                          className="p-1.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md border border-[#3B82F6]/20 hover:bg-[#3B82F6]/20 transition-colors"
                          title="Force Reprocess"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setPendingAction({
                              id: p.id,
                              type: "DELETE",
                              payload: {},
                            })
                          }
                          className="p-1.5 bg-[#EF4444]/10 text-[#EF4444] rounded-md border border-[#EF4444]/20 hover:bg-[#EF4444]/20 transition-colors"
                          title="Delete Permanent"
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

      {/* Action Justification Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#181818] border border-[#2F2F2F] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Audit Justification
              </h3>
              <button
                onClick={() => {
                  setPendingAction(null);
                  setReason("");
                }}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0b0b0e] border border-neutral-800 rounded-lg p-3 mb-4">
              <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">
                Requested Action
              </div>
              <div className="text-sm text-neutral-200">
                {pendingAction.type === "DELETE"
                  ? "Permanent Project Deletion"
                  : pendingAction.type === "FLAG"
                  ? pendingAction.payload.is_flagged
                    ? "Flag Project"
                    : "Remove Flag"
                  : pendingAction.type === "STATUS"
                  ? `Change status to ${pendingAction.payload.status}`
                  : "Force Reprocessing"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-500">
                Provide a reason or ticket number for this action:
              </label>
              <textarea
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Terms of Service violation, User request, Ticket #1234..."
                className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl p-3 text-sm text-white h-24 focus:border-[#3B82F6] outline-none transition-colors"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setPendingAction(null);
                  setReason("");
                }}
                className="btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executeProjectAction}
                className="btn-primary flex-1 py-2 rounded-xl text-xs font-bold"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
