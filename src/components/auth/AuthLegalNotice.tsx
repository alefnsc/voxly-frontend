/**
 * Auth Legal Notice Component
 * 
 * Terms of Use and Privacy Policy links for auth forms.
 * Opens legal pages in new tab (target="_blank") for seamless auth flow.
 * 
 * @module components/auth/AuthLegalNotice
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';

interface AuthLegalNoticeProps {
  /** Optional class name */
  className?: string;
  /** Show consent checkboxes (for sign-up) */
  showCheckboxes?: boolean;
  /** Terms acceptance state */
  termsAccepted?: boolean;
  /** Terms change handler */
  onTermsChange?: (accepted: boolean) => void;
  /** Marketing opt-in state */
  marketingOptIn?: boolean;
  /** Marketing opt-in change handler */
  onMarketingChange?: (accepted: boolean) => void;
}

export const AuthLegalNotice: React.FC<AuthLegalNoticeProps> = ({
  className,
  showCheckboxes = false,
  termsAccepted = false,
  onTermsChange,
  marketingOptIn = false,
  onMarketingChange,
}) => {
  const { t } = useTranslation();

  // Link styling
  const linkClass = 'text-purple-600 hover:underline focus:outline-none focus:underline cursor-pointer';

  if (showCheckboxes) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Divider */}
        <div className="border-t border-zinc-200 my-4" />
        
        {/* Terms acceptance checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange?.(e.target.checked)}
            className={cn(
              'mt-0.5 h-4 w-4 rounded border-zinc-300',
              'text-purple-600 focus:ring-purple-600 focus:ring-offset-2',
              'cursor-pointer'
            )}
          />
          <span className="text-xs text-zinc-600 leading-relaxed">
            {t('auth.legal.agreeToTerms', 'I agree to the')}{' '}
            <a 
              href="/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {t('auth.legal.termsOfUse', 'Terms of Use')}
            </a>
            {' '}{t('auth.legal.and', 'and')}{' '}
            <a 
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {t('auth.legal.privacyPolicy', 'Privacy Policy')}
            </a>
          </span>
        </label>
        
        {/* Marketing opt-in checkbox (optional) */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => onMarketingChange?.(e.target.checked)}
            className={cn(
              'mt-0.5 h-4 w-4 rounded border-zinc-300',
              'text-purple-600 focus:ring-purple-600 focus:ring-offset-2',
              'cursor-pointer'
            )}
          />
          <span className="text-xs text-zinc-500 leading-relaxed">
            {t('auth.legal.marketingOptIn', 'Send me tips and updates about improving my interview skills')}
          </span>
        </label>
      </div>
    );
  }

  // Simple text-only legal notice (for sign-in)
  return (
    <div className={cn('text-center', className)}>
      <p className="text-xs text-zinc-500 leading-relaxed">
        {t('auth.legal.byContinuing', 'By continuing, you agree to the')}{' '}
        <a 
          href="/terms-of-use"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {t('auth.legal.termsOfUse', 'Terms of Use')}
        </a>
        {' '}{t('auth.legal.and', 'and')}{' '}
        <a 
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {t('auth.legal.privacyPolicy', 'Privacy Policy')}
        </a>
      </p>
    </div>
  );
};

export default AuthLegalNotice;
