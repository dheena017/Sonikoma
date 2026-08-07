import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { MEDIA_SUB_TABS, MOCK_MEDIA_ASSETS } from "../../data/mediaData";
import { UploadCloud, FolderKanban, Play, Star } from "lucide-react";

interface MediaWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
  scrapedImages?: any[];
  panels?: any[];
}

export const MediaWorkspace: React.FC<MediaWorkspaceProps> = ({
  onTriggerFeedback,
  scrapedImages = [],
  panels = [],
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssets = MOCK_MEDIA_ASSETS.filter((item) => {
    if (activeTab !== "All" && item.type.toLowerCase() !== activeTab.toLowerCase()) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    return item.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <WorkspaceLayout>
      <WorkspaceLayout.Header title="Media Workspace" />
      <WorkspaceLayout.Tabs tabs={MEDIA_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search media assets, panels, stock..." />
      <WorkspaceLayout.Content>
        {/* Upload dropzone */}
        <div
          onClick={() => onTriggerFeedback("File browser opened!")}
          className="rounded-2xl border-2 border-dashed border-neutral-700 hover:border-purple-500/70 bg-neutral-900/40 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2"
        >
          <UploadCloud className="h-6 w-6 text-purple-400" />
          <p className="text-xs font-bold text-white">Upload MP4 · PNG · MP3</p>
          <span className="text-[9px] text-neutral-400 font-mono">Drag &amp; drop or click to browse</span>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onTriggerFeedback(`Added "${asset.title}" to project`)}
              className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 h-28 cursor-pointer group hover:border-purple-500/60 transition-all flex flex-col justify-between p-2"
            >
              <img src={asset.url} alt={asset.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-[8px] font-mono font-bold bg-black/80 text-white px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                  {asset.badge}
                </span>
                <Star className="h-3 w-3 text-neutral-400 hover:text-amber-400" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-white truncate drop-shadow">{asset.title}</p>
                {asset.duration && <span className="text-[8px] text-neutral-300 font-mono">{asset.duration}</span>}
              </div>
            </div>
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Powered by Sonikoma Media Library" />
    </WorkspaceLayout>
  );
};
