import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Feedback from './pages/Feedback';
import PaymentResult from './pages/PaymentResult';
import ContactThankYou from './pages/ContactThankYou';
import { ProtectedInterviewRoute } from './components/protected-interview-route';
import ErrorBoundary from './components/error-boundary';

const CLERK_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '';

// Validate required environment variables in development
if (process.env.NODE_ENV === 'development') {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.error('❌ Missing REACT_APP_CLERK_PUBLISHABLE_KEY in .env file');
    console.error('📝 Create a .env file in the project root with:');
    console.error('   REACT_APP_CLERK_PUBLISHABLE_KEY=your_key_here');
    console.error('🔗 Get your key at: https://dashboard.clerk.com/last-active?path=api-keys');
  }
  
  console.log('🔧 Environment Configuration:');
  console.log('   - Clerk Key:', CLERK_PUBLISHABLE_KEY ? '✅ Configured' : '❌ Missing');
  console.log('   - MercadoPago Key:', process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY ? '✅ Configured' : '⚠️ Not configured');
  console.log('   - Architecture: Serverless (No backend required)');
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <Router>
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
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;