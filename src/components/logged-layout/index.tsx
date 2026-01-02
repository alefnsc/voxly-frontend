/**
 * LoggedLayout Component
 * 
 * Unified layout wrapper for all authenticated pages.
 * Provides consistent TopBar, Sidebar, Footer, and mobile navigation.
 * 
 * Features:
 * - Desktop: Fixed sidebar (260px) + TopBar + Footer
 * - Mobile: Hamburger drawer + TopBar + BottomNav
 * - Skip-to-content link for accessibility
 * - Focus trap for mobile drawer
 * - ESC key closes drawer
 * - localStorage persistence for sidebar state
 * 
 * @module components/logged-layout
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthCheck } from 'hooks/use-auth-check';
import { cn } from 'lib/utils';
import { BrandMark } from 'components/shared/Brand';
import { LanguageSelector } from 'components/language-selector';
import { AccountMenu } from 'components/account-menu';
import { CustomAvatar } from 'components/auth/CustomAvatar';
import { AppFooter } from 'components/shared/AppFooter';
import { LayoutProvider } from 'components/default-layout';
import { BetaFeedbackFab } from 'components/beta-feedback';
import { isClosedBetaFeedbackEnabled } from 'config/featureFlags';

// ========================================
// TYPES
// ========================================

interface NavItem {
  id: string;
  labelKey: string;
  path: string;
}

interface LoggedLayoutContextValue {
  isMobileDrawerOpen: boolean;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  hasRecentInterview: boolean;
  setHasRecentInterview: (value: boolean) => void;
}

// ========================================
// CONTEXT (for TopBar hamburger integration)
// ========================================

const LoggedLayoutContext = React.createContext<LoggedLayoutContextValue | null>(null);

export const useLoggedLayout = () => {
  const context = React.useContext(LoggedLayoutContext);
  if (!context) {
    // Return a default value when not in LoggedLayout context
    return {
      isMobileDrawerOpen: false,
      toggleMobileDrawer: () => {},
      closeMobileDrawer: () => {},
      hasRecentInterview: false,
      setHasRecentInterview: () => {},
    };
  }
  return context;
};

// ========================================
// CONSTANTS
// ========================================

const SIDEBAR_WIDTH = 260;
const TOPBAR_HEIGHT = 80;
const BOTTOM_NAV_HEIGHT = 64;

// Main navigation items - B2C focused
const mainNavItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', path: '/app/b2c/dashboard' },
  { id: 'interviews', labelKey: 'nav.interviews', path: '/app/b2c/interviews' },
  { id: 'resumes', labelKey: 'nav.resumes', path: '/app/b2c/resumes' },
  { id: 'credits', labelKey: 'nav.credits', path: '/app/b2c/billing' },
];

// Secondary navigation items
const secondaryNavItems: NavItem[] = [
  { id: 'about', labelKey: 'nav.about', path: '/about' },
  { id: 'settings', labelKey: 'nav.settings', path: '/account' },
];

// Bottom nav items (mobile)
const bottomNavItems: NavItem[] = [
  { id: 'home', labelKey: 'nav.home', path: '/' },
  { id: 'interviews', labelKey: 'nav.interviews', path: '/app/b2c/interviews' },
  { id: 'credits', labelKey: 'nav.credits', path: '/app/b2c/billing' },
  { id: 'settings', labelKey: 'nav.settings', path: '/account' },
];

// ========================================
// PULSE INDICATOR COMPONENT
// ========================================

const PulseIndicator = memo<{ isActive: boolean }>(({ isActive }) => {
  if (!isActive) return null;

  return (
    <span className="relative flex h-2 w-2 ml-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600" />
    </span>
  );
});

PulseIndicator.displayName = 'PulseIndicator';

// ========================================
// SIDEBAR COMPONENT (Desktop)
// ========================================

interface SidebarProps {
  hasRecentInterview: boolean;
}

const Sidebar = memo<SidebarProps>(({ hasRecentInterview }) => {
  const { user } = useUser();
  const { userCredits } = useAuthCheck();
  const location = useLocation();
  const { t } = useTranslation();

  const isActivePath = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-zinc-200 flex-col hidden lg:flex z-40"
      style={{ width: SIDEBAR_WIDTH }}
      role="navigation"
      aria-label="Main sidebar navigation"
    >
      {/* Logo Section */}
      <div className="h-[100px] flex items-center px-6 border-b border-zinc-200">
        <Link to="/" aria-label="Vocaid Home">
          <BrandMark size="xl" linkToHome={false} />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        {/* Main Menu Section */}
        <div className="mb-8">
          <p className="px-3 mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
            {t('nav.home')}
          </p>
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = isActivePath(item.path);
              const showPulse = item.id === 'interviews' && hasRecentInterview;

              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={cn(
                      'relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActiveIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-600 rounded-r"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <span className="ml-2">{t(item.labelKey)}</span>
                    <PulseIndicator isActive={showPulse} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Secondary Navigation */}
        <div>
          <p className="px-3 mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
            {t('common.more', 'Resources')}
          </p>
          <ul className="space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = isActivePath(item.path);

              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={cn(
                      'relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebarSecondaryIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-600 rounded-r"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <span className="ml-2">{t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Section - Bottom */}
      <div className="border-t border-zinc-200 p-4">
        {/* Credits Display */}
        <div className="mb-4 px-3 py-3 bg-zinc-50 rounded-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            {t('nav.credits')}
          </p>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">
            {userCredits ?? 0}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{t('dashboard.stats.creditsRemaining', 'available')}</p>
        </div>

        {/* User Profile */}
        <Link
          to="/account"
          className="flex items-center gap-3 px-3 py-2 mb-4 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          <CustomAvatar
            imageUrl={user?.imageUrl}
            firstName={user?.firstName}
            lastName={user?.lastName}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {(user?.publicMetadata?.role as string) || user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </Link>

        {/* Language Selector */}
        <LanguageSelector variant="sidebar" />
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

// ========================================
// MOBILE DRAWER COMPONENT
// ========================================

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hasRecentInterview: boolean;
}

const MobileDrawer = memo<MobileDrawerProps>(({ isOpen, onClose, hasRecentInterview }) => {
  const { user } = useUser();
  const { userCredits } = useAuthCheck();
  const location = useLocation();
  const { t } = useTranslation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isActivePath = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus the close button when drawer opens
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-[280px] bg-white z-50 lg:hidden overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <BrandMark size="lg" linkToHome={false} />
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Profile Section */}
            {user && (
              <div className="border-b border-zinc-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <CustomAvatar
                    imageUrl={user.imageUrl}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                {/* Credits Display */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-sm text-zinc-500">{t('dashboard.stats.creditsRemaining')}</span>
                  <span className="text-base font-semibold text-zinc-900">{userCredits ?? 0}</span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="py-4">
              {/* Main Section */}
              <p className="px-6 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                {t('nav.home')}
              </p>
              <ul>
                {mainNavItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  const showPulse = item.id === 'interviews' && hasRecentInterview;

                  return (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center px-6 py-3 text-base font-medium transition-colors',
                          isActive
                            ? 'text-purple-600 bg-purple-50'
                            : 'text-zinc-700 hover:bg-zinc-50'
                        )}
                        onClick={onClose}
                      >
                        {t(item.labelKey)}
                        <PulseIndicator isActive={showPulse} />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Secondary Section */}
              <div className="border-t border-zinc-200 mt-4 pt-4">
                <p className="px-6 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                  {t('common.more', 'Resources')}
                </p>
                <ul>
                  {secondaryNavItems.map((item) => {
                    const isActive = isActivePath(item.path);

                    return (
                      <li key={item.id}>
                        <Link
                          to={item.path}
                          className={cn(
                            'flex items-center px-6 py-3 text-base font-medium transition-colors',
                            isActive
                              ? 'text-purple-600 bg-purple-50'
                              : 'text-zinc-700 hover:bg-zinc-50'
                          )}
                          onClick={onClose}
                        >
                          {t(item.labelKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            {/* Language Selector at bottom */}
            <div className="border-t border-zinc-200 p-4 mt-auto">
              <p className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                {t('language.select')}
              </p>
              <LanguageSelector variant="horizontal" className="justify-center" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

MobileDrawer.displayName = 'MobileDrawer';

// ========================================
// BOTTOM NAV COMPONENT (Mobile)
// ========================================

interface BottomNavProps {
  hasRecentInterview: boolean;
}

const BottomNav = memo<BottomNavProps>(({ hasRecentInterview }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const isActivePath = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 lg:hidden z-40"
      style={{ height: BOTTOM_NAV_HEIGHT }}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <ul className="flex items-center justify-around h-full px-2">
        {bottomNavItems.map((item) => {
          const isActive = isActivePath(item.path);
          const showPulse = item.id === 'interviews' && hasRecentInterview;

          return (
            <li key={item.id} className="flex-1">
              <Link
                to={item.path}
                className={cn(
                  'relative flex flex-col items-center justify-center h-full px-2 text-center transition-colors',
                  isActive
                    ? 'text-purple-600'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-600 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <span className="relative text-xs font-semibold tracking-tight">
                  {t(item.labelKey)}
                  <PulseIndicator isActive={showPulse} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

// ========================================
// LOGGED LAYOUT TOPBAR
// ========================================

const LoggedTopBar = memo(() => {
  const { userCredits } = useAuthCheck();
  const { t } = useTranslation();
  const { isMobileDrawerOpen, toggleMobileDrawer } = useLoggedLayout();

  return (
    <header
      className="fixed top-0 right-0 bg-white border-b border-zinc-200 z-30"
      style={{
        height: TOPBAR_HEIGHT,
        left: 0, // Full width on mobile
      }}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-8 lg:ml-[260px]">
        {/* Mobile: Hamburger + Logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={toggleMobileDrawer}
            className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
            aria-label={isMobileDrawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileDrawerOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileDrawerOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <Link to="/" className="lg:hidden">
            <BrandMark size="md" linkToHome={false} />
          </Link>
        </div>

        {/* Desktop: Empty space (logo is in sidebar) */}
        <div className="hidden lg:block" />

        {/* Right side: Account menu */}
        <div className="flex items-center gap-4">
          {/* Credits badge - desktop only */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg">
            <span className="text-xs text-zinc-500">{t('nav.credits')}</span>
            <span className="text-sm font-semibold text-zinc-900">{userCredits ?? 0}</span>
          </div>

          {/* Account Menu */}
          <AccountMenu variant="desktop" />
        </div>
      </div>
    </header>
  );
});

LoggedTopBar.displayName = 'LoggedTopBar';

// ========================================
// MAIN LOGGED LAYOUT COMPONENT
// ========================================

interface LoggedLayoutProps {
  children?: React.ReactNode;
}

export const LoggedLayout: React.FC<LoggedLayoutProps> = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [hasRecentInterview, setHasRecentInterview] = useState(false);

  const toggleMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(prev => !prev);
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false);
  }, []);

  // Context value - memoized to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      isMobileDrawerOpen,
      toggleMobileDrawer,
      closeMobileDrawer,
      hasRecentInterview,
      setHasRecentInterview,
    }),
    [isMobileDrawerOpen, toggleMobileDrawer, closeMobileDrawer, hasRecentInterview]
  );

  // Loading skeleton while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-purple-200 rounded-full" />
          <div className="w-32 h-4 bg-zinc-200 rounded" />
        </div>
      </div>
    );
  }

  // If not signed in, children should handle redirect (via ConsentGuard/ProtectedRoute)
  if (!isSignedIn) {
    return <>{children || <Outlet />}</>;
  }

  return (
    <LoggedLayoutContext.Provider value={contextValue}>
      <LayoutProvider>
        <div className="min-h-screen bg-zinc-50">
          {/* Skip to content link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg"
          >
            Skip to content
          </a>

          {/* Desktop Sidebar */}
          <Sidebar hasRecentInterview={hasRecentInterview} />

          {/* Mobile Drawer */}
          <MobileDrawer
            isOpen={isMobileDrawerOpen}
            onClose={closeMobileDrawer}
            hasRecentInterview={hasRecentInterview}
          />

          {/* Top Bar */}
          <LoggedTopBar />

          {/* Main Content Area */}
          <main
            id="main-content"
            className={cn(
              'min-h-screen',
              // Offset for sidebar on desktop
              'lg:ml-[260px]',
              // Offset for topbar
              'pt-[80px]',
              // Offset for bottom nav on mobile
              'pb-[64px] lg:pb-0'
            )}
            role="main"
          >
            {/* Page Container with consistent padding */}
            <div className="page-container py-6 px-4 sm:px-6 lg:px-8">
              {children || <Outlet />}
            </div>

            {/* Footer - inside main for proper scroll */}
            <AppFooter variant="app" />
          </main>

          {/* Bottom Navigation (mobile) */}
          <BottomNav hasRecentInterview={hasRecentInterview} />

          {/* Feedback FAB (global) */}
          {isClosedBetaFeedbackEnabled() && <BetaFeedbackFab />}
        </div>
      </LayoutProvider>
    </LoggedLayoutContext.Provider>
  );
};

export default LoggedLayout;
