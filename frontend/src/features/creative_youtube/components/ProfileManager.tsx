import React, { useState } from "react";
import { Copy, Save, Trash2, FolderOpen } from "lucide-react";

export interface PublisherProfile {
  name: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  privacy: string;
  isShort: boolean;
  madeForKids: string;
  paidPromotion: boolean;
  license: string;
  videoLanguage: string;
  channelLink: string;
  discordLink: string;
  patreonLink: string;
  playlist: string;
  authorName: string;
  artistName: string;
  webtoonPlatform: string;
  customPlatform?: string;
  chapterStart: string;
  chapterEnd: string;
  subtitlesType: string;
  subtitlesLanguage: string;
}

interface ProfileManagerProps {
  currentProfileName: string;
  profiles: PublisherProfile[];
  onSaveProfile: (profileName: string) => void;
  onLoadProfile: (profileName: string) => void;
  onDeleteProfile: (profileName: string) => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function ProfileManager({
  currentProfileName,
  profiles,
  onSaveProfile,
  onLoadProfile,
  onDeleteProfile,
  addNotification,
}: ProfileManagerProps) {
  const [newProfileName, setNewProfileName] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProfileName.trim();
    if (!name) return;

    onSaveProfile(name);
    setNewProfileName("");
  };

  return (
    <div className="bg-neutral-950/40 backdrop-blur-sm p-5 border border-neutral-900 rounded-2xl space-y-4 font-mono text-xs text-neutral-400 animate-fade-in transition-all duration-305 hover:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
        <span className="text-neutral-200 font-bold flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-purple-400" />
          Settings Profile Manager
        </span>
        <span className="text-[10px] text-purple-400 font-bold bg-purple-950/30 border border-purple-900/30 rounded-md px-2 py-0.5">
          Active: {currentProfileName || "None"}
        </span>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex-grow min-w-[200px] space-y-1.5">
          <span className="text-[10px] text-neutral-500 font-bold block">
            LOAD SETTINGS PROFILE:
          </span>
          <select
            value={currentProfileName}
            onChange={(e) => onLoadProfile(e.target.value)}
            className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2.5 text-xs text-neutral-300 focus:outline-none cursor-pointer shadow-inner"
          >
            <option value="" className="bg-neutral-950">-- Choose Profile --</option>
            {profiles.map((p) => (
              <option key={p.name} value={p.name} className="bg-neutral-950">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {currentProfileName && (
          <button
            onClick={() => onDeleteProfile(currentProfileName)}
            className="px-3.5 py-2.5 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 text-red-400 hover:text-red-300 rounded-xl text-[10px] font-bold self-end transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-98"
            title="Delete this profile"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="pt-3 border-t border-neutral-900 space-y-2.5"
      >
        <span className="text-[10px] text-neutral-500 font-bold block">
          SAVE CURRENT CONFIG AS PROFILE:
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder="e.g. Action Recap Shorts, Romance Promo..."
            className="flex-1 bg-neutral-955/30 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none shadow-inner"
          />
          <button
            type="submit"
            disabled={!newProfileName.trim()}
            className="px-4 bg-purple-650 hover:bg-purple-550 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-98 shadow-md"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
