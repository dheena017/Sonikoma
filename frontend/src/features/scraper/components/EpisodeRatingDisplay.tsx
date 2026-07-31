import React from 'react';
import { Star, ThumbsUp, Eye } from 'lucide-react';

interface EpisodeRatingDisplayProps {
  rating?: number;
  likes?: string;
  views?: number;
  compact?: boolean;
}

export const EpisodeRatingDisplay: React.FC<EpisodeRatingDisplayProps> = ({
  rating,
  likes,
  views,
  compact = false,
}) => {
  if (!rating && !likes && !views) {
    return null;
  }

  const renderStars = (score: number) => {
    // Prevent `RangeError: Invalid array length` by ensuring we always pass
    // sane integer counts to `Array(count)`.
    const s = Number(score);
    if (!Number.isFinite(s)) {
      return null;
    }

    // Clamp to expected range (0..5). If backend sends something unexpected,
    // we render a reasonable visualization instead of crashing.
    const clamped = Math.min(5, Math.max(0, s));

    const fullStars = Math.floor(clamped);
    const hasHalf = clamped % 1 !== 0;
    const halfStarsCount = hasHalf ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStarsCount;

    const safeFullStars = Math.max(0, Math.min(5, fullStars));
    const safeEmptyStars = Math.max(0, Math.min(5, emptyStars));

    return (
      <div className="flex items-center gap-1">
        {Array(safeFullStars)
          .fill(0)
          .map((_, i) => (
            <Star
              key={`full-${i}`}
              size={compact ? 14 : 16}
              className="fill-yellow-400 text-yellow-400"
            />
          ))}

        {hasHalf && (
          <div className="relative w-4 h-4">
            <Star
              size={compact ? 14 : 16}
              className="text-gray-400 absolute"
            />
            <div className="overflow-hidden w-1/2">
              <Star
                size={compact ? 14 : 16}
                className="fill-yellow-400 text-yellow-400"
              />
            </div>
          </div>
        )}

        {Array(safeEmptyStars)
          .fill(0)
          .map((_, i) => (
            <Star
              key={`empty-${i}`}
              size={compact ? 14 : 16}
              className="text-gray-400"
            />
          ))}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-300">
        {rating !== undefined && rating !== null && Number.isFinite(rating) && (
          <div className="flex items-center gap-1">
            {renderStars(rating)}
            <span className="ml-1">{rating.toFixed(1)}</span>
          </div>
        )}
        {likes && (
          <div className="flex items-center gap-1 text-blue-400">
            <ThumbsUp size={14} />
            <span>{likes}</span>
          </div>
        )}
        {views && (
          <div className="flex items-center gap-1 text-green-400">
            <Eye size={14} />
            <span>{views.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm text-gray-300">
      {rating !== undefined && rating !== null && Number.isFinite(rating) && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 min-w-[60px]">Rating:</span>
          <div className="flex items-center gap-2">
            {renderStars(rating)}
            <span className="font-medium">{rating.toFixed(1)}/5</span>
          </div>
        </div>
      )}
      {likes && (
        <div className="flex items-center gap-2">
          <ThumbsUp size={16} className="text-blue-400" />
          <span className="text-gray-400">Likes:</span>
          <span className="font-medium">{likes}</span>
        </div>
      )}
      {views && (
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-green-400" />
          <span className="text-gray-400">Views:</span>
          <span className="font-medium">{views.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};
