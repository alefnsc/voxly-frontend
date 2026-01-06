/**
 * Sign-In Page
 * 
 * Premium sign-in page using AuthShell layout and first-party authentication.
 * 
 * @module pages/SignIn
 */

'use client';

import React from 'react';
import { useUser } from 'contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthShell, FirstPartySignIn } from 'components/auth';
import { B2C_ROUTES } from 'routes/b2cRoutes';

const SignIn: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const authMessage = searchParams.get('authMessage');

  // Redirect if already signed in
  if (isLoaded && isSignedIn) {
    return <Navigate to={B2C_ROUTES.DASHBOARD} replace />;
  }

  return (
    <AuthShell>
      {authMessage ? (
        <div className="mb-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900">
          {authMessage}
        </div>
      ) : null}
      <FirstPartySignIn />
    </AuthShell>
  );
};

export default SignIn;
