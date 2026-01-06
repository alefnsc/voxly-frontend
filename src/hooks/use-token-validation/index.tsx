import { useEffect } from 'react';
import { useAuth } from 'contexts/AuthContext';

/**
 * Hook to validate interview session tokens
 * This ensures users can only access the interview page with a valid session
 * 
 * Note: With first-party session-based auth, JWT token validation is no longer
 * needed as sessions are managed server-side with httpOnly cookies.
 */
export const useTokenValidation = (navigate: any) => {
    const { isSignedIn, isLoaded } = useAuth();

    useEffect(() => {
        // Wait for auth to load
        if (!isLoaded) {
            return;
        }

        console.log("Validating interview session");
        
        // First check if user is authenticated
        if (!isSignedIn) {
            console.log("User not authenticated. Redirecting to landing.");
            navigate('/');
            return;
        }

        const tokenData = getTokenData();

        if (!tokenData) {
            console.log("No valid interview session found. Redirecting to dashboard.");
            navigate('/app/b2c/dashboard');
            return;
        }

        if (!validateTokenExpiration(tokenData)) {
            return;
        }

        // Clean up on unmount
        return () => {
            localStorage.removeItem('interviewValidationToken');
            localStorage.removeItem('tokenExpiration');
            sessionStorage.removeItem('interviewValidationToken');
            sessionStorage.removeItem('tokenExpiration');
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, isSignedIn, isLoaded]);

    const getTokenData = () => {
        const localToken = localStorage.getItem('interviewValidationToken');
        const localExpiration = localStorage.getItem('tokenExpiration');
        const sessionToken = sessionStorage.getItem('interviewValidationToken');
        const sessionExpiration = sessionStorage.getItem('tokenExpiration');

        if (localToken && localExpiration) {
            return { token: localToken, expiration: localExpiration };
        }

        if (sessionToken && sessionExpiration) {
            localStorage.setItem('interviewValidationToken', sessionToken);
            localStorage.setItem('tokenExpiration', sessionExpiration);
            return { token: sessionToken, expiration: sessionExpiration };
        }

        return null;
    };

    const validateTokenExpiration = (tokenData: { token: string; expiration: string }) => {
        try {
            const expTime = parseInt(tokenData.expiration);
            const currentTime = Date.now();

            if (isNaN(expTime) || expTime < currentTime) {
                console.log("Interview session expired. Redirecting to dashboard.");
                navigate('/app/b2c/dashboard');
                return false;
            }
            return true;
        } catch (e) {
            console.error("Error validating interview session:", e);
            navigate('/app/b2c/dashboard');
            return false;
        }
    };
};
