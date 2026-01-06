import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from 'contexts/AuthContext';
import { useAuthCheck } from 'hooks/use-auth-check';
import Loading from "components/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedInterviewRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const { userCredits, isLoading } = useAuthCheck();
  const [validationChecked, setValidationChecked] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (isLoaded && !isLoading) {
      // Get validation data
      const validationToken = localStorage.getItem('interviewValidationToken');
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      const hasValidToken = Boolean(validationToken &&
        tokenExpiration &&
        parseInt(tokenExpiration) > Date.now());

      // Check if we have the state data with required metadata
      // Note: interview_id is required - resume is fetched server-side from Azure Blob
      const metadata = location.state?.body?.metadata;
      const hasValidStateData = Boolean(
        location.state?.body &&
        metadata?.first_name?.trim() &&
        metadata?.job_title?.trim() &&
        metadata?.company_name?.trim() &&
        metadata?.job_description?.trim() &&
        metadata?.interview_id?.trim()
      );

      // Token match check (only if both exist)
      const interviewId = metadata?.interview_id;
      const tokensMatch = Boolean(validationToken &&
        interviewId &&
        validationToken === interviewId);

      // Credit check
      const hasEnoughCredits = Boolean(typeof userCredits === 'number' && userCredits > 0);

      // Debug logs
      console.log("Protected route validation:", {
        isSignedIn,
        hasValidStateData,
        hasValidToken,
        tokensMatch,
        hasEnoughCredits,
        validationToken,
        interviewId,
        tokenExpiration: tokenExpiration ? new Date(parseInt(tokenExpiration)).toISOString() : null,
        currentTime: new Date().toISOString(),
        metadata: metadata ? 'exists' : 'missing',
      });

      // Determine overall validation result
      const result = Boolean(
        isSignedIn &&
        hasValidStateData &&
        hasValidToken &&
        tokensMatch &&
        hasEnoughCredits
      );

      setIsValid(result);
      setValidationChecked(true);
    }
  }, [isLoaded, isLoading, location.state, userCredits, isSignedIn]);

  if (!isLoaded || isLoading || !validationChecked) {
    return <Loading />;
  }

  if (!isValid) {
    console.log("Protected route validation failed. Redirecting to home.");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};