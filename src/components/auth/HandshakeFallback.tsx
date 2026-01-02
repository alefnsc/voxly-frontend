/**
 * Handshake Fallback Component
 * 
 * Handles OAuth redirects that come with __clerk_handshake parameter.
 * This can happen when Clerk's redirect URL configuration in the dashboard
 * differs from what's passed in authenticateWithRedirect().
 * 
 * When detected, it processes the handshake token via AuthenticateWithRedirectCallback
 * instead of directly navigating away.
 * 
 * @module components/auth/HandshakeFallback
 */

'use client';

import React from 'react';
import { useLocation } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';

interface HandshakeFallbackProps {
  /** Component to render when NOT handling a handshake */
  children: React.ReactNode;
  /** URL to redirect to after successful auth (default: /app/b2c/dashboard) */
  redirectTo?: string;
}

/**
 * Wraps a route to handle Clerk handshake tokens that may arrive unexpectedly.
 * 
 * Usage:
 * ```tsx
 * <Route 
 *   path="dashboard" 
 *   element={
 *     <HandshakeFallback>
 *       <Navigate to="/app/b2c/dashboard" replace />
 *     </HandshakeFallback>
 *   } 
 * />
 * ```
 */
export const HandshakeFallback: React.FC<HandshakeFallbackProps> = ({
  children,
  redirectTo = '/app/b2c/dashboard',
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Check for Clerk handshake token
  const hasHandshake = searchParams.has('__clerk_handshake');
  
  if (hasHandshake) {
    // Process the handshake via Clerk's callback handler
    console.log('🔐 Processing OAuth handshake from redirect...');
    
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">{t('auth.completingAuthentication')}</p>
        </div>
        <AuthenticateWithRedirectCallback 
          signInForceRedirectUrl={redirectTo}
          signUpForceRedirectUrl={redirectTo}
        />
      </div>
    );
  }
  
  // No handshake, render children as normal
  return <>{children}</>;
};

export default HandshakeFallback;
