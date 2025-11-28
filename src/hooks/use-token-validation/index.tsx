import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * Hook to validate interview session tokens
 * This ensures users can only access the interview page with a valid session
 */
export const useTokenValidation = (navigate: any) => {
    const { isSignedIn, isLoaded } = useAuth();

    useEffect(() => {
        // Wait for Clerk to load
        if (!isLoaded) {
            return;
        }

        console.log("Validating interview session");
        
        // First check if user is authenticated
        if (!isSignedIn) {
            console.log("User not authenticated. Redirecting to home.");
            navigate('/');
            return;
        }

        const tokenData = getTokenData();

        if (!tokenData) {
            console.log("No valid interview session found. Redirecting to home.");
            navigate('/');
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
                console.log("Interview session expired. Redirecting to home.");
                navigate('/');
                return false;
            }
            return true;
        } catch (e) {
            console.error("Error validating interview session:", e);
            navigate('/');
            return false;
        }
    };
};
