/**
 * Start Interview Button Component
 * 
 * Reusable CTA button for starting a new interview.
 * Used across dashboard, interviews list, and other pages.
 * 
 * @module components/start-interview-button
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';

export type StartInterviewButtonVariant = 'mobile' | 'desktop' | 'inline';

interface StartInterviewButtonProps {
  /**
   * Visual variant of the button
   * - mobile: Full-width button for mobile layouts
   * - desktop: Inline button with whitespace-nowrap
   * - inline: Standard inline button
   */
  variant?: StartInterviewButtonVariant;
  
  /**
   * Custom label override. If not provided, uses translation key.
   */
  label?: string;
  
  /**
   * Translation key for the label. Defaults to 'dashboard.startInterview'
   */
  labelKey?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether to show the button (useful for conditional rendering based on credits)
   */
  show?: boolean;
}

/**
 * Start Interview Button - Consistent CTA across the app
 */
export const StartInterviewButton: React.FC<StartInterviewButtonProps> = ({
  variant = 'inline',
  label,
  labelKey = 'dashboard.startInterview',
  className,
  show = true,
}) => {
  const { t } = useTranslation();
  
  if (!show) return null;
  
  const buttonLabel = label || t(labelKey);
  
  const baseStyles = 'inline-flex items-center gap-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm';
  
  const variantStyles = {
    mobile: 'w-full justify-center px-5 py-3',
    desktop: 'px-5 py-2.5 whitespace-nowrap',
    inline: 'px-5 py-2.5',
  };
  
  return (
    <Link
      to="/app/b2c/interview/new"
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      <PlayCircle className="h-5 w-5" />
      {buttonLabel}
    </Link>
  );
};

/**
 * Mobile-only Start Interview Button wrapper
 * Shows only on mobile screens (hidden on sm and up, or lg and up based on breakpoint)
 */
export const MobileStartInterviewButton: React.FC<Omit<StartInterviewButtonProps, 'variant'> & { 
  breakpoint?: 'sm' | 'lg';
}> = ({ 
  breakpoint = 'sm',
  show = true,
  ...props 
}) => {
  if (!show) return null;
  
  const hideClass = breakpoint === 'sm' ? 'sm:hidden' : 'lg:hidden';
  
  return (
    <div className={`flex ${hideClass}`}>
      <StartInterviewButton variant="mobile" show={show} {...props} />
    </div>
  );
};

/**
 * Desktop-only Start Interview Button wrapper
 * Shows only on desktop screens (hidden below sm or lg based on breakpoint)
 */
export const DesktopStartInterviewButton: React.FC<Omit<StartInterviewButtonProps, 'variant'> & {
  breakpoint?: 'sm' | 'lg';
}> = ({ 
  breakpoint = 'sm',
  show = true,
  ...props 
}) => {
  if (!show) return null;
  
  const showClass = breakpoint === 'sm' ? 'hidden sm:inline-flex' : 'hidden lg:inline-flex';
  
  return (
    <StartInterviewButton 
      variant="desktop" 
      show={show}
      className={showClass}
      {...props} 
    />
  );
};

export default StartInterviewButton;
