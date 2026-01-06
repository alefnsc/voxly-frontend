/**
 * Handshake Fallback Component
 * 
 * Legacy component that handled OAuth redirect handshake parameters.
 * Now simplified for first-party auth - just renders children directly.
 * 
 * @module components/auth/HandshakeFallback
 */

'use client';

import React from 'react';

interface HandshakeFallbackProps {
  /** Component to render */
  children: React.ReactNode;
  /** URL to redirect to (kept for API compatibility) */
  redirectTo?: string;
}

/**
 * Simplified fallback component for first-party auth.
 * Previously handled OAuth handshake tokens.
 * Now just renders children directly.
 */
export const HandshakeFallback: React.FC<HandshakeFallbackProps> = ({
  children,
}) => {
  // First-party auth doesn't use handshake tokens
  // Just render children directly
  return <>{children}</>;
};

export default HandshakeFallback;
