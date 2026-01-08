import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from 'contexts/AuthContext';
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
import { InterviewMediaCapture, RecordingMetadata } from 'components/interview-media-capture';
import { CameraPreview } from 'components/interview/CameraPreview';
import { CaptureStatus } from 'hooks/use-media-capture';
import { Briefcase, Building2, Globe2, Video, VideoOff } from 'lucide-react';

// ============================================
// RECORDING TOGGLE STORAGE
// ============================================
const RECORDING_PREF_KEY = 'Vocaid_recording_enabled';

function getRecordingPreference(): boolean {
    try {
        const stored = localStorage.getItem(RECORDING_PREF_KEY);
        return stored !== 'false'; // Default ON
    } catch {
        return true;
    }
}

function setRecordingPreference(enabled: boolean): void {
    try {
        localStorage.setItem(RECORDING_PREF_KEY, String(enabled));
    } catch {
        // Ignore storage errors
    }
}

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
    // Track if upload has been initiated
    const uploadStartedRef = useRef(false);

    // Recording state
    const [recordingEnabled, setRecordingEnabled] = useState(getRecordingPreference);
    const [recordingStatus, setRecordingStatus] = useState<CaptureStatus>('idle');
    const [pendingRecording, setPendingRecording] = useState<RecordingMetadata | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'failed'>('idle');
    // Shared media stream for camera preview (from recorder)
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

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
                const result = await apiService.validateUser();
                
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
    }, [isUserLoaded, user?.id, navigate, t]);

    // Use validation hooks
    useTokenValidation(navigate);
    useStateValidation(navigate, location.state);

    // State for modals
    const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
    const [micPermissionGranted, setMicPermissionGranted] = useState(false);

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

    // Derive call state
    const isCallActive = micPermissionGranted && !isConnecting && !isCalling;
    const isCallEnded = recordingStatus === 'finalized' || recordingStatus === 'stopping';

    // Handle recording toggle
    const toggleRecording = useCallback(() => {
        const newValue = !recordingEnabled;
        setRecordingEnabled(newValue);
        setRecordingPreference(newValue);
    }, [recordingEnabled]);

    // Handle recording finalized - queue upload
    const handleRecordingFinalized = useCallback((metadata: RecordingMetadata) => {
        console.log('🎬 Recording finalized:', {
            size: metadata.sizeBytes,
            duration: metadata.durationMs,
            mimeType: metadata.mimeType,
        });
        setPendingRecording(metadata);
    }, []);

    // Upload recording when finalized
    useEffect(() => {
        const uploadRecording = async () => {
            if (!pendingRecording || uploadStartedRef.current || !body?.metadata?.interview_id) {
                return;
            }

            uploadStartedRef.current = true;
            setUploadStatus('uploading');

            try {
                const result = await apiService.uploadInterviewRecording(
                    body.metadata.interview_id,
                    pendingRecording.blob,
                    pendingRecording.mimeType,
                    pendingRecording.durationMs,
                    (status) => {
                        console.log('📤 Upload status:', status);
                    }
                );

                if (result.success) {
                    console.log('✅ Recording uploaded:', result.mediaId);
                    setUploadStatus('done');
                } else {
                    console.error('❌ Recording upload failed:', result.error);
                    setUploadStatus('failed');
                }
            } catch (error) {
                console.error('❌ Recording upload error:', error);
                setUploadStatus('failed');
            }
        };

        uploadRecording();
    }, [pendingRecording, body?.metadata?.interview_id]);

    // Handle microphone permission
    const handleMicPermission = (granted: boolean) => {
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

    // Extract metadata for display
    const metadata = body?.metadata || {};
    const jobTitle = metadata.job_title || metadata.position || '-';
    const company = metadata.company || '-';
    const language = metadata.preferred_language || 'en';

    // Show loading screen during call initialization
    if (isCalling) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                    {/* Breadcrumbs */}
                    <div className="mb-4 sm:mb-6">
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

                    {/* Main content - 2 column layout on desktop */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left column: Live call */}
                        <div className="flex-1 lg:flex-[3]">
                            <InterviewContent
                                isConnecting={isConnecting}
                                isAgentTalking={isAgentTalking}
                                minutes={minutes}
                                seconds={seconds}
                                onQuitClick={toggleQuitModal}
                                audioSamples={audioSamples}
                            />
                        </div>

                        {/* Right column: Camera Preview + Recording + Metadata */}
                        <div className="lg:flex-[2] space-y-4">
                            {/* Camera Preview - shows shared stream from recorder */}
                            {micPermissionGranted && (
                                <CameraPreview
                                    stream={cameraStream}
                                    compact={true}
                                />
                            )}

                            {/* Recording Status Panel */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        {t('interview.recording.panel', 'Recording')}
                                    </h3>
                                    {/* Toggle only before call starts */}
                                    {!isCallActive && recordingStatus === 'idle' && (
                                        <button
                                            onClick={toggleRecording}
                                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
                                        >
                                            {recordingEnabled ? (
                                                <>
                                                    <Video className="w-4 h-4" />
                                                    <span>{t('interview.recording.enabled', 'Enabled')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <VideoOff className="w-4 h-4" />
                                                    <span>{t('interview.recording.disabled', 'Disabled')}</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <InterviewMediaCapture
                                    enabled={recordingEnabled && micPermissionGranted}
                                    videoEnabled={true}
                                    audioEnabled={false}
                                    onStatusChange={setRecordingStatus}
                                    onFinalized={handleRecordingFinalized}
                                    onStreamChange={setCameraStream}
                                    shouldStartRecording={isCallActive && recordingStatus === 'ready'}
                                    shouldStopRecording={isCallEnded}
                                    showPreview={false}
                                    compact={true}
                                />

                                {/* Upload status after recording */}
                                {uploadStatus !== 'idle' && (
                                    <div className="mt-3 text-sm">
                                        {uploadStatus === 'uploading' && (
                                            <span className="text-blue-600">
                                                {t('interview.recording.uploading', 'Uploading recording...')}
                                            </span>
                                        )}
                                        {uploadStatus === 'done' && (
                                            <span className="text-green-600">
                                                {t('interview.recording.uploaded', 'Recording saved')}
                                            </span>
                                        )}
                                        {uploadStatus === 'failed' && (
                                            <span className="text-red-600">
                                                {t('interview.recording.uploadFailed', 'Upload failed - will retry')}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Interview Metadata Panel */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    {t('interview.metadata.title', 'Interview Details')}
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Briefcase className="w-4 h-4 text-purple-500" />
                                        <span className="text-gray-600">{jobTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Building2 className="w-4 h-4 text-purple-500" />
                                        <span className="text-gray-600">{company}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Globe2 className="w-4 h-4 text-purple-500" />
                                        <span className="text-gray-600">{language.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Help text */}
                            <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
                                <p className="text-sm text-purple-700">
                                    {t('interview.help.tips', 'Speak clearly and take your time. The AI interviewer will wait for you to finish before responding.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Interview;