import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import Layout from './components/layout';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Interviews from './pages/Interviews';
import Feedback from './pages/Feedback';
import PaymentResult from './pages/PaymentResult';
import ContactThankYou from './pages/ContactThankYou';
import Dashboard from './pages/Dashboard';
import InterviewDetails from './pages/InterviewDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Credits from './pages/Credits';
import InterviewSetup from './pages/InterviewSetup';
import ResumeLibrary from './pages/ResumeLibrary';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import SignInClerk from './pages/SignInClerk';
import SSOCallback from './pages/SSOCallback';
import Account from './pages/Account';
import UnderConstruction from './pages/UnderConstruction';
import { ProtectedInterviewRoute } from './components/protected-interview-route';
import { HandshakeFallback } from './components/auth/HandshakeFallback';
import ErrorBoundary from './components/error-boundary';
import { InterviewFlowProvider } from './hooks/use-interview-flow';
import { UserProvider } from './contexts/UserContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { LanguageProvider } from './hooks/use-language';
import { FEATURES } from './config/features';

// New 3-in-1 Platform Pages
import B2CDashboard from './pages/app/b2c/dashboard';
import B2CInterviewNew from './pages/app/b2c/interview/new';
import BillingPage from './pages/app/billing';

const CLERK_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '';
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

// Validate required environment variables in development (only log errors)
if (process.env.NODE_ENV === 'development' && !CLERK_PUBLISHABLE_KEY) {
  console.error('❌ Missing REACT_APP_CLERK_PUBLISHABLE_KEY in .env file');
  console.error('📝 Create a .env file in the project root with:');
  console.error('   REACT_APP_CLERK_PUBLISHABLE_KEY=your_key_here');
  console.error('🔗 Get your key at: https://dashboard.clerk.com/last-active?path=api-keys');
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <UserProvider>
          <WorkspaceProvider>
            <LanguageProvider>
              <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
                <InterviewFlowProvider>
                  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                      {/* Auth routes (outside main layout) */}
                      <Route path="sign-up" element={<SignUp />} />
                      <Route path="sign-in" element={<SignIn />} />
                      <Route path="sign-in-clerk/*" element={<SignInClerk />} />
                      <Route path="sso-callback" element={<SSOCallback />} />
                      <Route path="under-construction" element={<UnderConstruction />} />
                      
                      <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        
                        {/* ============================================ */}
                        {/* B2C: Interview Practice & Performance */}
                        {/* ============================================ */}
                        <Route path="app/b2c/dashboard" element={<B2CDashboard />} />
                        <Route path="app/b2c/interview/new" element={<B2CInterviewNew />} />
                        <Route path="app/b2c/interviews" element={<Interviews />} />
                        <Route path="app/b2c/resumes" element={<ResumeLibrary />} />
                        <Route path="app/b2c/insights" element={<Dashboard />} />
                        
                        {/* ============================================ */}
                        {/* B2B: Recruiter Interview Platform */}
                        {/* Redirects to UnderConstruction when disabled */}
                        {/* ============================================ */}
                        <Route 
                          path="app/b2b/*" 
                          element={
                            FEATURES.B2B_RECRUITER_PLATFORM_ENABLED 
                              ? <Dashboard /> 
                              : <Navigate to="/under-construction?feature=recruiter" replace />
                          } 
                        />
                        
                        {/* ============================================ */}
                        {/* HR: Employee Hub */}
                        {/* Redirects to UnderConstruction when disabled */}
                        {/* ============================================ */}
                        <Route 
                          path="app/hr" 
                          element={
                            FEATURES.B2B_EMPLOYEE_HUB_ENABLED 
                              ? <Dashboard /> 
                              : <Navigate to="/under-construction?feature=hr" replace />
                          } 
                        />
                        
                        {/* ============================================ */}
                        {/* Billing (shared across all contexts) */}
                        {/* ============================================ */}
                        <Route path="app/billing" element={<BillingPage />} />
                        
                        {/* ============================================ */}
                        {/* Legacy Routes (redirect to new paths) */}
                        {/* ============================================ */}
                        <Route path="interviews" element={<Navigate to="/app/b2c/interviews" replace />} />
                        <Route path="resumes" element={<Navigate to="/app/b2c/resumes" replace />} />
                        <Route path="credits" element={<Navigate to="/app/billing" replace />} />
                        <Route 
                          path="dashboard" 
                          element={
                            <HandshakeFallback redirectTo="/app/b2c/dashboard">
                              <Navigate to="/app/b2c/dashboard" replace />
                            </HandshakeFallback>
                          } 
                        />
                        
                        {/* Interview flow (still at root for now) */}
                        <Route path="interview-setup" element={<InterviewSetup />} />
                        <Route path="interview" element={
                          <ProtectedInterviewRoute>
                            <Interview />
                          </ProtectedInterviewRoute>
                        } />
                        <Route path="feedback" element={<Feedback />} />
                        <Route path="interview/:id" element={<InterviewDetails />} />
                        
                        {/* Account Settings */}
                        <Route path="account" element={<Account />} />
                        
                        {/* Static Pages */}
                        <Route path="about" element={<About />} />
                        <Route path="contact" element={<Contact />} />
                        <Route path="privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="terms-of-use" element={<TermsOfUse />} />
                        
                        {/* Payment result routes */}
                        <Route path="payment/success" element={<PaymentResult />} />
                        <Route path="payment/failure" element={<PaymentResult />} />
                        <Route path="payment/pending" element={<PaymentResult />} />
                        
                        {/* Contact thank you page */}
                        <Route path="contact/thank-you" element={<ContactThankYou />} />
                      </Route>
                    </Routes>
                  </Router>
                </InterviewFlowProvider>
              </GoogleReCaptchaProvider>
            </LanguageProvider>
          </WorkspaceProvider>
        </UserProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;