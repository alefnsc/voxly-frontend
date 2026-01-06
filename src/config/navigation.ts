/**
 * Navigation Configuration
 * 
 * Single source of truth for all navigation items.
 * Used by sidebar (desktop) and mobile menu.
 * Includes role gating and feature flags.
 * 
 * Supports 3-in-1 Platform:
 * - B2C: Interview Practice & Performance (candidates)
 * - B2B: Recruiter Interview Platform (organizations)
 * - HR: Employee Hub (internal support)
 * 
 * @module config/navigation
 */

// ========================================
// TYPES
// ========================================

export type UserRole = 'admin' | 'recruiter' | 'manager' | 'candidate' | 'employee';

/** 
 * Platform context for 3-in-1 structure
 * - b2c: Personal workspace for candidates (Interview Practice)
 * - b2b: Organization workspace for recruiters (Interview Platform)
 * - hr: Employee Hub for internal support
 */
export type ViewContext = 'b2c' | 'b2b' | 'hr';

/** @deprecated Use ViewContext instead */
export type LegacyViewContext = 'recruiter' | 'employee' | 'candidate';

export interface NavItem {
  id: string;
  labelKey: string;
  path: string;
  /** Icon name from lucide-react */
  icon?: string;
  /** Roles that can access this item. If empty, all authenticated users can access. */
  requiredRoles?: UserRole[];
  /** Context required (b2c, b2b, hr). If undefined, shown in all contexts. */
  requiredContext?: ViewContext;
  /** Feature flag key for conditional display */
  featureFlag?: string;
  /** Whether this requires authentication */
  requiresAuth?: boolean;
  /** Section grouping */
  section: 'main' | 'resources' | 'admin' | 'billing';
  /** Order within section */
  order: number;
  /** Badge text (e.g., "New", "Beta") */
  badge?: string;
  /** Whether item should be hidden from nav but still accessible via route */
  hidden?: boolean;
}

export interface NavSection {
  id: string;
  labelKey: string;
  items: NavItem[];
}

/**
 * Platform configuration for context switcher
 */
export interface PlatformConfig {
  id: ViewContext;
  labelKey: string;
  description: string;
  icon: string;
  basePath: string;
  requiredRoles?: UserRole[];
}

export const PLATFORM_CONFIG: PlatformConfig[] = [
  {
    id: 'b2c',
    labelKey: 'platform.b2c.title',
    description: 'Practice interviews and improve your performance',
    icon: 'User',
    basePath: '/app/b2c',
    requiredRoles: ['candidate'],
  },
  {
    id: 'b2b',
    labelKey: 'platform.b2b.title',
    description: 'Evaluate candidates with structured interviews',
    icon: 'Building2',
    basePath: '/app/b2b',
    requiredRoles: ['recruiter', 'manager', 'admin'],
  },
  {
    id: 'hr',
    labelKey: 'platform.hr.title',
    description: 'Internal employee support and onboarding',
    icon: 'Users',
    basePath: '/app/hr',
    requiredRoles: ['employee', 'manager', 'admin'],
  },
];

// ========================================
// NAVIGATION CONFIGURATION
// ========================================

