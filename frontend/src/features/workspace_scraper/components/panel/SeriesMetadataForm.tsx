import React from "react";
import { Layout } from "lucide-react";
import { parseWebtoonUrl, getProxiedImageUrl } from "@/shared/utils/url";
import { FavoritesManager } from "@/features/workspace_scraper/episode-scraper/utils/FavoritesManager";

export interface SeriesMetadataFormProps {
  seriesTitle?: string;
  setSeriesTitle?: (title: string) => void;
  chapterNumber?: string;
  setChapterNumber?: (num: string) => void;
  scrapedGenre?: string;
  setScrapedGenre?: (genre: string) => void;
  setTargetUrl?: (url: string) => void;
  setSeriesCoverImage?: (img: string) => void;
  setSeriesAuthor?: (author: string) => void;
  setSeriesSynopsis?: (synopsis: string) => void;
  setChapterTitle?: (title: string) => void;
}

export const SeriesMetadataForm: React.FC<SeriesMetadataFormProps> = ({
  seriesTitle = "",
  setSeriesTitle,
  chapterNumber = "",
  setChapterNumber,
  scrapedGenre = "",
  setScrapedGenre,
  setTargetUrl,
  setSeriesCoverImage,
  setSeriesAuthor,
  setSeriesSynopsis,
}) => {
  const [showTitleSuggestions, setShowTitleSuggestions] = React.useState(false);
  const [showGenreSuggestions, setShowGenreSuggestions] = React.useState(false);
  const titleContainerRef = React.useRef<HTMLDivElement>(null);
  const genreContainerRef = React.useRef<HTMLDivElement>(null);

  const titleSuggestions = React.useMemo(() => {
    try {
      const recents = FavoritesManager.getRecent();
      const favorites = FavoritesManager.getFavorites();
      const merged = [...recents, ...favorites];
      const uniqueMap = new Map();
      merged.forEach((item) => {
        if (item.title) uniqueMap.set(item.title, item);
      });
      return Array.from(uniqueMap.values()).slice(0, 8);
    } catch {
      return [];
    }
  }, [showTitleSuggestions]);

  const genreSuggestions = React.useMemo(() => {
    try {
      const recents = FavoritesManager.getRecent();
      const favorites = FavoritesManager.getFavorites();
      const merged = [...recents, ...favorites];
      const genres = new Set<string>();
      merged.forEach((item) => {
        if (item.genre) genres.add(item.genre.trim());
      });
      if (genres.size === 0) {
        [
          "Action",
          "Fantasy",
          "Romance",
          "Comedy",
          "Drama",
          "Thriller",
          "Slice of Life",
        ].forEach((g) => genres.add(g));
      }
      return Array.from(genres).slice(0, 8);
    } catch {
      return [];
    }
  }, [showGenreSuggestions]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        titleContainerRef.current &&
        !titleContainerRef.current.contains(event.target as Node)
      ) {
        setShowTitleSuggestions(false);
      }
      if (
        genreContainerRef.current &&
        !genreContainerRef.current.contains(event.target as Node)
      ) {
        setShowGenreSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
        <Layout className="w-3.5 h-3.5 text-purple-500" /> Series Identity
      </h3>
      <div className="space-y-3">
        <div className="space-y-1 relative" ref={titleContainerRef}>
          <label className="text-[10px] font-bold text-neutral-500 uppercase">
            Series Title
          </label>
          <input
            type="text"
            autoComplete="off"
            value={seriesTitle}
            onFocus={() => setShowTitleSuggestions(true)}
            onChange={(e) => {
              setSeriesTitle?.(e.target.value);
              setShowTitleSuggestions(false);
            }}
            placeholder="e.g. Boundless Necromancer"
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all"
          />
          {showTitleSuggestions && titleSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-neutral-850 rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-48 overflow-y-auto divide-y divide-neutral-900/50">
              {titleSuggestions.map((series, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSeriesTitle?.(series.title);
                    if (setScrapedGenre && series.genre)
                      setScrapedGenre(series.genre);
                    if (setTargetUrl && series.url) setTargetUrl(series.url);
                    if (setSeriesCoverImage && series.cover_image)
                      setSeriesCoverImage(series.cover_image);
                    if (setSeriesAuthor && series.author)
                      setSeriesAuthor(series.author);
                    if (setSeriesSynopsis && series.synopsis)
                      setSeriesSynopsis(series.synopsis);
                    setShowTitleSuggestions(false);
                  }}
                  className="w-full px-4 py-2.5 hover:bg-neutral-900/60 flex items-center gap-2 transition-colors text-left text-xs font-bold text-neutral-350 cursor-pointer"
                >
                  {series.cover_image && (
                    <img
                      src={getProxiedImageUrl(series.cover_image, series.url)}
                      alt=""
                      className="w-6 h-6 object-cover rounded border border-neutral-850"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3C/svg%3E";
                      }}
                    />
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="truncate">{series.title}</div>
                    {series.genre && (
                      <div className="text-[9px] text-neutral-500 font-mono">
                        {series.genre}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">
              Chapter #
            </label>
            <input
              type="text"
              value={chapterNumber}
              onChange={(e) => setChapterNumber?.(e.target.value)}
              placeholder="72"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all font-mono"
            />
          </div>
          <div className="space-y-1 relative" ref={genreContainerRef}>
            <label className="text-[10px] font-bold text-neutral-500 uppercase">
              Genre
            </label>
            <input
              type="text"
              autoComplete="off"
              value={scrapedGenre}
              onFocus={() => setShowGenreSuggestions(true)}
              onChange={(e) => {
                setScrapedGenre?.(e.target.value);
                setShowGenreSuggestions(false);
              }}
              placeholder="Fantasy"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all"
            />
            {showGenreSuggestions && genreSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-neutral-850 rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-48 overflow-y-auto divide-y divide-neutral-900/50">
                {genreSuggestions.map((genre, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setScrapedGenre?.(genre);
                      setShowGenreSuggestions(false);
                    }}
                    className="w-full px-4 py-2 hover:bg-neutral-900/60 transition-colors text-left text-xs font-bold text-neutral-350 cursor-pointer"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
