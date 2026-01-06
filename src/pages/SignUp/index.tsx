/**
 * Sign-Up Page
 * 
 * Premium sign-up page using AuthShell layout and first-party authentication.
 * 
 * @module pages/SignUp
 */

'use client';

import React from 'react';
import { useUser } from 'contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AuthShell, FirstPartySignUp } from 'components/auth';
import { B2C_ROUTES } from 'routes/b2cRoutes';

const SignUp: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();

  // Redirect if already signed in
  if (isLoaded && isSignedIn) {
    return <Navigate to={B2C_ROUTES.DASHBOARD} replace />;
  }

  return (
    <AuthShell>
      <FirstPartySignUp showFeaturePills />
    </AuthShell>
  );
};

export default SignUp;
