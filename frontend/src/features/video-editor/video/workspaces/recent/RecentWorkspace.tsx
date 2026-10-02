import React, { useState, useEffect } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { MOCK_RECENT_ITEMS, RECENT_SUB_TABS } from "../../data/recentData";
import { RecentWorkspaceHeader } from "./components/RecentWorkspaceHeader";
import { RecentMediaCard } from "./components/RecentMediaCard";
import { RecentAiCard } from "./components/RecentAiCard";
import { RecentTemplateCard } from "./components/RecentTemplateCard";
import { RecentFontCard } from "./components/RecentFontCard";
import { RecentAudioCard } from "./components/RecentAudioCard";
import { Clock } from "lucide-react";

export interface RecentItem {
  id: string;
  title: string;
  category:
    | "Recent Media"
    | "Recent AI"
    | "Recent Templates"
    | "Recent Fonts"
    | "Recent Audio";
  timeAgo: string;
  usesCount: number;
  badge?: string;
  iconName: "image" | "ai" | "template" | "font" | "audio";
}

interface RecentWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
}

const STORAGE_KEY = "sonikoma_editor_recents";

export const RecentWorkspace: React.FC<RecentWorkspaceProps> = ({
  onTriggerFeedback = () => {},
  appLogic,
}) => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return MOCK_RECENT_ITEMS;
  });

  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentItems));
    }
  }, [recentItems]);

  const filtered = recentItems.filter((item) => {
    const matchTab =
      activeTab === "All" ||
      item.category.toLowerCase() === activeTab.toLowerCase();
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const renderCard = (item: RecentItem) => {
    const handleAction = () =>
      onTriggerFeedback(`Re-used "${item.title}" in project`);
    switch (item.iconName) {
      case "image":
        return (
          <RecentMediaCard key={item.id} item={item} onAction={handleAction} />
        );
      case "ai":
        return (
          <RecentAiCard key={item.id} item={item} onAction={handleAction} />
        );
      case "template":
        return (
          <RecentTemplateCard
            key={item.id}
            item={item}
            onAction={handleAction}
          />
        );
      case "font":
        return (
          <RecentFontCard key={item.id} item={item} onAction={handleAction} />
        );
      case "audio":
        return (
          <RecentAudioCard key={item.id} item={item} onAction={handleAction} />
        );
      default:
        return null;
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
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-xs font-mono">
            <Clock className="h-6 w-6 mx-auto mb-2 text-neutral-600" />
            No recent history items found.
          </div>
        ) : (
          <div className="space-y-2">{filtered.map(renderCard)}</div>
        )}
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Real History Tracker" />
    </WorkspaceLayout>
  );
};
