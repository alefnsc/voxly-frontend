/**
 * Bottom Navigation Component
 * 
 * Responsive bottom navigation bar for mobile/tablet (< 1024px).
 * Text-only labels following the typography-first design system.
 * 
 * @module components/bottom-nav
 */

'use client'

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { B2C_ROUTES } from 'routes/b2cRoutes';

// ========================================
// TYPES
// ========================================

interface NavItem {
  id: string;
  labelKey: string;
  path: string;
}

// ========================================
// CONSTANTS
// For authenticated users, "home" goes to B2C dashboard
// Using centralized route constants
// ========================================

const navItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', path: B2C_ROUTES.DASHBOARD },
  { id: 'interviews', labelKey: 'nav.interviews', path: B2C_ROUTES.INTERVIEWS },
  { id: 'credits', labelKey: 'nav.credits', path: B2C_ROUTES.BILLING },
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
    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
    </span>
  );
};

// ========================================
// BOTTOM NAV COMPONENT
// ========================================

interface BottomNavProps {
  hasRecentInterview?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ hasRecentInterview = false }) => {
  const { isSignedIn } = useUser();
  const location = useLocation();
  const { t } = useTranslation();

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Don't render for non-authenticated users
  if (!isSignedIn) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 lg:hidden z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <ul className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = isActivePath(item.path);
          const showPulse = item.id === 'interviews' && hasRecentInterview;

          return (
            <li key={item.id} className="flex-1 min-w-0">
              <Link
                to={item.path}
                className={`
                  relative flex flex-col items-center justify-center h-full px-1 py-2 text-center transition-colors min-h-[44px]
                  ${isActive 
                    ? 'text-purple-600' 
                    : 'text-zinc-500 hover:text-zinc-900'
                  }
                `}
              >
                {/* Active indicator - underline */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-600 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                
                <span className="relative text-[10px] sm:text-xs font-semibold tracking-tight truncate w-full">
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
};

export default BottomNav;
