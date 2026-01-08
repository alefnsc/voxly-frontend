import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ApolloProvider } from '@apollo/client';
import Layout from './components/layout';
import { LoggedLayout } from './components/logged-layout';
import LoggedHeaderLayout from './components/logged-header-layout';
import { QueryProvider } from './lib/queryClient';
import { apolloClient } from './lib/apolloClient';

// Route Guards & Providers (must be imported before lazy components)
import { ProtectedInterviewRoute } from './components/protected-interview-route';
import { HandshakeFallback } from './components/auth/HandshakeFallback';
import { ConsentGuard } from './components/auth/ConsentGuard';
import ErrorBoundary from './components/error-boundary';
import { InterviewFlowProvider } from './hooks/use-interview-flow';
import { UserProvider } from './contexts/UserContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { LanguageProvider } from './hooks/use-language';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './components/auth/RequireRole';

// Eager loaded - Critical path components
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';

// ============================================
// LAZY LOADED - Deferred until needed
// Reduces initial bundle size by ~40%
// ============================================
const Interview = lazy(() => import('./pages/Interview'));
const Feedback = lazy(() => import('./pages/Feedback'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const InterviewDetails = lazy(() => import('./pages/InterviewDetails'));
const About = lazy(() => import('./pages/About'));
const ResumeLibrary = lazy(() => import('./pages/ResumeLibrary'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const Account = lazy(() => import('./pages/Account'));
const AuthPasswordConfirm = lazy(() => import('./pages/AuthPasswordConfirm'));
const UnderConstruction = lazy(() => import('./pages/UnderConstruction'));
const AccessDenied = lazy(() => import('./pages/AccessDenied'));
const AuthError = lazy(() => import('./pages/AuthError'));

// New 3-in-1 Platform Pages (lazy loaded)
const B2CDashboard = lazy(() => import('./pages/app/b2c/dashboard'));
const B2CPerformance = lazy(() => import('pages/app/b2c/performance/index'));
const B2CInterviewNew = lazy(() => import('./pages/app/b2c/interview/new'));
const B2CInterviews = lazy(() => import('./pages/app/b2c/interviews'));
const ConsentPage = lazy(() => import('./pages/Onboarding/ConsentPage'));
const PasswordPage = lazy(() => import('./pages/Onboarding/PasswordPage'));
const AccountTypePage = lazy(() => import('./pages/Onboarding/AccountTypePage'));
const PostLogin = lazy(() => import('./pages/PostLogin'));

// ============================================
// SUSPENSE FALLBACK
// ============================================
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <QueryProvider>
          <AuthProvider>
            <UserProvider>
              <WorkspaceProvider>
              <LanguageProvider>
                <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
                  <InterviewFlowProvider>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          {/* ============================================ */}
                          {/* Auth routes (outside main layout) */}
                          {/* ============================================ */}
                          <Route path="sign-up" element={<SignUp />} />
                          <Route path="sign-in" element={<SignIn />} />
                          <Route path="auth/error" element={<AuthError />} />
                          <Route path="auth/post-login" element={<PostLogin />} />
                          <Route path="under-construction" element={<UnderConstruction />} />
                          
                          {/* Onboarding pages (outside main layout) */}
                          <Route path="onboarding/account-type" element={<AccountTypePage />} />
                          <Route path="onboarding/password" element={<PasswordPage />} />
                          <Route path="onboarding/consent" element={<ConsentPage />} />

                          {/* ============================================ */}
                          {/* LOGGED HEADER-ONLY ROUTES (no sidebar) */}
                          {/* Used for active interview + payment redirects */}
                          {/* ============================================ */}
                          <Route element={<RequireAuth><LoggedHeaderLayout /></RequireAuth>}>
                            <Route
                              path="interview"
                              element={
                                <ConsentGuard>
                                  <ProtectedInterviewRoute>
                                    <Interview />
                                  </ProtectedInterviewRoute>
                                </ConsentGuard>
                              }
                            />

                            {/* Payment result routes (no consent check - transactional) */}
                            <Route path="payment/success" element={<PaymentResult />} />
                            <Route path="payment/failure" element={<PaymentResult />} />
                            <Route path="payment/pending" element={<PaymentResult />} />
                          </Route>

                          {/* ============================================ */}
                          {/* LOGGED AREA ROUTES - Wrapped in LoggedLayout */}
                          {/* All /app/* routes use LoggedLayout for consistent */}
                          {/* TopBar, Sidebar, Footer, and mobile navigation */}
                          {/* ============================================ */}
                          <Route element={<RequireAuth><ConsentGuard><LoggedLayout /></ConsentGuard></RequireAuth>}>
                            {/* B2C: Interview Practice & Performance */}
                            <Route path="app/b2c/dashboard" element={<B2CDashboard />} />
                            <Route path="app/b2c/performance" element={<B2CPerformance />} />
                            <Route path="app/b2c/interview/new" element={<B2CInterviewNew />} />
                            <Route path="app/b2c/interview/:id" element={<InterviewDetails />} />
                            <Route path="app/b2c/interviews" element={<B2CInterviews />} />
                            <Route path="app/b2c/resume-library" element={<ResumeLibrary />} />
                            <Route path="app/b2c/resumes" element={<Navigate to="/app/b2c/resume-library" replace />} />
                            
                            {/* Legacy billing redirect */}
                            <Route path="app/billing" element={<Navigate to="/account?section=creditsPurchase" replace />} />
                            
                            {/* Account Settings */}
                            <Route path="account" element={<Account />} />
                            
                          {/* Legacy Interview Details - redirect to new canonical route */}
                          <Route path="interview/:id" element={<InterviewDetails />} />
                          
                          {/* Feedback page */}
                          <Route path="feedback" element={<Feedback />} />
                        </Route>

                        {/* ============================================ */}
                        {/* PUBLIC ROUTES - Use basic Layout (with Footer) */}
                        {/* ============================================ */}
                        <Route path="/" element={<Layout />}>
                          <Route index element={<Home />} />

                          {/* Legal pages (public, use Layout header/footer) */}
                          <Route path="privacy-policy" element={<PrivacyPolicy />} />
                          <Route path="terms-of-use" element={<TermsOfUse />} />
                          
                          {/* Access Denied page */}
                          <Route path="access-denied" element={<AccessDenied />} />
                          
                          {/* B2B: Recruiter Interview Platform (coming soon) */}
                          <Route 
                            path="app/b2b/*" 
                            element={<Navigate to="/under-construction?feature=recruiter" replace />}
                          />
                          
                          {/* HR: Employee Hub (coming soon) */}
                          <Route 
                            path="app/hr" 
                            element={<Navigate to="/under-construction?feature=hr" replace />}
                          />
                          
                          {/* Legacy Routes (redirect to new paths) */}
                          <Route path="interviews" element={<Navigate to="/app/b2c/interviews" replace />} />
                          <Route path="resumes" element={<Navigate to="/app/b2c/resume-library" replace />} />
                          <Route path="credits" element={<Navigate to="/app/b2c/billing" replace />} />
                          <Route 
                            path="dashboard" 
                            element={
                              <HandshakeFallback redirectTo="/app/b2c/dashboard">
                                <Navigate to="/app/b2c/dashboard" replace />
                              </HandshakeFallback>
                            } 
                          />
                          
                          {/* Repository/Insights redirects */}
                          <Route path="app/b2c/repository" element={<Navigate to="/app/b2c/interviews" replace />} />
                          <Route path="app/b2c/insights" element={<Navigate to="/app/b2c/dashboard" replace />} />
                          
                          {/* Interview flow - special handling (active interview uses minimal UI) */}
                          <Route path="interview-setup" element={
                            <ConsentGuard>
                              <B2CInterviewNew />
                            </ConsentGuard>
                          } />

                          {/* Password reset confirmation */}
                          <Route path="auth/password-confirm" element={<AuthPasswordConfirm />} />
                          
                          {/* About page for unauthenticated users */}
                          <Route path="about" element={<About />} />
                          
                        </Route>
                      </Routes>
                      </Suspense>
                    </Router>
                  </InterviewFlowProvider>
                </GoogleReCaptchaProvider>
              </LanguageProvider>
            </WorkspaceProvider>
          </UserProvider>
          </AuthProvider>
      </QueryProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;
