import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { Star } from "lucide-react";
import { DEFAULT_FAVORITES, FAVORITES_SUB_TABS } from "../../data/favoritesData";
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
  onTriggerFeedback: (msg: string) => void;
}

export const FavoritesWorkspace: React.FC<FavoritesWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(DEFAULT_FAVORITES);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const removeFavorite = (id: string, title: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    onTriggerFeedback(`Removed "${title}" from Favorites`);
  };

  const filtered = favorites.filter((f) => {
    const matchTab = activeTab === "All" || f.type.toLowerCase() === activeTab.toLowerCase();
    const matchSearch = !searchQuery.trim() || f.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const renderCard = (item: FavoriteItem) => {
    const handleUse = () => onTriggerFeedback(`Used "${item.title}" in project`);
    const handleRemove = () => removeFavorite(item.id, item.title);
    switch (item.type) {
      case "Characters": return <FavoriteCharacterCard key={item.id} item={item} onUse={handleUse} onRemove={handleRemove} />;
      case "Templates":  return <FavoriteTemplateCard  key={item.id} item={item} onUse={handleUse} onRemove={handleRemove} />;
      case "Audio":      return <FavoriteAudioCard     key={item.id} item={item} onUse={handleUse} onRemove={handleRemove} />;
      case "AI Studio":  return <FavoriteAiCard        key={item.id} item={item} onUse={handleUse} onRemove={handleRemove} />;
      default:           return <FavoriteCharacterCard key={item.id} item={item} onUse={handleUse} onRemove={handleRemove} />;
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
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <Star className="h-8 w-8 text-neutral-700 mx-auto" />
              <p className="text-xs text-neutral-500 font-mono">No favorited items here yet.</p>
              <p className="text-[10px] text-neutral-600 font-mono">
                Click ⭐ in any workspace to save items!
              </p>
            </div>
          )}
          {filtered.map((item) => renderCard(item))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Creator Quick Vault" />
    </WorkspaceLayout>
  );
};
