import React, { useState, useEffect } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { Star } from "lucide-react";
import {
  DEFAULT_FAVORITES,
  FAVORITES_SUB_TABS,
} from "../../data/favoritesData";
import { FavoritesWorkspaceHeader } from "./components/FavoritesWorkspaceHeader";
import { FavoriteCharacterCard } from "./components/FavoriteCharacterCard";
import { FavoriteTemplateCard } from "./components/FavoriteTemplateCard";
import { FavoriteAudioCard } from "./components/FavoriteAudioCard";
import { FavoriteAiCard } from "./components/FavoriteAiCard";

export interface FavoriteItem {
  id: string;
  title: string;
  type: "Characters" | "Templates" | "Audio" | "AI Studio";
  workspace: string;
  badge?: string;
  img?: string;
}

interface FavoritesWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
}

const STORAGE_KEY = "sonikoma_editor_favorites";

export const FavoritesWorkspace: React.FC<FavoritesWorkspaceProps> = ({
  onTriggerFeedback = () => {},
  appLogic,
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_FAVORITES;
  });

  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites]);

  const removeFavorite = (id: string, title: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    onTriggerFeedback(`Removed "${title}" from Favorites`);
  };

  const filtered = favorites.filter((f) => {
    const matchTab =
      activeTab === "All" || f.type.toLowerCase() === activeTab.toLowerCase();
    const matchSearch =
      !searchQuery.trim() ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const renderCard = (item: FavoriteItem) => {
    const handleUse = () =>
      onTriggerFeedback(`Used "${item.title}" in project`);
    const handleRemove = () => removeFavorite(item.id, item.title);
    switch (item.type) {
      case "Characters":
        return (
          <FavoriteCharacterCard
            key={item.id}
            item={item}
            onUse={handleUse}
            onRemove={handleRemove}
          />
        );
      case "Templates":
        return (
          <FavoriteTemplateCard
            key={item.id}
            item={item}
            onUse={handleUse}
            onRemove={handleRemove}
          />
        );
      case "Audio":
        return (
          <FavoriteAudioCard
            key={item.id}
            item={item}
            onUse={handleUse}
            onRemove={handleRemove}
          />
        );
      case "AI Studio":
        return (
          <FavoriteAiCard
            key={item.id}
            item={item}
            onUse={handleUse}
            onRemove={handleRemove}
          />
        );
      default:
        return null;
    }
  };

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <FavoritesWorkspaceHeader
        tabs={FAVORITES_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <WorkspaceLayout.Content>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-xs font-mono">
            <Star className="h-6 w-6 mx-auto mb-2 text-neutral-600" />
            No favorites found in this section.
          </div>
        ) : (
          <div className="space-y-2">{filtered.map(renderCard)}</div>
        )}
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Persistent Favorites Engine" />
    </WorkspaceLayout>
  );
};
