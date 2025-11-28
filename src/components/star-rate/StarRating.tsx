import React, { useEffect, useMemo } from 'react';

interface StarRatingProps {
  score: string; // Format "0/100" or just a number
  onRatingChange: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ score, onRatingChange }) => {
  // Parse score and calculate rating (1-5 scale)
  const rating = useMemo(() => {
    const numScore = parseInt(score) || 0;
    return Math.min(Math.max(numScore, 1), 5);
  }, [score]);

  const stars = useMemo(() => 
    Array.from({ length: 5 }, (_, index) => index < rating),
    [rating]
  );

  useEffect(() => {
    onRatingChange(rating);
  }, [rating, onRatingChange]);

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {stars.map((filled, index) => (
        <svg
          key={index}
          data-testid="star"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-all duration-300 ${
            filled 
              ? 'fill-purple-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' 
              : 'fill-gray-300'
          }`}
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
};

export default StarRating;