'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { useAuthCheck } from '../../hooks/use-auth-check';
import { LanguageSelector } from '../language-selector';
import { AccountMenu } from '../account-menu';
import { NAV_CONFIG } from '../../config/navigation';
import { FEATURES } from '../../config/features';
import { BrandMark } from '../shared/Brand';
import { cn } from '../../lib/utils';

interface NavItem {
  labelKey: string;
  path: string;
  requiresAuth?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
}

// Landing page navigation items (for unauthenticated users)
const landingNavItems: NavItem[] = [
  { labelKey: 'nav.home', path: '/' },
  { labelKey: 'nav.about', path: '/about' },
];

// Get B2C nav items for authenticated mobile menu
const getB2CNavItems = (): NavItem[] => {
  return NAV_CONFIG.filter(
    (item) => item.requiredContext === 'b2c' && item.requiresAuth
  ).sort((a, b) => a.order - b.order).map((item) => ({
    labelKey: item.labelKey,
    path: item.path,
    requiresAuth: item.requiresAuth,
  }));
};

// Get B2B nav items with coming soon flag
const getB2BNavItems = (): NavItem[] => {
  return NAV_CONFIG.filter(
    (item) => item.requiredContext === 'b2b' && item.requiresAuth
  ).sort((a, b) => a.order - b.order).slice(0, 3).map((item) => ({
    labelKey: item.labelKey,
    path: item.path,
    requiresAuth: item.requiresAuth,
    disabled: !FEATURES.B2B_RECRUITER_PLATFORM_ENABLED,
    comingSoon: !FEATURES.B2B_RECRUITER_PLATFORM_ENABLED,
  }));
};

