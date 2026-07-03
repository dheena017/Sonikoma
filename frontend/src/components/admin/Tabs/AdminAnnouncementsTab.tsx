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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111115] border border-neutral-800 rounded-xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-purple-400" />
            System Announcements
          </h2>
          <p className="text-neutral-400 mt-1">
            Broadcast messages to all users. Active announcements will appear as
            a banner at the top of their workspace.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-[#111115] border border-purple-500/30 rounded-xl p-6 animate-[fadeIn_0.2s_ease-out]"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Create New Broadcast
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Server Maintenance"
                className="w-full bg-[#0b0b0e] border border-neutral-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Message
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter the announcement details..."
                className="w-full bg-[#0b0b0e] border border-neutral-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 min-h-[100px]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="info"
                    checked={newType === "info"}
                    onChange={(e) => setNewType(e.target.value)}
                    className="accent-purple-500"
                  />
                  <span className="text-blue-400">Information</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="warning"
                    checked={newType === "warning"}
                    onChange={(e) => setNewType(e.target.value)}
                    className="accent-purple-500"
                  />
                  <span className="text-amber-400">Warning</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="success"
                    checked={newType === "success"}
                    onChange={(e) => setNewType(e.target.value)}
                    className="accent-purple-500"
                  />
                  <span className="text-emerald-400">Success</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Broadcast Now
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-[#111115] border border-neutral-800 rounded-xl p-5 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      announcement.type === "warning"
                        ? "bg-amber-500/10 text-amber-400"
                        : announcement.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-purple-500/10 text-purple-400"
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
                    <h4 className="text-white font-medium">
                      {announcement.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          announcement.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {announcement.status}
                      </span>
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(
                          announcement.created_at || announcement.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-neutral-300 text-sm pl-12">
                {announcement.message}
              </p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              No announcements found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
