/**
 * Account Menu Component
 * 
 * Custom account dropdown replacing Clerk's UserButton.
 * Typography-first design with no icons.
 * Shows user info, workspace, role, and actions.
 * 
 * @module components/account-menu
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from 'lib/utils';
import { useWorkspace } from 'contexts/WorkspaceContext';
import { CustomAvatar } from 'components/auth/CustomAvatar';

// ========================================
// TYPES
// ========================================

interface AccountMenuProps {
  /** Variant for different layouts */
  variant?: 'desktop' | 'mobile';
  /** Additional className */
  className?: string;
}

// ========================================
// ANIMATION VARIANTS
// ========================================

const dropdownVariants = {
  hidden: { 
    opacity: 0, 
    y: -4,
    scale: 0.98,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: { 
    opacity: 0, 
    y: -4,
    scale: 0.98,
    transition: { 
      duration: 0.15,
    },
  },
};

// ========================================
// COMPONENT
// ========================================

export const AccountMenu: React.FC<AccountMenuProps> = ({
  variant = 'desktop',
  className,
}) => {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentWorkspace, workspaces, userRole } = useWorkspace();
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Handle sign out - redirect to landing page
  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/');
  };

  // Handle navigation
  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  if (!isLoaded || !user) {
    return null;
  }

  // Get display info
  const displayName = user.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user.primaryEmailAddress?.emailAddress || 'User';
  
  // When user has no workspace, show "Personal" as both role and mode
  // When in an organization, show the org name and actual role
  const isPersonalMode = !currentWorkspace;
  const workspaceName = currentWorkspace?.name || t('account.personal', 'Personal');
  const roleName = isPersonalMode 
    ? t('account.personal', 'Personal') 
    : t(`auth.roles.${userRole}`, userRole);
  const hasMultipleWorkspaces = workspaces.length > 1;

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2',
          variant === 'desktop' && 'px-3 py-2 hover:bg-zinc-50',
          variant === 'mobile' && 'w-full px-4 py-3 hover:bg-zinc-50'
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <CustomAvatar
          imageUrl={user.imageUrl}
          firstName={user.firstName}
          lastName={user.lastName}
          size={variant === 'mobile' ? 'lg' : 'md'}
        />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-zinc-900 truncate">
            {displayName}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {workspaceName}
          </p>
        </div>
        <svg 
          className={cn(
            'w-4 h-4 text-zinc-400 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'absolute z-50 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden',
              variant === 'desktop' && 'right-0 top-full mt-2 w-72',
              variant === 'mobile' && 'left-0 right-0 bottom-full mb-2'
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-zinc-100">
              <p className="text-sm font-semibold text-zinc-900">
                {displayName}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {user.primaryEmailAddress?.emailAddress}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {roleName}
                </span>
                {/* Only show workspace name when in an organization (avoid "Personal Personal") */}
                {!isPersonalMode && (
                  <span className="text-xs text-zinc-400">
                    {workspaceName}
                  </span>
                )}
              </div>
            </div>

            {/* Menu Actions */}
            <div className="py-1">
              {/* Switch Workspace - Only show if multiple workspaces */}
              {hasMultipleWorkspaces && (
                <button
                  onClick={() => handleNavigate('/workspace-select')}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  role="menuitem"
                >
                  {t('account.switchWorkspace', 'Switch Workspace')}
                </button>
              )}

              {/* Account Settings */}
              <button
                onClick={() => handleNavigate('/account')}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                role="menuitem"
              >
                {t('account.title', 'Account Settings')}
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-zinc-100" />

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                role="menuitem"
              >
                {t('common.logout', 'Sign out')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========================================
// INLINE ACCOUNT DISPLAY (for sidebars)
// ========================================

interface AccountDisplayProps {
  showWorkspaceSwitcher?: boolean;
  className?: string;
}

export const AccountDisplay: React.FC<AccountDisplayProps> = ({
  showWorkspaceSwitcher = true,
  className,
}) => {
  const { user } = useUser();
  const { t } = useTranslation();
  const { currentWorkspace, workspaces, userRole } = useWorkspace();
  
  if (!user) return null;

  const displayName = user.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user.primaryEmailAddress?.emailAddress || 'User';
  
  // When user has no workspace, show "Personal" instead of "Candidate"
  const isPersonalMode = !currentWorkspace;
  const roleName = isPersonalMode 
    ? t('account.personal', 'Personal') 
    : t(`auth.roles.${userRole}`, userRole);

  return (
    <div className={cn('space-y-3', className)}>
      {/* User Profile Link */}
      <Link 
        to="/account"
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
      >
        <CustomAvatar
          imageUrl={user.imageUrl}
          firstName={user.firstName}
          lastName={user.lastName}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">
            {displayName}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {roleName}
          </p>
        </div>
      </Link>

      {/* Workspace Switcher (if multiple) */}
      {showWorkspaceSwitcher && workspaces.length > 1 && (
        <Link
          to="/workspace-select"
          className="block px-3 py-2 text-xs text-zinc-500 hover:text-purple-600 transition-colors"
        >
          {currentWorkspace?.name || t('account.selectWorkspace', 'Select Workspace')}
          <span className="ml-1">→</span>
        </Link>
      )}
    </div>
  );
};

export default AccountMenu;
