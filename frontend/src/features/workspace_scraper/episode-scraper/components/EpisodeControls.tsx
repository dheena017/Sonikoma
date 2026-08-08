import React, { useState } from 'react';
import { 
  Filter, 
  Search, 
  Heart, 
  Clock, 
  Bookmark, 
  CheckSquare, 
  FileJson, 
  Download, 
  RefreshCw,
  Star,
  ThumbsUp,
  CheckCircle2
} from 'lucide-react';

interface EpisodeControlsProps {
  onSortChange: (sortBy: 'latest' | 'oldest' | 'rating' | 'likes') => void;
  onSearchChange: (query: string) => void;
  onDateRangeChange: (fromDate: string, toDate: string) => void;
  onToggleFavorites: () => void;
  onToggleRecent: () => void;
  showFavorites?: boolean;
  showRecent?: boolean;

  minRating: number;
  onMinRatingChange: (val: number) => void;
  minLikes: number;
  onMinLikesChange: (val: number) => void;
  readStatus: 'all' | 'read' | 'unread';
  onReadStatusChange: (val: 'all' | 'read' | 'unread') => void;
  bookmarksOnly: boolean;
  onBookmarksOnlyToggle: () => void;

  isMultiSelectMode: boolean;
  onToggleMultiSelectMode: () => void;

  startEpisodeNum?: string;
  onStartEpisodeChange?: (val: string) => void;
  endEpisodeNum?: string;
  onEndEpisodeChange?: (val: string) => void;

  onClearFilters: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onMarkAllRead?: () => void;
  onMarkAllUnread?: () => void;
}

export const EpisodeControls: React.FC<EpisodeControlsProps> = ({
  onSortChange,
  onSearchChange,
  onDateRangeChange,
  onToggleFavorites,
  onToggleRecent,
  showFavorites = false,
  showRecent = false,

  minRating,
  onMinRatingChange,
  minLikes,
  onMinLikesChange,
  readStatus,
  onReadStatusChange,
  bookmarksOnly,
  onBookmarksOnlyToggle,

  isMultiSelectMode,
  onToggleMultiSelectMode,

  startEpisodeNum,
  onStartEpisodeChange,
  endEpisodeNum,
  onEndEpisodeChange,

  onClearFilters,
  onExportCSV,
  onExportJSON,
  onMarkAllRead,
  onMarkAllUnread,
}) => {
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'rating' | 'likes'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSortChange = (value: 'latest' | 'oldest' | 'rating' | 'likes') => {
    setSortBy(value);
    onSortChange(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setSortBy('latest');
    onClearFilters();
  };

  const hasAdvancedFilters = Boolean(
    minRating > 0 || minLikes > 0 || readStatus !== 'all' || fromDate || toDate || startEpisodeNum || endEpisodeNum
  );

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-4 shadow-xl shadow-black/10">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
        <input
          type="text"
          placeholder="Search episodes by title or episode number..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-955 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-955 px-3 py-2.5 text-sm text-white transition-colors focus:border-purple-500 focus:outline-none"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating">Highest Rated</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>

        <button
          onClick={onToggleMultiSelectMode}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all ${
            isMultiSelectMode
              ? 'border-purple-500/50 bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'border-neutral-800 bg-neutral-955 text-neutral-300 hover:border-purple-500/40 hover:text-white'
          }`}
          title="Enable Multi-Select Mode"
        >
          <CheckSquare size={16} />
          Multi-Select
        </button>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all ${
            showAdvanced || hasAdvancedFilters
              ? 'border-purple-500/50 bg-purple-950/50 text-purple-300'
              : 'border-neutral-800 bg-neutral-955 text-neutral-300 hover:border-purple-500/40 hover:text-white'
          }`}
        >
          <Filter size={16} />
          Advanced Filters
          {hasAdvancedFilters && <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-200">Active</span>}
        </button>
      </div>

      {showAdvanced && (
        <div className="pt-3 border-t border-gray-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-current" /> Min Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => onMinRatingChange(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-750 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="0">All Ratings</option>
                <option value="9.0">9.0+ Stars</option>
                <option value="9.5">9.5+ Stars</option>
                <option value="9.8">9.8+ Stars</option>
                <option value="9.9">9.9+ Stars</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1">
                <ThumbsUp size={12} className="text-blue-400" /> Min Likes
              </label>
              <select
                value={minLikes}
                onChange={(e) => onMinLikesChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-750 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="0">All Likes</option>
                <option value="5000">5k+ Likes</option>
                <option value="10000">10k+ Likes</option>
                <option value="50000">50k+ Likes</option>
                <option value="100000">100k+ Likes</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-green-400" /> Read Status
              </label>
              <select
                value={readStatus}
                onChange={(e) => onReadStatusChange(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-750 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Start Ep #</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={startEpisodeNum || ''}
                  onChange={(e) => onStartEpisodeChange?.(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-750 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">End Ep #</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={endEpisodeNum || ''}
                  onChange={(e) => onEndEpisodeChange?.(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-750 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    onDateRangeChange(e.target.value, toDate);
                  }}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-750 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    onDateRangeChange(fromDate, e.target.value);
                  }}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-750 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-between flex-wrap pt-2 border-t border-gray-800/60">
            <div className="flex gap-2">
              {onMarkAllRead && (
                <button
                  onClick={onMarkAllRead}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-lg text-xs font-semibold transition-all"
                >
                  Mark All Read
                </button>
              )}
              {onMarkAllUnread && (
                <button
                  onClick={onMarkAllUnread}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-lg text-xs font-semibold transition-all"
                >
                  Mark All Unread
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onExportCSV}
                className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                title="Export Episode Metadata to CSV"
              >
                <Download size={13} />
                Export CSV
              </button>
              <button
                onClick={onExportJSON}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                title="Export Episode Metadata to JSON"
              >
                <FileJson size={13} />
                Export JSON
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
              >
                <RefreshCw size={13} />
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