export const NAV_CONFIG: NavItem[] = [
  // ----------------------------------------
  // PUBLIC / LANDING
  // ----------------------------------------
  {
    id: 'home',
    labelKey: 'nav.home',
    path: '/',
    icon: 'Home',
    section: 'main',
    order: 0,
    requiresAuth: false,
  },
  {
    id: 'about',
    labelKey: 'nav.about',
    path: '/about',
    icon: 'Info',
    section: 'resources',
    order: 1,
    requiresAuth: false,
  },

  // ----------------------------------------
  // B2C: Interview Practice & Performance
  // ----------------------------------------
  {
    id: 'b2c-dashboard',
    labelKey: 'nav.dashboard',
    path: '/app/b2c/dashboard',
    icon: 'LayoutDashboard',
    section: 'main',
    order: 1,
    requiresAuth: true,
    requiredContext: 'b2c',
  },
  {
    id: 'b2c-interview-new',
    labelKey: 'nav.newInterview',
    path: '/app/b2c/interview/new',
    icon: 'PlayCircle',
    section: 'main',
    order: 2,
    requiresAuth: true,
    requiredContext: 'b2c',
  },
  {
    id: 'b2c-interviews',
    labelKey: 'nav.interviews',
    path: '/app/b2c/interviews',
    icon: 'History',
    section: 'main',
    order: 3,
    requiresAuth: true,
    requiredContext: 'b2c',
  },
  {
    id: 'b2c-resumes',
    labelKey: 'nav.resumes',
    path: '/app/b2c/resume-library',
    icon: 'FileText',
    section: 'main',
    order: 4,
    requiresAuth: true,
    requiredContext: 'b2c',
  },
  // NOTE: b2c-insights has been removed - merged into dashboard
  // Route /app/b2c/insights now redirects to /app/b2c/dashboard

  // ----------------------------------------
  // B2B: Recruiter Interview Platform
  // ----------------------------------------
  {
    id: 'b2b-dashboard',
    labelKey: 'nav.dashboard',
    path: '/app/b2b/dashboard',
    icon: 'LayoutDashboard',
    section: 'main',
    order: 1,
    requiresAuth: true,
    requiredContext: 'b2b',
    requiredRoles: ['recruiter', 'manager', 'admin'],
  },
  {
    id: 'b2b-kits',
    labelKey: 'nav.interviewKits',
    path: '/app/b2b/kits',
    icon: 'Package',
    section: 'main',
    order: 2,
    requiresAuth: true,
    requiredContext: 'b2b',
    requiredRoles: ['recruiter', 'manager', 'admin'],
  },
  {
    id: 'b2b-candidates',
    labelKey: 'nav.candidates',
    path: '/app/b2b/candidates',
    icon: 'Users',
    section: 'main',
    order: 3,
    requiresAuth: true,
    requiredContext: 'b2b',
    requiredRoles: ['recruiter', 'manager', 'admin'],
  },
  {
    id: 'b2b-analytics',
    labelKey: 'nav.analytics',
    path: '/app/b2b/analytics',
    icon: 'BarChart3',
    section: 'main',
    order: 4,
    requiresAuth: true,
    requiredContext: 'b2b',
    requiredRoles: ['recruiter', 'manager', 'admin'],
  },
  {
    id: 'b2b-developer',
    labelKey: 'nav.developer',
    path: '/app/b2b/developer',
    icon: 'Code',
    section: 'main',
    order: 5,
    requiresAuth: true,
    requiredContext: 'b2b',
    requiredRoles: ['admin'],
    badge: 'Beta',
  },

  // ----------------------------------------
  // HR: Employee Hub
  // ----------------------------------------
  {
    id: 'hr-dashboard',
    labelKey: 'nav.hrHub',
    path: '/app/hr',
    icon: 'Building',
    section: 'main',
    order: 1,
    requiresAuth: true,
    requiredContext: 'hr',
    requiredRoles: ['employee', 'manager', 'admin'],
  },

  // ----------------------------------------
  // BILLING (B2C context)
  // ----------------------------------------
  {
    id: 'billing',
    labelKey: 'nav.billing',
    path: '/account?section=creditsPurchase',
    icon: 'CreditCard',
    section: 'billing',
    order: 1,
    requiresAuth: true,
  },

  // ----------------------------------------
  // ADMIN / SETTINGS
  // ----------------------------------------
  {
    id: 'account',
    labelKey: 'nav.account',
    path: '/account',
    icon: 'Settings',
    section: 'admin',
    order: 1,
    requiresAuth: true,
  },

  // ----------------------------------------
  // LEGACY ROUTES (redirect to new paths)
  // ----------------------------------------
  {
    id: 'legacy-interviews',
    labelKey: 'interviews.title',
    path: '/interviews',
    section: 'main',
    order: 99,
    requiresAuth: true,
    hidden: true, // Don't show in nav, handled by redirect
  },
  {
    id: 'legacy-resumes',
    labelKey: 'nav.resumes',
    path: '/resumes',
    section: 'main',
    order: 99,
    requiresAuth: true,
    hidden: true,
  },
  {
    id: 'legacy-credits',
    labelKey: 'nav.credits',
    path: '/credits',
    section: 'main',
    order: 99,
    requiresAuth: true,
    hidden: true,
  },
];

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get navigation items filtered by user role and context
 */
