import { useEffect } from 'react';

export const useStateValidation = (navigate, locationState) => {
    useEffect(() => {
        if (!locationState?.body?.metadata) {
            console.log("Missing metadata in state. Attempting recovery...");
            const tokenId = localStorage.getItem('interviewValidationToken');
            navigate('/', { state: { recoveryAttempt: true, tokenId } });
            return;
        }

        const { metadata } = locationState.body;

        if (
            !metadata ||
            !metadata.first_name?.trim() ||
            !metadata.job_title?.trim() ||
            !metadata.company_name?.trim() ||
            !metadata.job_description?.trim() ||
            !metadata.interviewee_cv?.trim()
        ) {
            console.log("Missing required metadata. Redirecting to home.");
            navigate('/');
        }
    }, [navigate, locationState]);
};