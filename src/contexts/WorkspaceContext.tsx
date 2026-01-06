/**
 * Workspace Context
 * 
 * Manages organization/workspace selection for B2B multi-tenant model.
 * Handles workspace resolution, switching, and context persistence.
 * 
 * NOTE: With first-party auth migration, third-party organizations are no longer used.
 * This context now provides a simplified workspace abstraction for future B2B features.
 * Personal users (B2C) operate without a workspace.
 * 
 * @module contexts/WorkspaceContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from 'contexts/AuthContext';
import { UserRole, ViewContext } from '../config/navigation';

// ========================================
// TYPES
// ========================================

export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  role: UserRole;
}

export interface WorkspaceContextType {
  // Workspace state
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isResolved: boolean;
  needsWorkspaceSelection: boolean;
  
  // View context (employee vs recruiter)
  viewContext: ViewContext;
  setViewContext: (context: ViewContext) => void;
  
  // User role in current workspace
  userRole: UserRole;
  
  // Actions
  selectWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Storage key for persisted workspace
const WORKSPACE_STORAGE_KEY = 'Vocaid_current_workspace';
const VIEW_CONTEXT_STORAGE_KEY = 'Vocaid_view_context';

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get persisted workspace ID from storage
 */
function getPersistedWorkspaceId(): string | null {
  try {
    return localStorage.getItem(WORKSPACE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist workspace ID to storage
 */
function persistWorkspaceId(workspaceId: string): void {
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get persisted view context from storage
 */
function getPersistedViewContext(): ViewContext {
  try {
    const stored = localStorage.getItem(VIEW_CONTEXT_STORAGE_KEY);
    // Support both old and new view context values
    if (stored === 'b2c' || stored === 'b2b' || stored === 'hr') {
      return stored;
    }
    // Migrate old values
    if (stored === 'candidate') return 'b2c';
    if (stored === 'recruiter') return 'b2b';
    if (stored === 'employee') return 'hr';
  } catch {
    // Ignore
  }
  return 'b2c'; // Default view context (personal interview practice)
}

/**
 * Persist view context to storage
 */
function persistViewContext(context: ViewContext): void {
  try {
    localStorage.setItem(VIEW_CONTEXT_STORAGE_KEY, context);
  } catch {
    // Ignore storage errors
  }
}

// ========================================
// PROVIDER
// ========================================

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  
    // With first-party auth, we no longer use organizations
  // For now, all users operate in personal mode (B2C)
  // B2B organization features will be implemented separately

  // State
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolved, setIsResolved] = useState(false);
  const [viewContext, setViewContextState] = useState<ViewContext>(getPersistedViewContext);

  // Compute user role from user metadata (organizations not used with first-party auth)
  const userRole: UserRole = React.useMemo(() => {
    // Check user's public metadata for role
    const metadataRole = user?.publicMetadata?.role as string | undefined;
    if (metadataRole) {
      // Map metadata role to UserRole
      switch (metadataRole.toLowerCase()) {
        case 'admin':
          return 'admin';
        case 'recruiter':
          return 'recruiter';
        case 'manager':
          return 'manager';
        case 'employee':
          return 'employee';
        case 'candidate':
        default:
          return 'candidate';
      }
    }
    
    // Default to candidate for personal users
    return 'candidate';
  }, [user?.publicMetadata?.role]);

  // Check if user needs to select a workspace (not applicable in personal mode)
  const needsWorkspaceSelection = false;

  // Handle view context changes
  const setViewContext = useCallback((context: ViewContext) => {
    setViewContextState(context);
    persistViewContext(context);
  }, []);

  // Placeholder for future B2B workspace list
  const refreshWorkspaces = useCallback(async () => {
    // With first-party auth, organizations are not yet implemented
    // Personal users have no workspaces
    setWorkspaces([]);
  }, []);

  // Placeholder for future workspace selection
  const selectWorkspace = useCallback(async (workspaceId: string) => {
    // B2B workspace selection not yet implemented with first-party auth
    console.warn('Workspace selection not available in current auth mode');
  }, []);

  // Resolve workspace on load - simplified for personal users
  useEffect(() => {
    const resolveWorkspace = async () => {
      // Wait for user data to load
      if (!isUserLoaded) {
        return;
      }

      // Not signed in - no workspace to resolve
      if (!isSignedIn) {
        setIsLoading(false);
        setIsResolved(true);
        setCurrentWorkspace(null);
        return;
      }

      // With first-party auth, all users operate in personal mode
      // No organization/workspace to resolve
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setIsResolved(true);
      setIsLoading(false);
    };

    resolveWorkspace();
  }, [isUserLoaded, isSignedIn]);

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    isLoading,
    isResolved,
    needsWorkspaceSelection,
    viewContext,
    setViewContext,
    userRole,
    selectWorkspace,
    refreshWorkspaces,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  
  return context;
}

export default WorkspaceContext;
