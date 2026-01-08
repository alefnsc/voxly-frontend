/**
 * LinkedIn Import Button
 * 
 * Button component to trigger LinkedIn profile import during onboarding.
 * Uses session-based OAuth flow to import profile data from LinkedIn.
 * 
 * @module components/onboarding/LinkedInImportButton
 */

import React from 'react';
import { Linkedin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiService from 'services/APIService';

interface LinkedInImportButtonProps {
  /** Path to return to after LinkedIn import (default: current path) */
  returnTo?: string;
  /** Whether import was successful (from query params) */
  importSuccess?: boolean;
  /** Error code from import attempt (from query params) */
  importError?: string | null;
  /** Callback when import completes (for refreshing data) */
  onImportComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Show compact version */
  compact?: boolean;
}

export default function LinkedInImportButton({
  returnTo,
  importSuccess = false,
  importError = null,
  onImportComplete,
  className = '',
  disabled = false,
  compact = false,
}: LinkedInImportButtonProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(false);

  // Handle LinkedIn import click
  const handleImportClick = () => {
    setIsLoading(true);
    // Use current path as returnTo if not specified
    const finalReturnTo = returnTo || window.location.pathname + window.location.search;
    apiService.startLinkedInProfileImport(finalReturnTo);
    // Note: This will redirect, so isLoading won't be reset
  };

  // Get error message based on error code
  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'cancelled':
        return t('linkedIn.import.errors.cancelled', 'LinkedIn sign-in was cancelled');
      case 'linkedin_denied':
        return t('linkedIn.import.errors.denied', 'LinkedIn authorization was denied');
      case 'oauth_not_configured':
        return t('linkedIn.import.errors.notConfigured', 'LinkedIn integration is not available');
      case 'token_exchange_failed':
        return t('linkedIn.import.errors.tokenFailed', 'Failed to connect to LinkedIn');
      case 'userinfo_failed':
        return t('linkedIn.import.errors.userinfoFailed', 'Failed to retrieve LinkedIn profile');
      case 'invalid_state':
        return t('linkedIn.import.errors.invalidState', 'Session expired. Please try again.');
      case 'missing_code':
        return t('linkedIn.import.errors.missingCode', 'Invalid LinkedIn response');
      case 'callback_failed':
      default:
        return t('linkedIn.import.errors.generic', 'Something went wrong. Please try again.');
    }
  };

  // Success state
  if (importSuccess) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
        <span className="text-sm text-green-700">
          {t('linkedIn.import.success', 'LinkedIn profile imported successfully!')}
        </span>
      </div>
    );
  }

  // Error state with retry button
  if (importError) {
    return (
      <div className={`p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-start gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">
            {getErrorMessage(importError)}
          </span>
        </div>
        <button
          onClick={handleImportClick}
          disabled={isLoading || disabled}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('linkedIn.import.connecting', 'Connecting...')}
            </>
          ) : (
            <>
              <Linkedin className="h-4 w-4" />
              {t('linkedIn.import.tryAgain', 'Try Again')}
            </>
          )}
        </button>
      </div>
    );
  }

  // Default state - import button
  if (compact) {
    return (
      <button
        onClick={handleImportClick}
        disabled={isLoading || disabled}
        className={`flex items-center justify-center gap-2 py-2 px-4 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('linkedIn.import.connecting', 'Connecting...')}
          </>
        ) : (
          <>
            <Linkedin className="h-4 w-4" />
            {t('linkedIn.import.buttonCompact', 'Import from LinkedIn')}
          </>
        )}
      </button>
    );
  }

  return (
    <div className={`p-4 border border-zinc-200 rounded-lg ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-[#0A66C2]/10 rounded-lg">
          <Linkedin className="h-5 w-5 text-[#0A66C2]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-zinc-800">
            {t('linkedIn.import.title', 'Import from LinkedIn')}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {t('linkedIn.import.description', 'Quickly fill in your profile with data from LinkedIn')}
          </p>
        </div>
      </div>
      <button
        onClick={handleImportClick}
        disabled={isLoading || disabled}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0A66C2] text-white font-medium rounded-lg hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('linkedIn.import.connecting', 'Connecting...')}
          </>
        ) : (
          <>
            <Linkedin className="h-4 w-4" />
            {t('linkedIn.import.button', 'Connect LinkedIn')}
          </>
        )}
      </button>
    </div>
  );
}
