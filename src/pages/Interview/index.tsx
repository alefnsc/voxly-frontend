import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { DefaultLayout } from 'components/default-layout';
import Loading from 'components/loading';
import apiService from 'services/APIService';

// Custom hooks
import { useTokenValidation } from 'hooks/use-token-validation';
import { useStateValidation } from 'hooks/use-state-validation';
import { useCallManager } from 'hooks/use-call-manager';
import { useInterviewTimer } from 'hooks/use-interview-timer';
import { useInterviewFlow } from 'hooks/use-interview-flow';

// Components
import MicPermissionModal from 'components/mic-permission-modal';
import QuitInterviewModal from 'components/quit-interview-modal';
import InterviewContent from 'components/interview-content';
import InterviewBreadcrumbs from 'components/interview-breadcrumbs';

const Interview = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { body } = location.state || {};
    const { user, isLoaded: isUserLoaded } = useUser();
    const { setStage } = useInterviewFlow();
    
    // Track if call has been started to prevent double initialization
    const callStartedRef = useRef(false);
    // Track if user validation has been attempted
    const validationAttemptedRef = useRef(false);

    // Set stage to interview on mount
    useEffect(() => {
        setStage('interview');
    }, [setStage]);

    // Validate user session on interview page load
    useEffect(() => {
        const validateUserSession = async () => {
            if (!isUserLoaded || !user?.id || validationAttemptedRef.current) {
                return;
            }
            
            validationAttemptedRef.current = true;
            
            try {
                console.log('🔐 Validating user session for interview...');
                const result = await apiService.validateUser(user.id);
                
                if (result.status === 'success' && result.user) {
                    console.log('✅ User validated for interview:', {
                        userId: result.user.id,
                        credits: result.user.credits
                    });
                    
                    // Check if user has credits
                    if (result.user.credits <= 0) {
                        console.warn('⚠️ User has no credits');
                        navigate('/app/b2c/dashboard', { state: { error: t('interview.errors.noCreditsError') } });
                    }
                } else {
                    throw new Error('Validation returned unsuccessful status');
                }
            } catch (error: any) {
                console.error('❌ User validation failed:', error);
                navigate('/app/b2c/dashboard', { state: { error: t('interview.errors.sessionValidationFailed') } });
            }
        };

        validateUserSession();
    }, [isUserLoaded, user?.id, navigate]);

    // Use validation hooks
    useTokenValidation(navigate);
    useStateValidation(navigate, location.state);

    // State for modals
    const [isQuitModalOpen, setIsQuitModalOpen] = React.useState(false);
    const [micPermissionGranted, setMicPermissionGranted] = React.useState(false);

    // Use call manager hook
    const {
        isCalling,
        isConnecting,
        isAgentTalking,
        audioSamples,
        startCall,
        stopCall,
        getCallHandlers
    } = useCallManager(body, navigate);

    // Use timer hook
    const { minutes, seconds, startTimer } = useInterviewTimer(15, stopCall);

    // Handle microphone permission
    const handleMicPermission = (granted) => {
        setMicPermissionGranted(granted);
        if (!granted) {
            navigate('/app/b2c/dashboard');
        }
    };

    // Initialize call after mic permission granted
    useEffect(() => {
        if (micPermissionGranted && body?.metadata && !callStartedRef.current) {
            callStartedRef.current = true;
            const handlers = getCallHandlers(startTimer);
            startCall(handlers);
        }
    }, [micPermissionGranted, body, startCall, getCallHandlers, startTimer]);

    // Handle modal toggle
    const toggleQuitModal = () => {
        setIsQuitModalOpen(!isQuitModalOpen);
    };

    // Show loading screen during call initialization
    if (isCalling) {
        return <Loading />;
    }

    return (
        <DefaultLayout className="flex flex-col overflow-hidden items-center bg-white min-h-screen">
            {/* Breadcrumbs - hidden during interview but present for flow tracking */}
            <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-4">
                <InterviewBreadcrumbs 
                    currentStage="interview" 
                    showBackArrow={false}
                />
            </div>

            {/* Microphone permission modal */}
            <MicPermissionModal
                onPermissionGranted={handleMicPermission}
            />

            {/* Quit confirmation modal */}
            <QuitInterviewModal
                isOpen={isQuitModalOpen}
                onClose={toggleQuitModal}
                onQuit={stopCall}
            />

            {/* Main interview content */}
            <InterviewContent
                isConnecting={isConnecting}
                isAgentTalking={isAgentTalking}
                minutes={minutes}
                seconds={seconds}
                onQuitClick={toggleQuitModal}
                audioSamples={audioSamples}
            />
        </DefaultLayout>
    );
};

export default Interview;