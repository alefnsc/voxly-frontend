/**
 * B2C Route Constants
 * 
 * Single source of truth for all B2C application routes.
 * All navigation should use these helpers instead of hardcoded strings.
 * 
 * @module routes/b2cRoutes
 */

// ============================================
// B2C ROUTES - Interview Practice & Performance
// ============================================

export const B2C_ROUTES = {
  // Main app routes
  DASHBOARD: '/app/b2c/dashboard',
  PERFORMANCE: '/app/b2c/performance',
  INTERVIEWS: '/app/b2c/interviews',
  INTERVIEW_NEW: '/app/b2c/interview/new',
  INTERVIEW_DETAIL: '/app/b2c/interview/:id',
  RESUMES: '/app/b2c/resume-library',
  BILLING: '/account?section=creditsPurchase',
  
  // Shared routes
  ACCOUNT: '/account',
  
  // Static public routes
  ABOUT: '/about',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_USE: '/terms-of-use',
  
  // Auth routes
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  
  // Landing
  HOME: '/',
} as const;

// ============================================
// ROUTE HELPER FUNCTIONS
// ============================================

/** Get the B2C dashboard route */
export const b2cDashboard = (): string => B2C_ROUTES.DASHBOARD;

/** Get the B2C performance route */
export const b2cPerformance = (): string => B2C_ROUTES.PERFORMANCE;

/** Get the B2C interviews list route */
export const b2cInterviewsList = (): string => B2C_ROUTES.INTERVIEWS;

/** Get the B2C new interview route */
export const b2cInterviewNew = (): string => B2C_ROUTES.INTERVIEW_NEW;

/** Get the B2C interview detail route */
export const b2cInterviewDetail = (id: string): string => `/app/b2c/interview/${id}`;

/** Get the B2C interview detail route pattern (for routing) */
export const b2cInterviewDetailPattern = (): string => B2C_ROUTES.INTERVIEW_DETAIL;

/** Get the B2C resumes route */
export const b2cResumes = (): string => B2C_ROUTES.RESUMES;

/** Get the billing route */
export const b2cBilling = (): string => B2C_ROUTES.BILLING;

/** Get the account/settings route */
export const b2cSettings = (): string => B2C_ROUTES.ACCOUNT;

/** Get the about page route */
export const b2cAbout = (): string => B2C_ROUTES.ABOUT;

/** Get the sign-in route */
export const signIn = (): string => B2C_ROUTES.SIGN_IN;

/** Get the sign-up route */
export const signUp = (): string => B2C_ROUTES.SIGN_UP;

/** Get the privacy policy route */
export const privacyPolicy = (): string => B2C_ROUTES.PRIVACY_POLICY;

/** Get the terms of use route */
export const termsOfUse = (): string => B2C_ROUTES.TERMS_OF_USE;

/** Get the home/landing route */
export const home = (): string => B2C_ROUTES.HOME;

// ============================================
// DEFAULT ROUTES
// ============================================

/** Default post-login route for Personal users */
export const DEFAULT_AUTHENTICATED_ROUTE = B2C_ROUTES.DASHBOARD;

/** Default fallback for unauthenticated users */
export const DEFAULT_PUBLIC_ROUTE = B2C_ROUTES.HOME;

// ============================================
// ROUTE TYPE GUARDS
// ============================================

/** Check if a path is a B2C route */
export const isB2CRoute = (path: string): boolean => {
  return path.startsWith('/app/b2c/') || 
         path === B2C_ROUTES.BILLING || 
         path === B2C_ROUTES.ACCOUNT ||
         path.startsWith('/interview/');
};

/** Check if a path is a public route */
export const isPublicRoute = (path: string): boolean => {
  const publicRoutes = [
    B2C_ROUTES.HOME,
    B2C_ROUTES.ABOUT,
    B2C_ROUTES.PRIVACY_POLICY,
    B2C_ROUTES.TERMS_OF_USE,
    B2C_ROUTES.SIGN_IN,
    B2C_ROUTES.SIGN_UP,
    '/access-denied',
    '/under-construction',
  ];
  return publicRoutes.includes(path);
};

export default B2C_ROUTES;
