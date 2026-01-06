/**
 * Sidebar Component
 * 
 * Enterprise HR Hub vertical sidebar navigation.
 * Fixed left position, 260px width with typography-based hierarchy.
 * Includes "Pulse" interview indicator for recent sessions.
 * 
 * @module components/sidebar
 */

'use client'

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from 'contexts/AuthContext';
import { useAuthCheck } from 'hooks/use-auth-check';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '../shared/Brand';
import { LanguageSelector } from 'components/language-selector';
import { CustomAvatar } from 'components/auth/CustomAvatar';
import { B2C_ROUTES } from 'routes/b2cRoutes';

// ========================================
// TYPES
// ========================================

interface NavItem {
  id: string;
  labelKey: string;
  path: string;
  requiresAuth?: boolean;
}

// ========================================
// CONSTANTS - Updated for merged navigation
// Dashboard, Interviews, Resumes, Settings for Personal users
// Using centralized route constants
// ========================================

const mainNavItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', path: B2C_ROUTES.DASHBOARD },
  { id: 'performance', labelKey: 'nav.performance', path: B2C_ROUTES.PERFORMANCE },
  { id: 'interviews', labelKey: 'nav.interviews', path: B2C_ROUTES.INTERVIEWS },
  { id: 'resumes', labelKey: 'nav.resumes', path: B2C_ROUTES.RESUMES },
  { id: 'credits', labelKey: 'nav.credits', path: B2C_ROUTES.BILLING },
];

const secondaryNavItems: NavItem[] = [
  { id: 'about', labelKey: 'nav.about', path: B2C_ROUTES.ABOUT },
  { id: 'settings', labelKey: 'nav.settings', path: B2C_ROUTES.ACCOUNT },
];

// ========================================
// PULSE INDICATOR COMPONENT
// ========================================

interface PulseIndicatorProps {
  isActive: boolean;
}

const PulseIndicator: React.FC<PulseIndicatorProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <span className="relative flex h-2 w-2 ml-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
    </span>
  );
};

// ========================================
// SIDEBAR COMPONENT
// ========================================

interface SidebarProps {
  hasRecentInterview?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ hasRecentInterview = false }) => {
  const { user, isSignedIn } = useUser();
  const { userCredits } = useAuthCheck();
  const location = useLocation();
  const { t } = useTranslation();

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Don't render sidebar for non-authenticated users
  if (!isSignedIn) {
    return null;
  }

  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-zinc-200 flex-col hidden lg:flex z-40"
      role="navigation"
      aria-label="Main sidebar navigation"
    >
      {/* Logo Section */}
      <div className="h-[80px] flex items-center px-6 border-b border-zinc-200">
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
                    className={`
                      relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                      ${isActive 
                        ? 'text-purple-600 bg-purple-50' 
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                      }
                    `}
                  >
                    {/* Active indicator - 4px purple vertical line */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-600 rounded-r"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    
                    <span className="ml-2">{t(item.labelKey)}</span>
                    
                    {/* Pulse indicator for recent interviews */}
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
                    className={`
                      relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                      ${isActive 
                        ? 'text-purple-600 bg-purple-50' 
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicatorSecondary"
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

        {/* Language Selector - Bottom */}
        <LanguageSelector variant="sidebar" />
      </div>
    </aside>
  );
};

export default Sidebar;