export function getFilteredNavItems(options: {
  isAuthenticated: boolean;
  userRole?: UserRole;
  viewContext?: ViewContext;
  enabledFeatures?: string[];
}): NavItem[] {
  const { isAuthenticated, userRole, viewContext, enabledFeatures = [] } = options;

  return NAV_CONFIG.filter((item) => {
    // Skip hidden items
    if (item.hidden) {
      return false;
    }

    // Check authentication requirement
    if (item.requiresAuth && !isAuthenticated) {
      return false;
    }

    // Check role requirements
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      if (!userRole || !item.requiredRoles.includes(userRole)) {
        return false;
      }
    }

    // Check context requirements
    if (item.requiredContext) {
      if (!viewContext || item.requiredContext !== viewContext) {
        return false;
      }
    }

    // Check feature flags
    if (item.featureFlag) {
      if (!enabledFeatures.includes(item.featureFlag)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Group navigation items by section
 */
export function getNavSections(items: NavItem[]): NavSection[] {
  const sectionMap: Record<string, NavItem[]> = {
    main: [],
    resources: [],
    billing: [],
    admin: [],
  };

  // Group items by section
  items.forEach((item) => {
    if (sectionMap[item.section]) {
      sectionMap[item.section].push(item);
    }
  });

  // Sort items within each section
  Object.values(sectionMap).forEach((sectionItems) => {
    sectionItems.sort((a, b) => a.order - b.order);
  });

  // Build sections array
  const sections: NavSection[] = [];

  if (sectionMap.main.length > 0) {
    sections.push({
      id: 'main',
      labelKey: 'nav.main',
      items: sectionMap.main,
    });
  }

  if (sectionMap.billing.length > 0) {
    sections.push({
      id: 'billing',
      labelKey: 'nav.billing',
      items: sectionMap.billing,
    });
  }

  if (sectionMap.resources.length > 0) {
    sections.push({
      id: 'resources',
      labelKey: 'common.more',
      items: sectionMap.resources,
    });
  }

  if (sectionMap.admin.length > 0) {
    sections.push({
      id: 'admin',
      labelKey: 'nav.settings',
      items: sectionMap.admin,
    });
  }

  return sections;
}

/**
 * Check if a path matches a nav item (for active state)
 */
export function isPathActive(itemPath: string, currentPath: string): boolean {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(itemPath);
}

/**
 * Get public-only nav items (for landing page, unauthenticated users)
 */
export function getPublicNavItems(): NavItem[] {
  return NAV_CONFIG.filter((item) => !item.requiresAuth && !item.hidden);
}

/**
 * Get protected app nav items
 */
export function getProtectedNavItems(userRole?: UserRole, viewContext?: ViewContext): NavItem[] {
  return getFilteredNavItems({
    isAuthenticated: true,
    userRole,
    viewContext,
  });
}

/**
 * Get available platforms for a user based on their role
 */
export function getAvailablePlatforms(userRole?: UserRole): PlatformConfig[] {
  return PLATFORM_CONFIG.filter((platform) => {
    if (!platform.requiredRoles || platform.requiredRoles.length === 0) {
      return true;
    }
    return userRole && platform.requiredRoles.includes(userRole);
  });
}

/**
 * Get the default platform for a user based on their role
 */
export function getDefaultPlatform(userRole?: UserRole): PlatformConfig {
  // Priority: B2C for candidates, B2B for recruiters/managers, HR for employees
  if (userRole === 'candidate') {
    return PLATFORM_CONFIG.find((p) => p.id === 'b2c')!;
  }
  if (userRole === 'recruiter' || userRole === 'manager' || userRole === 'admin') {
    return PLATFORM_CONFIG.find((p) => p.id === 'b2b')!;
  }
  if (userRole === 'employee') {
    return PLATFORM_CONFIG.find((p) => p.id === 'hr')!;
  }
  // Default to B2C for unknown roles
  return PLATFORM_CONFIG.find((p) => p.id === 'b2c')!;
}

/**
 * Detect current platform context from URL path
 */
export function detectPlatformFromPath(path: string): ViewContext | null {
  if (path.startsWith('/app/b2c')) return 'b2c';
  if (path.startsWith('/app/b2b')) return 'b2b';
  if (path.startsWith('/app/hr')) return 'hr';
  return null;
}

/**
 * Get nav items for a specific platform
 */
export function getPlatformNavItems(
  platform: ViewContext,
  userRole?: UserRole,
  enabledFeatures?: string[]
): NavItem[] {
  return getFilteredNavItems({
    isAuthenticated: true,
    userRole,
    viewContext: platform,
    enabledFeatures,
  });
}
