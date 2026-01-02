import { useEffect } from 'react';

export const useStateValidation = (navigate, locationState) => {
    useEffect(() => {
        if (!locationState?.body?.metadata) {
            console.log("Missing metadata in state. Attempting recovery...");
            const tokenId = localStorage.getItem('interviewValidationToken');
            navigate('/app/b2c/dashboard', { state: { recoveryAttempt: true, tokenId } });
            return;
        }

        const { metadata } = locationState.body;

        // Validate required metadata fields
        // Note: interview_id is required - resume is fetched server-side from Azure Blob
        if (
            !metadata ||
            !metadata.first_name?.trim() ||
            !metadata.job_title?.trim() ||
            !metadata.company_name?.trim() ||
            !metadata.job_description?.trim() ||
            !metadata.interview_id?.trim()
        ) {
            console.log("Missing required metadata. Redirecting to dashboard.", {
                hasFirstName: !!metadata?.first_name?.trim(),
                hasJobTitle: !!metadata?.job_title?.trim(),
                hasCompanyName: !!metadata?.company_name?.trim(),
                hasJobDescription: !!metadata?.job_description?.trim(),
                hasInterviewId: !!metadata?.interview_id?.trim()
            });
            navigate('/app/b2c/dashboard');
        }
    }, [navigate, locationState]);
};