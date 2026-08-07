import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { MOCK_RECENT_ITEMS, RECENT_SUB_TABS } from "../../data/recentData";
import { RecentWorkspaceHeader } from "./components/RecentWorkspaceHeader";
import { RecentMediaCard } from "./components/RecentMediaCard";
import { RecentAiCard } from "./components/RecentAiCard";
import { RecentTemplateCard } from "./components/RecentTemplateCard";
import { RecentFontCard } from "./components/RecentFontCard";
import { RecentAudioCard } from "./components/RecentAudioCard";

export interface RecentItem {
  id: string;
  title: string;
  category: "Recent Media" | "Recent AI" | "Recent Templates" | "Recent Fonts" | "Recent Audio";
  timeAgo: string;
  usesCount: number;
  badge?: string;
  iconName: "image" | "ai" | "template" | "font" | "audio";
}

interface RecentWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const RecentWorkspace: React.FC<RecentWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_RECENT_ITEMS.filter((item) => {
    const matchTab = activeTab === "All" || item.category.toLowerCase() === activeTab.toLowerCase();
    const matchSearch = !searchQuery.trim() || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const renderCard = (item: RecentItem) => {
    const handleAction = () => onTriggerFeedback(`Re-used "${item.title}" in project`);
    switch (item.iconName) {
      case "image":    return <RecentMediaCard    key={item.id} item={item} onAction={handleAction} />;
      case "ai":       return <RecentAiCard       key={item.id} item={item} onAction={handleAction} />;
      case "template": return <RecentTemplateCard key={item.id} item={item} onAction={handleAction} />;
      case "font":     return <RecentFontCard     key={item.id} item={item} onAction={handleAction} />;
      case "audio":    return <RecentAudioCard    key={item.id} item={item} onAction={handleAction} />;
      default:         return <RecentMediaCard    key={item.id} item={item} onAction={handleAction} />;
    }
  };

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <RecentWorkspaceHeader
        tabs={RECENT_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <WorkspaceLayout.Content>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-neutral-500 text-xs font-mono">
              No recent activity found.
            </div>
          )}
          {filtered.map((item) => renderCard(item))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Activity History" />
    </WorkspaceLayout>
  );
};
