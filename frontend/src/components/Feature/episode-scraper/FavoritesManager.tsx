import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';

export interface FavoriteSeries {
  title_no: string;
  title: string;
  genre?: string;
  cover_image?: string;
  timestamp: number;
  url?: string;
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
    recent = recent.filter((r) => r.title_no !== series.title_no);
    recent.unshift({
      ...series,
      timestamp: Date.now(),
    });
    recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  static clearRecent() {
    localStorage.setItem(RECENT_KEY, JSON.stringify([]));
  }

  static getBookmarks(): string[] {
    try {
      const data = localStorage.getItem('sonikoma_bookmarked_episodes');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addBookmark(url: string) {
    const bookmarks = this.getBookmarks();
    if (!bookmarks.includes(url)) {
      bookmarks.push(url);
      localStorage.setItem('sonikoma_bookmarked_episodes', JSON.stringify(bookmarks));
    }
  }

  static removeBookmark(url: string) {
    const bookmarks = this.getBookmarks().filter((u) => u !== url);
    localStorage.setItem('sonikoma_bookmarked_episodes', JSON.stringify(bookmarks));
  }

  static isBookmarked(url: string): boolean {
    return this.getBookmarks().includes(url);
  }

  static getReadEpisodes(): string[] {
    try {
      const data = localStorage.getItem('sonikoma_read_episodes');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static markAsRead(url: string) {
    const readUrls = this.getReadEpisodes();
    if (!readUrls.includes(url)) {
      readUrls.push(url);
      localStorage.setItem('sonikoma_read_episodes', JSON.stringify(readUrls));
    }
  }

  static markAsUnread(url: string) {
    const readUrls = this.getReadEpisodes().filter((u) => u !== url);
    localStorage.setItem('sonikoma_read_episodes', JSON.stringify(readUrls));
  }

  static isRead(url: string): boolean {
    return this.getReadEpisodes().includes(url);
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
          className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-purple-600/50 transition-shadow group flex flex-col"
        >
          {series.cover_image && (
            <img
              src={series.cover_image}
              alt={series.title}
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-2 flex flex-col justify-between flex-grow">
            <div>
              <h4 className="text-xs font-medium text-white truncate group-hover:text-purple-300">
                {series.title}
              </h4>
              <div className="flex items-center justify-between gap-1 mt-1">
                {series.genre && (
                  <span className="text-[10px] text-gray-400 truncate">{series.genre}</span>
                )}
                {series.url && (
                  <a
                    href={series.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-purple-400 transition-colors flex-shrink-0"
                    title="Open original WEBTOON page"
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={(e) => handleRemove(series.title_no, e)}
              className="mt-2 w-full px-2 py-1 text-[11px] bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded transition-colors flex items-center justify-center gap-1"
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
