'use client'

import { useUser } from 'contexts/AuthContext';
import { AppFooter } from 'components/shared/AppFooter';

/**
 * Footer Component
 * 
 * Wrapper that selects the appropriate footer variant based on auth state.
 * - Authenticated users: Full footer with navigation (same as landing page)
 * - Non-authenticated users: Full footer for marketing pages
 */
const Footer = () => {
  const { isSignedIn } = useUser();
  
  // Use 'app' variant for authenticated users (accounts for sidebar margin)
  // Use 'full' variant for non-authenticated users (landing/marketing pages)
  return <AppFooter variant={isSignedIn ? 'app' : 'full'} />;
}

export default Footer