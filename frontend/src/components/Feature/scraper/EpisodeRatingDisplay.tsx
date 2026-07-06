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
    const fullStars = Math.floor(score);
    const hasHalf = score % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {Array(fullStars)
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
            <Star size={compact ? 14 : 16} className="text-gray-400 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star size={compact ? 14 : 16} className="fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {Array(emptyStars)
          .fill(0)
          .map((_, i) => (
            <Star key={`empty-${i}`} size={compact ? 14 : 16} className="text-gray-400" />
          ))}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-300">
        {rating && (
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
      {rating && (
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
