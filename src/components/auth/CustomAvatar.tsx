/**
 * Custom Avatar Component
 * 
 * Displays user's uploaded image or initials fallback.
 * Follows Vocaid design with zinc-100 background and purple-600 text.
 * 
 * @module components/auth/CustomAvatar
 */

import React from 'react';
import { cn } from 'lib/utils';

interface CustomAvatarProps {
  imageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export const CustomAvatar: React.FC<CustomAvatarProps> = ({
  imageUrl,
  firstName,
  lastName,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  // Generate initials from name
  const initials = React.useMemo(() => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  }, [firstName, lastName]);

  const sizeClass = sizeClasses[size];

  // If image URL exists, show the image
  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={`${firstName || ''} ${lastName || ''}`.trim() || 'User avatar'}
        onError={() => setImageError(true)}
        className={cn(
          'rounded-full object-cover',
          sizeClass,
          className
        )}
      />
    );
  }

  // Otherwise show initials
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        'bg-zinc-100 text-purple-600 font-bold',
        sizeClass,
        className
      )}
      aria-label={`Avatar for ${firstName || ''} ${lastName || ''}`.trim() || 'User'}
    >
      {initials}
    </div>
  );
};

export default CustomAvatar;
