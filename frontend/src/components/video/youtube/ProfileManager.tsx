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
    <div className="bg-neutral-950/60 p-4 border border-neutral-850 rounded-xl space-y-3.5 font-mono text-xs text-neutral-450 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
        <span className="text-neutral-300 font-bold flex items-center gap-1.5">
          <FolderOpen className="h-4 w-4 text-purple-400" />
          Settings Profile Manager
        </span>
        <span className="text-[10px] text-purple-400 font-bold">
          Active: {currentProfileName || "None"}
        </span>
      </div>

      <div className="flex gap-2.5 items-center flex-wrap">
        <div className="flex-1 min-w-[200px] space-y-1">
          <span className="text-[9.5px] text-neutral-500 font-bold block">
            LOAD SETTINGS PROFILE:
          </span>
          <select
            value={currentProfileName}
            onChange={(e) => onLoadProfile(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none cursor-pointer"
          >
            <option value="">-- Choose Profile --</option>
            {profiles.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {currentProfileName && (
          <button
            onClick={() => onDeleteProfile(currentProfileName)}
            className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg text-[9.5px] font-bold self-end transition-colors cursor-pointer flex items-center gap-1"
            title="Delete this profile"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="pt-2 border-t border-neutral-900/60 space-y-2"
      >
        <span className="text-[9.5px] text-neutral-500 font-bold block">
          SAVE CURRENT CONFIG AS PROFILE:
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder="e.g. Action Recap Shorts, Romance Promo..."
            className="flex-1 bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newProfileName.trim()}
            className="px-3 bg-purple-650 hover:bg-purple-550 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
