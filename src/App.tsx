import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import Layout from './components/layout';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Feedback from './pages/Feedback';
import PaymentResult from './pages/PaymentResult';
import ContactThankYou from './pages/ContactThankYou';
import { ProtectedInterviewRoute } from './components/protected-interview-route';
import ErrorBoundary from './components/error-boundary';

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
        <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="interview" element={
                <ProtectedInterviewRoute>
                  <Interview />
                </ProtectedInterviewRoute>
              } />
              <Route path="feedback" element={<Feedback />} />
              {/* Payment result routes */}
              <Route path="payment/success" element={<PaymentResult />} />
              <Route path="payment/failure" element={<PaymentResult />} />
              <Route path="payment/pending" element={<PaymentResult />} />
              {/* Contact thank you page */}
              <Route path="contact/thank-you" element={<ContactThankYou />} />
            </Route>
          </Routes>
        </Router>
        </GoogleReCaptchaProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;