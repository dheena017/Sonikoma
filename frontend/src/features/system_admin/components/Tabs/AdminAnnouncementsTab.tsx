import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Send,
  Clock,
  AlertTriangle,
} from "lucide-react";
import * as api from "@/api";

export function AdminAnnouncementsTab({
  fetchWithInterceptor,
}: {
  fetchWithInterceptor: (
    url: string,
    options?: RequestInit
  ) => Promise<Response>;
}) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState("info");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetchWithInterceptor("/api/auth/admin/announcements");
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (e) {
      console.error("Failed to fetch announcements:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessage) return;

    try {
      const res = await fetchWithInterceptor("/api/auth/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          message: newMessage,
          type: newType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreating(false);
        setNewTitle("");
        setNewMessage("");
        setNewType("info");
        fetchAnnouncements();
      }
    } catch (e) {
      console.error("Failed to create announcement:", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await (window as any).confirmAsync("Delete this announcement?")))
      return;
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/announcements/${id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (data.success) {
        setAnnouncements(announcements.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete announcement:", e);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Top Action Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[#E5E5E5] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#3B82F6]" />
            Active Platform Broadcasts
          </h3>
          <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
            Broadcast messages to all creators. Active announcements will appear
            as a banner across their workspace.
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="btn-primary px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 shadow-xl animate-[fadeIn_0.2s_ease-out]"
        >
          <h3 className="text-lg font-bold text-[#E5E5E5] mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#3B82F6]" />
            Create New Broadcast
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Scheduled Engine Maintenance (Sunday 02:00 UTC)"
                className="w-full bg-[#121212] border border-[#2F2F2F] text-[#E5E5E5] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#3B82F6] transition-all font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                Message Body
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter detailed announcement message..."
                className="w-full bg-[#121212] border border-[#2F2F2F] text-[#E5E5E5] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#3B82F6] min-h-[100px] transition-all resize-none font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                Severity / Type
              </label>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer bg-[#121212] border border-[#2F2F2F] px-3.5 py-1.5 rounded-xl hover:border-[#3B82F6]/60 transition-all">
                  <input
                    type="radio"
                    name="type"
                    value="info"
                    checked={newType === "info"}
                    onChange={(e) => setNewType(e.target.value)}
                    className="accent-[#3B82F6] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#3B82F6]">
                    💡 Information
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#121212] border border-[#2F2F2F] px-3.5 py-1.5 rounded-xl hover:border-[#F59E0B]/60 transition-all">
                  <input
                    type="radio"
                    name="type"
                    value="warning"
                    checked={newType === "warning"}
                    onChange={(e) => setNewType(e.target.value)}
                    className="accent-[#F59E0B] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#F59E0B]">
                    ⚠️ Warning
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#121212] border border-[#2F2F2F] px-3.5 py-1.5 rounded-xl hover:border-[#10B981]/60 transition-all">
                  <input
                    type="radio"
                    name="type"
                    value="success"
                    checked={newType === "success"}
                    onChange={(e) => setNewType(e.target.value)}
                    className="accent-[#10B981] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#10B981]">
                    ✅ Feature Launch
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#2F2F2F]">
            <button
              type="submit"
              className="btn-primary px-5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Now</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-mono font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 hover:border-[#3B82F6]/40 transition-all shadow-lg text-left"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      announcement.type === "warning"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : announcement.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
                    }`}
                  >
                    {announcement.type === "warning" ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : announcement.type === "success" ? (
                      <Megaphone className="w-5 h-5" />
                    ) : (
                      <Megaphone className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">
                      {announcement.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          announcement.status === "active"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                        }`}
                      >
                        {announcement.status}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {new Date(
                          announcement.created_at || announcement.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(announcement.id)}
                  title="Delete announcement"
                  className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-neutral-300 text-sm pl-13 leading-relaxed">
                {announcement.message}
              </p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-16 text-neutral-500 font-mono text-sm bg-neutral-900/40 border border-white/5 rounded-2xl">
              No platform announcements active. Click "New Announcement" to
              publish a broadcast.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
