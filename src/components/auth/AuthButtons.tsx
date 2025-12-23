/**
 * OAuth Buttons Component
 * 
 * OAuth trigger buttons following Vocaid design.
 * Supports: Google, Apple, Microsoft
 * Clean typography with black text on white backgrounds.
 * Dark purple border on hover. No icons per design standards.
 * 
 * @module components/auth/AuthButtons
 */

import React, { useState } from 'react';
import { useSignUp, useSignIn } from '@clerk/clerk-react';
import { cn } from 'lib/utils';

// Clerk OAuth strategy types
type ClerkOAuthStrategy = 
  | 'oauth_google' 
  | 'oauth_apple' 
  | 'oauth_microsoft';

interface AuthButtonsProps {
  mode: 'signUp' | 'signIn';
  className?: string;
  onError?: (error: string) => void;
}

export const AuthButtons: React.FC<AuthButtonsProps> = ({
  mode,
  className,
  onError,
}) => {
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Handle Clerk OAuth (Google, Apple, Microsoft)
  const handleClerkOAuth = async (strategy: ClerkOAuthStrategy) => {
    try {
      setLoadingProvider(strategy);
      const auth = mode === 'signUp' ? signUp : signIn;
      if (!auth) {
        onError?.('Authentication service not ready. Please try again.');
        return;
      }

      // Use the current window origin for redirect URLs
      const baseUrl = window.location.origin;
      
      await auth.authenticateWithRedirect({
        strategy,
        redirectUrl: `${baseUrl}/sso-callback`,
        redirectUrlComplete: `${baseUrl}/dashboard`,
      });
    } catch (error: any) {
      console.error('OAuth error:', error);
      onError?.(error.errors?.[0]?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Button style based on loading state
  const getButtonClass = (provider: string) => cn(
    'w-full flex items-center justify-center gap-2 px-4 py-3',
    'bg-white border border-zinc-200 rounded-lg',
    'text-sm font-semibold text-black',
    'transition-all duration-200',
    'hover:border-purple-600 hover:shadow-sm',
    'focus:outline-none focus:border-purple-600',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    loadingProvider === provider && 'opacity-70 cursor-wait'
  );

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Google Button */}
      <button
        type="button"
        onClick={() => handleClerkOAuth('oauth_google')}
        disabled={loadingProvider !== null}
        className={getButtonClass('oauth_google')}
      >
        {loadingProvider === 'oauth_google' ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            Connecting...
          </span>
        ) : (
          'Continue with Google'
        )}
      </button>

      {/* Apple Button */}
      <button
        type="button"
        onClick={() => handleClerkOAuth('oauth_apple')}
        disabled={loadingProvider !== null}
        className={getButtonClass('oauth_apple')}
      >
        {loadingProvider === 'oauth_apple' ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            Connecting...
          </span>
        ) : (
          'Continue with Apple'
        )}
      </button>

      {/* Microsoft Button */}
      <button
        type="button"
        onClick={() => handleClerkOAuth('oauth_microsoft')}
        disabled={loadingProvider !== null}
        className={getButtonClass('oauth_microsoft')}
      >
        {loadingProvider === 'oauth_microsoft' ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            Connecting...
          </span>
        ) : (
          'Continue with Microsoft'
        )}
      </button>
    </div>
  );
};

// Divider component for separating OAuth from email form
export const AuthDivider: React.FC<{ text?: string }> = ({ text = 'or' }) => {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-zinc-200" />
      <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">{text}</span>
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  );
};

export default AuthButtons;
