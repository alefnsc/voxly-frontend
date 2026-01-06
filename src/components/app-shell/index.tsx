/**
 * App Shell Component
 * 
 * Unified authentication and workspace guard layer.
 * Used by both desktop and mobile layouts for consistent behavior.
 * Handles auth state, workspace resolution, and role gating.
 * 
 * @module components/app-shell
 */

'use client';

import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useUser, useAuth } from 'contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from 'lib/utils';
import { WorkspaceProvider, useWorkspace } from 'contexts/WorkspaceContext';
import { NAV_CONFIG, UserRole, NavItem } from 'config/navigation';

// ========================================
// TYPES
// ========================================

interface AppShellProps {
  /** Children to render when authenticated and resolved */
  children?: React.ReactNode;
  /** Required role(s) to access content */
  requiredRoles?: UserRole[];
  /** Whether to show loading spinner */
  showLoader?: boolean;
}

// ========================================
// LOADING SPINNER
// ========================================

const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 flex items-center justify-center bg-white z-50"
  >
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-zinc-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
      {message && (
        <p className="mt-4 text-sm text-zinc-600">{message}</p>
      )}
    </div>
  </motion.div>
);

// ========================================
// WORKSPACE REQUIRED SCREEN
// ========================================

const WorkspaceRequired: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
    >
      <div className="max-w-md mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-zinc-900">
          {t('workspace.selectRequired', 'Select a Workspace')}
        </h2>
        <p className="mt-3 text-zinc-600">
          {t('workspace.selectDescription', 'Please select or create a workspace to continue.')}
        </p>
        <button
          onClick={() => navigate('/workspace-select')}
          className={cn(
            'mt-6 w-full py-3 px-4',
            'bg-zinc-900 text-white font-medium rounded-xl',
            'hover:bg-zinc-800 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'
          )}
        >
          {t('workspace.selectButton', 'Select Workspace')}
        </button>
      </div>
    </motion.div>
  );
};

// ========================================
// ACCESS DENIED SCREEN
// ========================================

const AccessDenied: React.FC<{ requiredRoles: UserRole[] }> = ({ requiredRoles }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
    >
      <div className="max-w-md mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-zinc-900">
          {t('auth.accessDenied', 'Access Denied')}
        </h2>
        <p className="mt-3 text-zinc-600">
          {t('auth.insufficientPermissions', 'You do not have permission to access this page.')}
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          {t('auth.requiredRoles', 'Required: {{roles}}', {
            roles: requiredRoles.join(', ')
          })}
        </p>
        <button
          onClick={() => navigate(-1)}
          className={cn(
            'mt-6 w-full py-3 px-4',
            'bg-zinc-100 text-zinc-900 font-medium rounded-xl',
            'hover:bg-zinc-200 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'
          )}
        >
          {t('common.goBack', 'Go Back')}
        </button>
      </div>
    </motion.div>
  );
};

// ========================================
// INNER SHELL (uses workspace context)
// ========================================

const AppShellInner: React.FC<AppShellProps> = ({
  children,
  requiredRoles,
  showLoader = true,
}) => {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { isResolved, isLoading: workspaceLoading, userRole } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // List of public paths that don't require auth
  const publicPaths = ['/', '/sign-in', '/sign-up', '/sso-callback'];
  const isPublicPath = publicPaths.some(path => 
    location.pathname === path || location.pathname.startsWith('/sso-callback')
  );

  // Redirect to sign-in if not authenticated on protected route
  useEffect(() => {
    if (authLoaded && !isSignedIn && !isPublicPath) {
      navigate('/', { 
        state: { returnTo: location.pathname },
        replace: true 
      });
    }
  }, [authLoaded, isSignedIn, isPublicPath, navigate, location.pathname]);

  // Loading state
  const isLoading = !authLoaded || !userLoaded || workspaceLoading;
  
  if (isLoading && showLoader && !isPublicPath) {
    return (
      <AnimatePresence>
        <LoadingSpinner message={t('common.loading', 'Loading...')} />
      </AnimatePresence>
    );
  }

  // Not authenticated - handled by redirect above
  if (!isSignedIn && !isPublicPath) {
    return null;
  }

  // For public paths, render immediately
  if (isPublicPath) {
    return <>{children || <Outlet />}</>;
  }

  // Workspace not resolved (multi-org user needs to select)
  if (!isResolved) {
    return <WorkspaceRequired />;
  }

  // Role check
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(userRole);
    if (!hasRequiredRole) {
      return <AccessDenied requiredRoles={requiredRoles} />;
    }
  }

  // Authenticated, resolved, and authorized
  return <>{children || <Outlet />}</>;
};

// ========================================
// MAIN SHELL (provides workspace context)
// ========================================

export const AppShell: React.FC<AppShellProps> = (props) => {
  return (
    <WorkspaceProvider>
      <AppShellInner {...props} />
    </WorkspaceProvider>
  );
};

// ========================================
// ROLE GUARD WRAPPER
// ========================================

interface RoleGuardProps {
  /** Required roles to view content */
  roles: UserRole[];
  /** Content to render if authorized */
  children: React.ReactNode;
  /** Fallback if not authorized (default: null) */
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const { userRole } = useWorkspace();
  
  if (!roles.includes(userRole)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// ========================================
// NAV FILTER HELPER
// ========================================

/**
 * Filter nav items based on user role
 * Uses the flat NAV_CONFIG array and filters by section and role
 */
export const getNavItemsForRole = (role: UserRole): NavItem[] => {
  return NAV_CONFIG.filter(item => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    return item.requiredRoles.includes(role);
  });
};

/**
 * Get main nav items for role
 */
export const getMainNavItems = (role: UserRole): NavItem[] => {
  return NAV_CONFIG.filter(item => {
    if (item.section !== 'main') return false;
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    return item.requiredRoles.includes(role);
  });
};

/**
 * Get admin nav items for role
 */
export const getAdminNavItems = (role: UserRole): NavItem[] => {
  return NAV_CONFIG.filter(item => {
    if (item.section !== 'admin') return false;
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    return item.requiredRoles.includes(role);
  });
};

export default AppShell;
