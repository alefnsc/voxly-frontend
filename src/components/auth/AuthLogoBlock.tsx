/**
 * Auth Logo Block Component
 * 
 * Centered logo with brand tagline for auth pages.
 * Uses larger logo size for premium appearance.
 * 
 * @module components/auth/AuthLogoBlock
 */

'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { BRAND } from 'components/shared/Brand';

interface AuthLogoBlockProps {
  /** Optional class name */
  className?: string;
  /** Whether the logo links to home */
  linkToHome?: boolean;
}

export const AuthLogoBlock: React.FC<AuthLogoBlockProps> = ({
  className,
  linkToHome = true,
}) => {
  const { t } = useTranslation();

  const logoContent = (
    <div className={cn('flex flex-col items-center text-center', className)}>
      {/* Logo - Clean and balanced */}
      <img
        src={BRAND.logoPath}
        alt={BRAND.logoAlt}
        className="h-10 sm:h-12 md:h-14 w-auto object-contain"
      />
      
      {/* Brand tagline */}
      <p className="mt-3 text-sm text-zinc-500 font-medium tracking-wide">
        {t('auth.tagline', 'HR Intelligence Hub for Fast Progress.')}
      </p>
    </div>
  );

  if (linkToHome) {
    return (
      <Link 
        to="/" 
        className="block focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-4 rounded-lg"
        aria-label={`${BRAND.name} - Go to home`}
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default AuthLogoBlock;
