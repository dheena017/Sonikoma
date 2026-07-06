import React, { useState } from 'react';
import { ChevronDown, Filter, Search, Heart, Clock } from 'lucide-react';

interface EpisodeControlsProps {
  onSortChange: (sortBy: 'latest' | 'oldest' | 'rating' | 'likes') => void;
  onSearchChange: (query: string) => void;
  onDateRangeChange: (fromDate: string, toDate: string) => void;
  onToggleFavorites: () => void;
  onToggleRecent: () => void;
  showFavorites?: boolean;
  showRecent?: boolean;
}

export const EpisodeControls: React.FC<EpisodeControlsProps> = ({
  onSortChange,
  onSearchChange,
  onDateRangeChange,
  onToggleFavorites,
  onToggleRecent,
  showFavorites = false,
  showRecent = false,
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

  const handleDateChange = () => {
    onDateRangeChange(fromDate, toDate);
  };

  return (
    <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search episodes by title..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Main Controls Row */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Sort Dropdown */}
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs text-gray-400 block mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating">Highest Rated</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>

        {/* Quick Action Buttons */}
        <button
          onClick={onToggleFavorites}
          className={`mt-5 px-3 py-2 rounded text-sm font-medium transition-colors ${
            showFavorites
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Show favorites"
        >
          <Heart size={18} className="inline mr-1" />
          Favorites
        </button>

        <button
          onClick={onToggleRecent}
          className={`mt-5 px-3 py-2 rounded text-sm font-medium transition-colors ${
            showRecent
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Show recently browsed"
        >
          <Clock size={18} className="inline mr-1" />
          Recent
        </button>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-5 px-3 py-2 rounded text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          <Filter size={18} className="inline mr-1" />
          Advanced
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-3 border-t border-gray-600 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <button
            onClick={handleDateChange}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors"
          >
            Apply Date Filter
          </button>
        </div>
      )}
    </div>
  );
};
