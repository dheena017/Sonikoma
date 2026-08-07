import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { MEDIA_SUB_TABS, MOCK_MEDIA_ASSETS } from "../../data/mediaData";
import { MediaWorkspaceHeader } from "./components/MediaWorkspaceHeader";
import { MediaAiToolbar } from "./components/MediaAiToolbar";
import { MediaUploadZone } from "./components/MediaUploadZone";
import { MediaAssetCard } from "./components/MediaAssetCard";

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
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <MediaWorkspaceHeader
        onUpload={() => onTriggerFeedback("File upload browser opened!")}
        tabs={MEDIA_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Contextual AI Action Bar Component */}
      <MediaAiToolbar onTriggerFeedback={onTriggerFeedback} />
      <WorkspaceLayout.Content>
        {/* Upload dropzone Component */}
        <MediaUploadZone onOpenBrowser={() => onTriggerFeedback("File browser opened!")} />

        {/* Media Grid Component List */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {filteredAssets.map((asset) => (
            <MediaAssetCard
              key={asset.id}
              asset={asset}
              onSelect={() => onTriggerFeedback(`Added "${asset.title}" to project`)}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Powered by Sonikoma Media Library" />
    </WorkspaceLayout>
  );
};
