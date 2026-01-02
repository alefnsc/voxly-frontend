/**
 * Brand Components
 * 
 * Single source of truth for Vocaid branding.
 * 
 * Rules:
 * - BrandMark: Logo image ONLY (no text)
 * - BrandLockup: Logo + text (use sparingly, never with BrandMark)
 * - Never render both logo image AND "Vocaid" text in same region
 */

import React from 'react';
import { Link } from 'react-router-dom';

// ============================================
// CONSTANTS
// ============================================

export const BRAND = {
  name: 'Vocaid',
  tagline: 'AI-Powered Interview Intelligence',
  logoPath: '/app-logo.png',
  logoAlt: 'Vocaid',
} as const;

// ============================================
// BRAND MARK (Logo Only)
// ============================================

interface BrandMarkProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Whether clicking navigates to home */
  linkToHome?: boolean;
  /** Custom class name */
  className?: string;
}

const sizeMap = {
  sm: { width: 40, height: 40 },
  md: { width: 56, height: 56 },
  lg: { width: 80, height: 80 },
  xl: { width: 100, height: 100 },
  xxl: { width: 120, height: 120 },
};

export function BrandMark({ size = 'md', linkToHome = true, className = '' }: BrandMarkProps) {
  const dimensions = sizeMap[size];
  
  const logoElement = (
    <img
      src={BRAND.logoPath}
      alt={BRAND.logoAlt}
      width={dimensions.width}
      height={dimensions.height}
      className={`object-contain ${className}`}
    />
  );

  if (linkToHome) {
    return (
      <Link to="/" className="flex items-center" aria-label={`${BRAND.name} - Go to home`}>
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}

// ============================================
// BRAND LOCKUP (Logo + Text)
// ============================================

interface BrandLockupProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether clicking navigates to home */
  linkToHome?: boolean;
  /** Show tagline below brand name */
  showTagline?: boolean;
  /** Custom class name */
  className?: string;
}

const lockupSizeMap = {
  sm: { logoSize: 60, textSize: 'text-lg', taglineSize: 'text-xs' },
  md: { logoSize: 80, textSize: 'text-xl', taglineSize: 'text-sm' },
  lg: { logoSize: 120, textSize: 'text-2xl', taglineSize: 'text-base' },
};

export function BrandLockup({
  size = 'md',
  linkToHome = true,
  showTagline = false,
  className = '',
}: BrandLockupProps) {
  const config = lockupSizeMap[size];

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={BRAND.logoPath}
        alt={BRAND.logoAlt}
        width={config.logoSize}
        height={config.logoSize}
        className="object-contain"
      />
      <div className="flex flex-col">
        {showTagline && (
          <span className={`${config.taglineSize} text-zinc-500`}>
            {BRAND.tagline}
          </span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" aria-label={`${BRAND.name} - Go to home`}>
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================
// COPYRIGHT NOTICE
// ============================================

interface CopyrightNoticeProps {
  /** Custom class name */
  className?: string;
}

export function CopyrightNotice({ className = '' }: CopyrightNoticeProps) {
  const year = new Date().getFullYear();
  
  return (
    <p className={`text-sm text-zinc-500 ${className}`}>
      © {year} {BRAND.name}. All rights reserved.
    </p>
  );
}

// ============================================
// EXPORTS
// ============================================

const BrandExports = {
  BrandMark,
  BrandLockup,
  CopyrightNotice,
  BRAND,
};

export default BrandExports;
