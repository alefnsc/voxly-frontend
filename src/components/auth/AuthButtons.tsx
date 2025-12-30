/**
 * OAuth Buttons Component
 * 
 * OAuth trigger buttons following Vocaid design.
 * Supports: Google, Apple, Microsoft, LinkedIn
 * Clean typography with black text on white backgrounds.
 * Dark purple border on hover. No icons per design standards.
 * 
 * @module components/auth/AuthButtons
 */

import React, { useState } from 'react';
import { useSignUp, useSignIn } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';

// Clerk OAuth strategy types
type ClerkOAuthStrategy = 
  | 'oauth_google' 
  | 'oauth_apple' 
  | 'oauth_microsoft'
  | 'oauth_linkedin_oidc';

interface OAuthProvider {
  strategy: ClerkOAuthStrategy;
  labelKey: string;
  defaultLabel: string;
}

const OAUTH_PROVIDERS: OAuthProvider[] = [
  { strategy: 'oauth_google', labelKey: 'auth.oauth.google', defaultLabel: 'Continue with Google' },
  { strategy: 'oauth_apple', labelKey: 'auth.oauth.apple', defaultLabel: 'Continue with Apple' },
  { strategy: 'oauth_microsoft', labelKey: 'auth.oauth.microsoft', defaultLabel: 'Continue with Microsoft' },
];

interface AuthButtonsProps {
  mode: 'signUp' | 'signIn';
  className?: string;
  onError?: (error: string) => void;
  /** Which providers to show (defaults to all) */
  providers?: ClerkOAuthStrategy[];
}

export const AuthButtons: React.FC<AuthButtonsProps> = ({
  mode,
  className,
  onError,
  providers,
}) => {
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();
  const { t } = useTranslation();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Filter providers if specified
  const activeProviders = providers 
    ? OAUTH_PROVIDERS.filter(p => providers.includes(p.strategy))
    : OAUTH_PROVIDERS;

  // Handle Clerk OAuth
  const handleClerkOAuth = async (strategy: ClerkOAuthStrategy) => {
    try {
      setLoadingProvider(strategy);
      const auth = mode === 'signUp' ? signUp : signIn;
      if (!auth) {
        onError?.(t('auth.oauth.notReady', 'Authentication service not ready. Please try again.'));
        return;
      }

      // Use the current window origin for redirect URLs
      const baseUrl = window.location.origin;
      
      await auth.authenticateWithRedirect({
        strategy,
        redirectUrl: `${baseUrl}/sso-callback`,
        redirectUrlComplete: `${baseUrl}/app/b2c/dashboard`,
      });
    } catch (error: any) {
      console.error('OAuth error:', error);
      onError?.(error.errors?.[0]?.message || t('auth.oauth.failed', 'Authentication failed. Please try again.'));
    } finally {
      setLoadingProvider(null);
    }
  };

  // Button style based on loading state
  const getButtonClass = (provider: string) => cn(
    'w-full flex items-center justify-center gap-2',
    'px-4 py-3 min-h-[44px]',
    'bg-white border border-zinc-200 rounded-lg',
    'text-sm font-semibold text-zinc-900',
    'transition-all duration-200',
    'hover:border-purple-600 hover:text-purple-600',
    'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    loadingProvider === provider && 'opacity-70 cursor-wait'
  );

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {activeProviders.map((provider) => (
        <button
          key={provider.strategy}
          type="button"
          onClick={() => handleClerkOAuth(provider.strategy)}
          disabled={loadingProvider !== null}
          className={getButtonClass(provider.strategy)}
        >
          {loadingProvider === provider.strategy ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              {t('auth.oauth.connecting', 'Connecting...')}
            </span>
          ) : (
            t(provider.labelKey, provider.defaultLabel)
          )}
        </button>
      ))}
    </div>
  );
};

// Divider component for separating OAuth from email form
interface AuthDividerProps {
  text?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text }) => {
  const { t } = useTranslation();
  const dividerText = text || t('auth.divider', 'or');
  
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-zinc-200" />
      <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
        {dividerText}
      </span>
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  );
};

export default AuthButtons;
