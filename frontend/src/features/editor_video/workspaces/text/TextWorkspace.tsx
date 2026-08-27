import React, { useState, useEffect } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { TEXT_SUB_TABS, REAL_TEXT_PRESETS } from "../../data/textData";
import { TextWorkspaceHeader } from "./components/TextWorkspaceHeader";
import { TextAiToolbar } from "./components/TextAiToolbar";
import { TextQuickAddBar } from "./components/TextQuickAddBar";
import { TextPresetCard } from "./components/TextPresetCard";
import { preloadCommonFonts, loadGoogleFont } from "@/shared/utils/fontLoader";
import { editorEventBus } from "../../events/editorEventBus";

interface TextWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
}

export const TextWorkspace: React.FC<TextWorkspaceProps> = ({
  onTriggerFeedback = () => {},
  appLogic,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Preload real Google Fonts on mount
  useEffect(() => {
    preloadCommonFonts();
  }, []);

  const filteredPresets = REAL_TEXT_PRESETS.filter((preset) => {
    const tabMatch =
      activeTab === "All" ||
      preset.category.toLowerCase().replace("-", " ") === activeTab.toLowerCase();
    const searchMatch =
      !searchQuery.trim() ||
      preset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.previewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.fontFamily.toLowerCase().includes(searchQuery.toLowerCase());
    return tabMatch && searchMatch;
  });

  const handleApplyPreset = (preset: any) => {
    loadGoogleFont(preset.fontFamily);
    
    // Broadcast on EventBus to add subtitle/caption
    editorEventBus.publish("MEDIA_ADDED", {
      assetId: preset.id,
      title: preset.previewText,
      type: "subtitle",
    });

    onTriggerFeedback(`Applied "${preset.title}" typography`);
  };

  const handleQuickAdd = (type: string) => {
    const defaultText =
      type === "title"
        ? "NEW EPISODE TITLE"
        : type === "subtitle"
        ? "Dialogue subtitle text here..."
        : "Narration description...";

    editorEventBus.publish("MEDIA_ADDED", {
      assetId: `txt-${Date.now()}`,
      title: defaultText,
      type: "subtitle",
    });

    onTriggerFeedback(`Added ${type} to timeline V3 Subtitles track`);
  };

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <TextWorkspaceHeader
        tabs={TEXT_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Contextual AI Action Bar Component */}
      <TextAiToolbar onTriggerFeedback={onTriggerFeedback} />
      <WorkspaceLayout.Content>
        {/* Quick Add Buttons Component */}
        <TextQuickAddBar onAddText={handleQuickAdd} />

        {/* Real Google Fonts Typography Presets List */}
        <div className="space-y-2 pt-2">
          {filteredPresets.map((preset) => (
            <TextPresetCard
              key={preset.id}
              preset={preset}
              onSelect={() => handleApplyPreset(preset)}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Dynamic Typography Engine • Google Fonts" />
    </WorkspaceLayout>
  );
};
