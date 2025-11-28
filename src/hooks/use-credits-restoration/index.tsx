import { useAuthCheck } from 'hooks/use-auth-check';

const useCreditsRestoration = () => {
    const { updateCredits } = useAuthCheck();

    // Function to restore credits when microphone issues occur
    const restoreCredits = async (interviewId: string) => {
        try {
            // Verify this is for the current interview
            const storedInterviewId = localStorage.getItem('currentInterviewId');

            if (storedInterviewId === interviewId) {
                // Use the updateCredits method from useAuthCheck to restore 1 credit
                await updateCredits('restore');

                // Clear the stored interview ID after restoring
                localStorage.removeItem('currentInterviewId');

                return { success: true, message: 'Credit has been restored successfully' };
            } else {
                return { success: false, message: 'Invalid interview session' };
            }
        } catch (error) {
            console.error('Failed to restore credits:', error);
            return { success: false, message: 'Failed to restore credits' };
        }
    };

    return { restoreCredits };
};

export default useCreditsRestoration;