interface TopBarProps {
  /** 
   * Variant for different page contexts
   * - 'default': White background with full navigation
   * - 'minimal': Gray background with logo only (for consent/onboarding pages)
   */
  variant?: 'default' | 'minimal';
  /**
   * Whether to show the logo on the left side
   * - true: Show logo (useful for legal pages without sidebar)
   * - false: Hide logo (default behavior)
   */
  showLogo?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ variant = 'default', showLogo = false }) => {
  const { user, isSignedIn } = useUser();
  const { userCredits } = useAuthCheck();
  const location = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActivePath = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeMobileMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Filter nav items based on auth
  // Unauthenticated users see landing nav; authenticated users use sidebar navigation
  const visibleNavItems = landingNavItems;

  // Minimal variant - just logo with gray styling (for consent/onboarding pages)
  if (variant === 'minimal') {
    return (
      <nav 
        className="flex h-[60px] sm:h-[80px] items-center justify-center border-b border-zinc-200 bg-zinc-50" 
        role="navigation" 
        aria-label="Main navigation"
      >
        <div className="flex flex-row items-center w-full max-w-7xl px-4 sm:px-6 lg:px-8 justify-center">
          <Link to="/" aria-label="Vocaid Home">
            <BrandMark size="lg" linkToHome={false} />
          </Link>
        </div>
      </nav>
    );
  }
  
  return (
    <>
      <nav className="flex h-[60px] sm:h-[80px] items-center justify-center border-b border-zinc-200 bg-white" role="navigation" aria-label="Main navigation">
        <div className={`flex flex-row items-center w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${showLogo ? 'justify-between' : isSignedIn ? 'justify-between lg:justify-end' : 'justify-between'}`}>
          {/* Logo - Show if showLogo prop is true, or follow default behavior */}
          {showLogo ? (
            <div className="flex items-center">
              <Link to={isSignedIn ? "/app/b2c/dashboard" : "/"} aria-label="Vocaid Home">
                <BrandMark size="lg" linkToHome={false} />
              </Link>
            </div>
          ) : isSignedIn ? (
            <div className="flex justify-center items-center lg:hidden">
              <Link to="/" aria-label="Vocaid Home">
                <BrandMark size="lg" linkToHome={false} />
              </Link>
            </div>
          ) : (
            <div className="flex justify-center items-center">
              <Link to="/" aria-label="Vocaid Home">
                <BrandMark size="lg" linkToHome={false} />
              </Link>
            </div>
          )}

          {/* Desktop Navigation - Hidden when authenticated (sidebar handles navigation) */}
          {!isSignedIn && (
            <div className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActivePath(item.path) 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
          )}

          {/* User Section & Mobile Menu Button */}
          <div className="flex items-center gap-3">      
            {/* Mobile Menu Button - Always visible on mobile */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Desktop User Button / Sign In - Hidden on mobile */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {/* Credits Display - Desktop */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-full">
                  <span className="text-xs text-purple-600 font-medium">{t('nav.credits')}</span>
                  <span className="text-sm font-semibold text-zinc-900">{userCredits}</span>
                </div>
                {/* Account Menu - Custom dropdown */}
                <div className="pl-2 border-l border-zinc-200">
                  <AccountMenu variant="desktop" />
                </div>
              </div>
            ) : (
              /* Desktop Sign In Button - Hidden on mobile, sign in available in mobile menu */
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/sign-in"
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  )}
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/sign-up"
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    'text-white bg-zinc-900 hover:bg-zinc-800',
                    'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'
                  )}
                >
                  {t('auth.createAccount', 'Sign up')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        className={`mobile-menu-panel md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200">
            <span className="font-semibold text-zinc-900">{t('nav.home')}</span>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
              aria-label="Close menu"
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Section - Mobile */}
          {user ? (
            <div className="border-b border-zinc-200 p-5">
              <AccountMenu variant="mobile" />
              {/* Credits Display - Mobile */}
              <div className="mt-4 flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-sm text-zinc-500">{t('dashboard.stats.creditsRemaining')}</span>
                <span className="text-base font-semibold text-zinc-900">{userCredits}</span>
              </div>
            </div>
          ) : (
            /* Sign In Section for Mobile - Unauthenticated Users */
            <div className="border-b border-zinc-200 p-5 space-y-3">
              <p className="text-sm text-zinc-600">{t('common.signInPrompt', 'Sign in to access all features')}</p>
              <Link 
                to="/sign-in"
                className={cn(
                  'block w-full px-4 py-3 text-center text-base font-medium rounded-xl transition-colors',
                  'text-zinc-900 bg-zinc-100 hover:bg-zinc-200',
                  'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'
                )}
                onClick={closeMobileMenu}
              >
                {t('common.login')}
              </Link>
              <Link 
                to="/sign-up"
                className={cn(
                  'block w-full px-4 py-3 text-center text-base font-medium rounded-xl transition-colors',
                  'text-white bg-zinc-900 hover:bg-zinc-800',
                  'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'
                )}
                onClick={closeMobileMenu}
              >
                {t('auth.createAccount', 'Sign up')}
              </Link>
            </div>
          )}

          {/* Mobile Navigation Links */}
          <div className="flex-1 py-4 overflow-y-auto">
            {/* Show different nav based on auth state */}
            {isSignedIn ? (
              <>
                {/* B2C Interview Practice Section */}
                <div className="mb-4">
                  <p className="px-6 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                    {t('platform.b2c.title', 'Interview Practice')}
                  </p>
                  {getB2CNavItems().map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-6 py-3 text-base font-medium transition-colors ${
                        isActivePath(item.path)
                          ? 'text-purple-600 bg-purple-50'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                      onClick={closeMobileMenu}
                      tabIndex={isMobileMenuOpen ? 0 : -1}
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </div>
                
                {/* B2B Recruiter Section - Coming Soon */}
                <div className="mb-4">
                  <p className="px-6 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    {t('platform.b2b.title', 'For Recruiters')}
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      {t('common.comingSoon', 'Coming Soon')}
                    </span>
                  </p>
                  {getB2BNavItems().map((item) => (
                    <div
                      key={item.path}
                      className="flex items-center justify-between px-6 py-3 text-base font-medium text-zinc-400 cursor-not-allowed"
                      aria-disabled="true"
                    >
                      <span>{t(item.labelKey)}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>

                {/* Resources Section */}
                <div className="border-t border-zinc-200 pt-4">
                  <p className="px-6 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                    {t('common.more', 'Resources')}
                  </p>
                  {landingNavItems.filter(item => item.path !== '/').map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-6 py-3 text-base font-medium transition-colors ${
                        isActivePath(item.path)
                          ? 'text-purple-600 bg-purple-50'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                      onClick={closeMobileMenu}
                      tabIndex={isMobileMenuOpen ? 0 : -1}
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              /* Unauthenticated: Landing nav items */
              visibleNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-6 py-4 text-lg font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                  onClick={closeMobileMenu}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  {t(item.labelKey)}
                </Link>
              ))
            )}
          </div>
          
          {/* Mobile Language Selector */}
          <div className="border-t border-zinc-200 p-4">
            <p className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
              {t('language.select')}
            </p>
            <LanguageSelector variant="horizontal" className="justify-center" />
          </div>
        </div>
      </div>
    </>
  )
}

export default TopBar