import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';

export interface FavoriteSeries {
  title_no: string;
  title: string;
  genre?: string;
  cover_image?: string;
  timestamp: number;
}

const STORAGE_KEY = 'sonikoma_favorite_series';
const RECENT_KEY = 'sonikoma_recent_series';
const MAX_RECENT = 10;

export class FavoritesManager {
  static getFavorites(): FavoriteSeries[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addFavorite(series: FavoriteSeries) {
    const favorites = this.getFavorites();
    const exists = favorites.find((f) => f.title_no === series.title_no);
    if (!exists) {
      favorites.push({
        ...series,
        timestamp: Date.now(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }

  static removeFavorite(title_no: string) {
    const favorites = this.getFavorites().filter((f) => f.title_no !== title_no);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }

  static isFavorite(title_no: string): boolean {
    return this.getFavorites().some((f) => f.title_no === title_no);
  }

  static getRecent(): FavoriteSeries[] {
    try {
      const data = localStorage.getItem(RECENT_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addRecent(series: FavoriteSeries) {
    let recent = this.getRecent();
    // Remove if already exists
    recent = recent.filter((r) => r.title_no !== series.title_no);
    // Add to beginning
    recent.unshift({
      ...series,
      timestamp: Date.now(),
    });
    // Keep only MAX_RECENT
    recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  static clearRecent() {
    localStorage.setItem(RECENT_KEY, JSON.stringify([]));
  }
}

interface FavoritesListProps {
  onSelectSeries: (series: FavoriteSeries) => void;
  showRecent?: boolean;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  onSelectSeries,
  showRecent = false,
}) => {
  const [items, setItems] = useState<FavoriteSeries[]>([]);

  useEffect(() => {
    const data = showRecent ? FavoritesManager.getRecent() : FavoritesManager.getFavorites();
    setItems(data);
  }, [showRecent]);

  const handleRemove = (title_no: string, e: React.MouseEvent) => {
    e.stopPropagation();
    FavoritesManager.removeFavorite(title_no);
    setItems(items.filter((item) => item.title_no !== title_no));
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400 bg-gray-800 rounded">
        <p className="text-sm">
          {showRecent ? 'No recently browsed series' : 'No favorite series yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((series) => (
        <div
          key={series.title_no}
          onClick={() => onSelectSeries(series)}
          className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-purple-600/50 transition-shadow group"
        >
          {series.cover_image && (
            <img
              src={series.cover_image}
              alt={series.title}
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-2">
            <h4 className="text-xs font-medium text-white truncate group-hover:text-purple-300">
              {series.title}
            </h4>
            {series.genre && <p className="text-xs text-gray-400 truncate">{series.genre}</p>}
            <button
              onClick={(e) => handleRemove(series.title_no, e)}
              className="mt-2 w-full px-2 py-1 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 size={12} />
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
