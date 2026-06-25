import React, { useState } from "react";
import { Megaphone, Plus, Trash2, Send, Clock, AlertTriangle } from "lucide-react";

export function AdminAnnouncementsTab() {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Scheduled Maintenance",
      message: "The server will be down for 30 minutes on Saturday at 2 AM EST.",
      type: "warning",
      status: "active",
      createdAt: "2026-06-20T10:00:00Z"
    },
    {
      id: 2,
      title: "New Feature Released!",
      message: "You can now export projects in 4K resolution. Enjoy!",
      type: "success",
      status: "expired",
      createdAt: "2026-06-15T14:30:00Z"
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState("info");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessage) return;
    
    setAnnouncements([{
      id: Date.now(),
      title: newTitle,
      message: newMessage,
      type: newType,
      status: "active",
      createdAt: new Date().toISOString()
    }, ...announcements]);
    
    setIsCreating(false);
    setNewTitle("");
    setNewMessage("");
    setNewType("info");
  };

  const handleDelete = (id: number) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
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
            Broadcast messages to all users. Active announcements will appear as a banner at the top of their workspace.
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
        <form onSubmit={handleCreate} className="bg-[#111115] border border-purple-500/30 rounded-xl p-6 animate-[fadeIn_0.2s_ease-out]">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Broadcast</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Server Maintenance"
                className="w-full bg-[#0b0b0e] border border-neutral-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Message</label>
              <textarea 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Enter the announcement details..."
                className="w-full bg-[#0b0b0e] border border-neutral-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 min-h-[100px]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value="info" 
                    checked={newType === "info"} 
                    onChange={e => setNewType(e.target.value)} 
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
                    onChange={e => setNewType(e.target.value)}
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
                    onChange={e => setNewType(e.target.value)}
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

      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No announcements found.
          </div>
        ) : (
          announcements.map(announcement => (
            <div key={announcement.id} className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start">
              <div className="p-3 rounded-lg flex-shrink-0" style={{
                backgroundColor: announcement.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                               announcement.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                color: announcement.type === 'warning' ? '#f59e0b' :
                       announcement.type === 'success' ? '#10b981' : '#3b82f6',
              }}>
                {announcement.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    announcement.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {announcement.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-neutral-400 mt-2">{announcement.message}</p>
                <div className="flex items-center gap-2 mt-4 text-xs text-neutral-500 font-medium">
                  <Clock className="w-3 h-3" />
                  {new Date(announcement.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-neutral-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
