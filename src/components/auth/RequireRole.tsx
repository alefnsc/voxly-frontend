/**
 * RequireRole - Role-based Access Control Component
 * 
 * Wraps protected routes to enforce role-based access.
 * Redirects users based on authentication and role status.
 * 
 * @module components/auth/RequireRole
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from 'contexts/AuthContext';
import { useUserContext } from '../../contexts/UserContext';
import Loading from 'components/loading';

// User roles matching backend UserType enum
export type UserRole = 'PERSONAL' | 'CANDIDATE' | 'EMPLOYEE';

interface RequireRoleProps {
  /** Roles allowed to access this route. If empty, any authenticated user can access. */
  allowedRoles?: UserRole[];
  /** Fallback path when user doesn't have required role */
  fallbackPath?: string;
  /** Children to render when access is granted */
  children: React.ReactNode;
}

/**
 * RequireRole Component
 * 
 * Usage:
 * ```tsx
 * <RequireRole allowedRoles={['PERSONAL']}>
 *   <ProtectedPage />
 * </RequireRole>
 * ```
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles = [],
  fallbackPath = '/access-denied',
  children
}) => {
  const { isLoaded, isSignedIn } = useUser();
  const { isLoading, dbUser, isSynced } = useUserContext();
  const location = useLocation();

  // Still loading auth state
  if (!isLoaded || isLoading || (isSignedIn && !isSynced)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Not authenticated - redirect to sign in
  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If no roles specified, just require authentication
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check user role from database
  const userRole = (dbUser?.userType || 'PERSONAL') as UserRole;
  
  if (!allowedRoles.includes(userRole)) {
    // User doesn't have required role
    return <Navigate to={fallbackPath} replace />;
  }

  // User has required role
  return <>{children}</>;
};

/**
 * RequireAuth - Simple authentication check wrapper
 * 
 * Usage:
 * ```tsx
 * <RequireAuth>
 *   <ProtectedPage />
 * </RequireAuth>
 * ```
 */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RequireRole>{children}</RequireRole>;
};

/**
 * RequirePersonal - Shorthand for Personal role requirement
 */
export const RequirePersonal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RequireRole allowedRoles={['PERSONAL']}>{children}</RequireRole>;
};

/**
 * RequireCandidate - Shorthand for Candidate (B2B) role requirement
 */
export const RequireCandidate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RequireRole allowedRoles={['CANDIDATE']}>{children}</RequireRole>;
};

/**
 * RequireEmployee - Shorthand for Employee (B2B) role requirement
 */
export const RequireEmployee: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RequireRole allowedRoles={['EMPLOYEE']}>{children}</RequireRole>;
};

export default RequireRole;
