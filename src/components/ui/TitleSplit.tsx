/**
 * TitleSplit Component
 * 
 * Renders a page title with the Vocaid brand pattern:
 * - "black" segment: text-zinc-900
 * - "purple" segment: text-purple-600
 * 
 * Uses react-i18next Trans for i18n-safe markup, allowing translators
 * to reorder words without breaking the color emphasis.
 * 
 * Usage in locale JSON:
 *   "pages.interviews.title": "<black>My</black> <purple>Interviews</purple>"
 * 
 * Usage in component:
 *   <TitleSplit i18nKey="pages.interviews.title" />
 * 
 * For manual (non-i18n) titles:
 *   <TitleSplit black="My" purple="Interviews" />
 * 
 * @module components/ui/TitleSplit
 */

'use client';

import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';

// ============================================
// TYPES
// ============================================

export interface TitleSplitProps {
  /** i18n key containing <black> and <purple> tags */
  i18nKey?: string;
  /** i18n key for subtitle (optional) */
  subtitleKey?: string;
  /** Manual black (primary) text - used when not using i18nKey */
  black?: string;
  /** Manual purple (accent) text - used when not using i18nKey */
  purple?: string;
  /** HTML tag to render (default: h1) */
  as?: 'h1' | 'h2' | 'h3' | 'span';
  /** Additional className for the title element */
  className?: string;
  /** Additional className for the subtitle element */
  subtitleClassName?: string;
  /** Additional className for the container when subtitle is present */
  containerClassName?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================
// SIZE STYLES
// ============================================

const sizeStyles = {
  sm: 'text-lg sm:text-xl font-bold',
  md: 'text-xl sm:text-2xl font-bold',
  lg: 'text-2xl sm:text-3xl font-bold',
  xl: 'text-3xl sm:text-4xl lg:text-5xl font-bold',
};

// ============================================
// COMPONENT
// ============================================

export const TitleSplit: React.FC<TitleSplitProps> = ({
  i18nKey,
  subtitleKey,
  black,
  purple,
  as: Tag = 'h1',
  className,
  subtitleClassName,
  containerClassName,
  size = 'lg',
}) => {
  const { t } = useTranslation();

  const titleElement = i18nKey ? (
    <Tag className={cn(sizeStyles[size], className)}>
      <Trans
        i18nKey={i18nKey}
        components={{
          black: <span className="text-zinc-900" />,
          purple: <span className="text-purple-600" />,
        }}
      />
    </Tag>
  ) : (
    <Tag className={cn(sizeStyles[size], className)}>
      {black && <span className="text-zinc-900">{black}</span>}
      {black && purple && ' '}
      {purple && <span className="text-purple-600">{purple}</span>}
    </Tag>
  );

  // If no subtitle, return just the title
  if (!subtitleKey) {
    return titleElement;
  }

  // Default container layout when subtitle present
  const defaultContainerClass = 'flex flex-col';
  // Default subtitle typography
  const defaultSubtitleClass = 'text-zinc-600 text-sm sm:text-base mt-1';

  // With subtitle, wrap in container
  return (
    <div className={cn(defaultContainerClass, containerClassName)}>
      {titleElement}
      <p className={cn(defaultSubtitleClass, subtitleClassName)}>
        {t(subtitleKey)}
      </p>
    </div>
  );
};

export default TitleSplit;
