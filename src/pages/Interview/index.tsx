import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DefaultLayout } from 'components/default-layout';
import Loading from 'components/loading';

// Custom hooks
import { useTokenValidation } from 'hooks/use-token-validation';
import { useStateValidation } from 'hooks/use-state-validation';
import { useCallManager } from 'hooks/use-call-manager';
import { useInterviewTimer } from 'hooks/use-interview-timer';

// Components
import MicPermissionModal from 'components/mic-permission-modal';
import QuitInterviewModal from 'components/quit-interview-modal';
import InterviewContent from 'components/interview-content';

const Interview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { body } = location.state || {};
    
    // Track if call has been started to prevent double initialization
    const callStartedRef = useRef(false);

    // Use validation hooks
    useTokenValidation(navigate);
    useStateValidation(navigate, location.state);

    // State for modals
    const [isQuitModalOpen, setIsQuitModalOpen] = React.useState(false);
    const [micPermissionGranted, setMicPermissionGranted] = React.useState(false);

    // Use call manager hook
    const {
        callId,
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
            navigate('/');
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
        <DefaultLayout className="flex flex-col overflow-hidden items-center bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
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