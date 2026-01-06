/**
 * First-Party Authentication Context
 * 
 * Provides session-based authentication using httpOnly cookies.
 * Replaces third-party authentication with native implementation.
 * 
 * Features:
 * - Session-based auth with secure cookies
 * - Email/password registration and login
 * - Google OAuth support
 * - Email verification flow
 * - Password reset functionality
 * 
 * @module contexts/AuthContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { config } from '../lib/config';

// ============================================
// TYPES
// ============================================

/**
 * User metadata stored on the user record.
 * This replaces the legacy public metadata concept.
 */
export interface UserPublicMetadata {
  role?: 'Candidate' | 'Recruiter' | 'Admin';
  countryCode?: string;
  preferred_language?: string;
  languageSetByUser?: boolean;
  registration_region?: string;
  registration_country?: string;
  preferredPhoneCountry?: string;
  registered_at?: string;
  onboarding_complete?: boolean;
  credits?: number;
  // Phone verification
  phone_verification_skipped_for_credits?: boolean;
  // Registration metadata
  initial_ip?: string;
  metadata_updated_at?: string;
}

/**
 * Legacy-compatible email address object.
 * Provides backwards compatibility with code using user.primaryEmailAddress.emailAddress
 */
export interface EmailAddress {
  emailAddress: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
  credits: number;
  preferredLanguage: string | null;
  countryCode: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  createdAt: string;
  
  // Legacy compatibility properties
  /** @deprecated Use email directly. Provided for legacy compatibility. */
  primaryEmailAddress: EmailAddress | null;
  /** User metadata. Replaces legacy public metadata. */
  publicMetadata: UserPublicMetadata;
  
  // First-party auth properties
  /** Whether user has set a password (false for OAuth-only users) */
  hasPassword: boolean;
  /** Auth providers used by this user (e.g., ['email'], ['google'], ['email', 'google']) */
  authProviders: string[];
  /** Last auth provider used to sign in */
  lastAuthProvider: string | null;
}

export interface AuthState {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  preferredLanguage?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  // Auth actions
  signUp: (data: SignUpData) => Promise<{ success: boolean; requiresVerification?: boolean; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  signInWithX: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Email verification
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Password reset
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // Session management
  refreshSession: () => Promise<void>;
  
  // User updates
  updateUser: (data: Partial<User>) => void;
  
  // Legacy compatibility - navigation-based sign-in
  /** Navigate to sign-in page. Replaces legacy open-sign-in entrypoints. */
  openSignIn: () => void;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// API HELPERS
// ============================================

const API_BASE = config.backendUrl;

async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include session cookies
    });

    const contentType = response.headers.get('content-type');
    let data: any = null;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      return {
        error: data?.message || data?.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return { data, status: response.status };
  } catch (error: any) {
    console.error('[AuthContext] Fetch error:', error);
    return {
      error: error.message || 'Network error',
      status: 0,
    };
  }
}

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Derived state
  const isSignedIn = useMemo(() => !!user, [user]);

  // ========================================
  // SESSION VALIDATION
  // ========================================

  const validateSession = useCallback(async (): Promise<User | null> => {
    const { data, error } = await authFetch<{ user: User }>('/api/auth/me');
    
    if (error || !data?.user) {
      return null;
    }

    return data.user;
  }, []);

  const refreshSession = useCallback(async () => {
    const sessionUser = await validateSession();
    setUser(sessionUser);
  }, [validateSession]);

  // Initial session check on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const sessionUser = await validateSession();
        if (mounted) {
          setUser(sessionUser);
        }
      } catch (error) {
        console.error('[AuthContext] Init error:', error);
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [validateSession]);

  // ========================================
  // SIGN UP
  // ========================================

  const signUp = useCallback(async (data: SignUpData) => {
    const { data: result, error, status } = await authFetch<{
      user: User;
      requiresVerification: boolean;
    }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (error) {
      return { success: false, error };
    }

    if (result?.requiresVerification) {
      // User created but needs email verification
      return { success: true, requiresVerification: true };
    }

    // User created and logged in (e.g., OAuth - auto-verified)
    if (result?.user) {
      setUser(result.user);
    }

    return { success: true };
  }, []);

  // ========================================
  // SIGN IN
  // ========================================

  const signIn = useCallback(async (data: SignInData) => {
    const { error } = await authFetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (error) {
      return { success: false, error };
    }

    // Prefer /me as source of truth for the complete user shape (incl. hasPassword)
    await refreshSession();

    return { success: true };
  }, [refreshSession]);

  // ========================================
  // GOOGLE OAUTH
  // ========================================

  const signInWithGoogle = useCallback(async () => {
    // Redirect to Google OAuth endpoint with returnTo for post-login routing
    window.location.href = `${API_BASE}/api/auth/google?returnTo=/auth/post-login`;
  }, []);

  // ========================================
  // LINKEDIN OAUTH
  // ========================================

  const signInWithLinkedIn = useCallback(async () => {
    // Redirect to LinkedIn OAuth endpoint with returnTo for post-login routing
    window.location.href = `${API_BASE}/api/auth/linkedin?returnTo=/auth/post-login`;
  }, []);

  // ========================================
  // X (TWITTER) OAUTH
  // ========================================

  const signInWithX = useCallback(async () => {
    // Redirect to X OAuth endpoint with returnTo for post-login routing
    window.location.href = `${API_BASE}/api/auth/x?returnTo=/auth/post-login`;
  }, []);

  // ========================================
  // SIGN OUT
  // ========================================

  const signOut = useCallback(async () => {
    await authFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    
    // Clear any local state
    localStorage.removeItem('vocaid_user_preferences');
  }, []);

  // ========================================
  // EMAIL VERIFICATION
  // ========================================

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const { error } = await authFetch<{ user: User }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });

    if (error) {
      return { success: false, error };
    }

    // User is now verified and logged in; refresh to get the full user shape (incl. hasPassword)
    await refreshSession();

    return { success: true };
  }, [refreshSession]);

  const resendVerificationEmail = useCallback(async (email: string) => {
    const { error } = await authFetch('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  }, []);

  // ========================================
  // PASSWORD RESET
  // ========================================

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await authFetch('/api/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    const { error } = await authFetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  }, []);

  // ========================================
  // USER UPDATES
  // ========================================

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  // ========================================
  // LEGACY COMPATIBILITY - OPEN SIGN IN
  // ========================================

  const openSignIn = useCallback(() => {
    window.location.href = '/sign-in';
  }, []);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoaded,
      isSignedIn,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithLinkedIn,
      signInWithX,
      signOut,
      verifyEmail,
      resendVerificationEmail,
      requestPasswordReset,
      resetPassword,
      refreshSession,
      updateUser,
      openSignIn,
    }),
    [
      user,
      isLoaded,
      isSignedIn,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithLinkedIn,
      signInWithX,
      signOut,
      verifyEmail,
      resendVerificationEmail,
      requestPasswordReset,
      resetPassword,
      refreshSession,
      updateUser,
      openSignIn,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to access auth context
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to access current user
 * Compatible with the legacy useUser hook API for easier migration
 */
export function useUser(): {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
} {
  const { user, isLoaded, isSignedIn } = useAuth();
  return { user, isLoaded, isSignedIn };
}

/**
 * Hook to check if user is signed in
 * Returns null while loading
 */
export function useIsAuthenticated(): boolean | null {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return isSignedIn;
}

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = '/sign-in',
  fallback,
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!isSignedIn) {
    // Redirect to sign-in
    window.location.href = redirectTo;
    return null;
  }

  return <>{children}</>;
}

export default AuthContext;
