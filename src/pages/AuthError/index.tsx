/**
 * OAuth Error Redirect Page
 *
 * Receives backend redirects like `/auth/error?error=google_oauth_denied`.
 * Redirects to Sign In with a user-friendly message.
 */

import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { B2C_ROUTES } from 'routes/b2cRoutes';

function getMessageFromError(code: string | null): string {
  switch (code) {
    case 'google_oauth_denied':
      return 'Google sign-in was cancelled. Please try again.';
    case 'linkedin_oauth_denied':
      return 'LinkedIn sign-in was cancelled. Please try again.';
    case 'x_oauth_denied':
      return 'X sign-in was cancelled. Please try again.';
    case 'missing_code':
      return 'Sign-in did not complete. Please try again.';
    case 'invalid_state':
      return 'Sign-in session expired. Please try again.';
    default:
      return 'Sign-in did not complete. Please try again.';
  }
}

const AuthError: React.FC = () => {
  const [params] = useSearchParams();
  const error = params.get('error');
  const message = getMessageFromError(error);

  const query = new URLSearchParams({ authMessage: message }).toString();
  return <Navigate to={`${B2C_ROUTES.SIGN_IN}?${query}`} replace />;
};

export default AuthError;
