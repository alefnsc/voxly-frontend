import { useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import APIService from 'services/APIService';

export const useCallManager = (body, navigate) => {
    const { user } = useUser();
    const [callId, setCallId] = useState('');
    const [isCalling, setIsCalling] = useState(false);
    const [isAgentTalking, setIsAgentTalking] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true); // Track initial connection - agent hasn't spoken yet
    const [audioSamples, setAudioSamples] = useState(null);
    const callIdRef = useRef(''); // Store call_id in ref for immediate access
    const incompatibilityDetectedRef = useRef(false); // Track if interview ended due to incompatibility

    const startCall = useCallback(async (eventHandlers) => {
        setIsCalling(true);

        try {
            // Initialize event handlers first
            if (eventHandlers) {
                APIService.initialize(eventHandlers);
            }

            const registerCallResponse = await APIService.registerCall(body);

            if ((registerCallResponse.status === "created" || registerCallResponse.status === "success") && registerCallResponse.call_id) {
                // Store in both state and ref
                setCallId(registerCallResponse.call_id);
                callIdRef.current = registerCallResponse.call_id;

                // Consume credit when call is registered successfully
                if (user?.id) {
                    try {
                        await APIService.consumeCredit(user.id, registerCallResponse.call_id);
                        console.log('✅ Credit consumed for interview');
                    } catch (creditError) {
                        console.error('❌ Failed to consume credit:', creditError);
                        // Continue with interview even if credit consumption fails
                    }
                }

                // Use access_token directly from register response
                if (registerCallResponse.access_token) {
                    console.log('🔑 Starting call with access token');
                    console.log('   • Call ID:', registerCallResponse.call_id);
                    console.log('   • Backend URL:', process.env.REACT_APP_BACKEND_URL);
                    
                    await APIService.startCall(registerCallResponse.access_token, true);
                    setIsCalling(false);
                    
                    console.log('✅ Call initialization complete');
                } else {
                    throw new Error('No access token received');
                }
            } else {
                throw new Error('Failed to register call');
            }
        } catch (error) {
            console.error("Error starting call:", error);
            alert('Failed to start interview. Please try again.');
            navigate('/');
        }
    }, [body, navigate, user]);

    const stopCall = useCallback(() => {
        APIService.stopCall();
    }, []);

    const handleCallEnded = useCallback(async () => {
        setIsCalling(true);
        await new Promise(resolve => setTimeout(resolve, 4000));
        setIsCalling(false);

        // Check if interview ended due to incompatibility
        if (incompatibilityDetectedRef.current) {
            console.log('🚫 Interview ended due to incompatibility - restoring credit and redirecting to home');
            
            // Restore credit
            if (user?.id) {
                try {
                    await APIService.restoreCredit(user.id, 'incompatibility', callIdRef.current);
                    console.log('✅ Credit restored successfully');
                } catch (error) {
                    console.error('❌ Failed to restore credit:', error);
                }
            }

            // Redirect to home with message
            navigate('/', { 
                state: { 
                    message: 'Your resume and the job position were not compatible. Your interview credit has been restored.',
                    type: 'incompatibility'
                } 
            });
            return;
        }

        // Normal flow - go to feedback
        const feedbackState = {
            call_id: callIdRef.current, // Use ref for immediate access
            metadata: body?.metadata
        };

        console.log('Navigating to feedback with call_id:', callIdRef.current);
        navigate('/feedback', { state: feedbackState });
    }, [body, navigate, user]);

    // Track audio sample count for logging throttling
    const audioSampleCountRef = useRef(0);
    const lastAudioLogTimeRef = useRef(0);

    const getCallHandlers = useCallback((startTimer) => {
        return {
            call_started: () => {
                console.log('═══════════════════════════════════════════════════');
                console.log('🟢 CALL STARTED - Session active');
                console.log('   • Call ID:', callIdRef.current);
                console.log('   • Timestamp:', new Date().toISOString());
                console.log('   • Starting timer...');
                console.log('   ⏳ Waiting for agent to speak...');
                console.log('   💡 If no "AGENT STARTED TALKING" appears, check:');
                console.log('      1. Retell agent has a VOICE configured');
                console.log('      2. Custom LLM is sending responses');
                console.log('═══════════════════════════════════════════════════');
                startTimer();
            },
            call_ended: () => {
                console.warn('═══════════════════════════════════════════════════');
                console.warn('🔴 CALL ENDED - Triggered');
                console.warn('   • Call ID:', callIdRef.current);
                console.warn('   • Duration: Check if call lasted < 5 seconds (premature)');
                console.warn('   • Timestamp:', new Date().toISOString());
                console.warn('   • Incompatibility detected:', incompatibilityDetectedRef.current);
                console.warn('═══════════════════════════════════════════════════');
                handleCallEnded();
            },
            agent_start_talking: () => {
                console.log('═══════════════════════════════════════════════════');
                console.log('🗣️ AGENT STARTED TALKING');
                console.log('   🔊 Audio should be playing now!');
                console.log('   💡 If you cannot hear audio:');
                console.log('      1. Check browser tab is not muted');
                console.log('      2. Check system volume');
                console.log('      3. Try clicking anywhere on the page first');
                console.log('═══════════════════════════════════════════════════');
                setIsConnecting(false); // Agent has spoken, no longer connecting
                setIsAgentTalking(true);
            },
            agent_stop_talking: () => {
                console.log('🤐 AGENT STOPPED TALKING');
                setIsAgentTalking(false);
            },
            update: (update) => {
                // Only log updates occasionally to reduce noise
                if (update.transcript && update.transcript.length > 0) {
                    const lastEntry = update.transcript[update.transcript.length - 1];
                    console.log('📊 Transcript update:', lastEntry.role, '-', lastEntry.content.substring(0, 50) + '...');
                }
                
                // Check for incompatibility in transcript
                checkForIncompatibility(update);
                checkForCallEnd(update);
            },
            metadata: (metadata) => {
                console.log('📋 Metadata received:', metadata);
            },
            audio: (data) => {
                if (data && data.length > 0) {
                    // Throttle audio logging to once per second
                    audioSampleCountRef.current++;
                    const now = Date.now();
                    if (now - lastAudioLogTimeRef.current > 1000) {
                        console.log(`🔊 Audio samples: ${audioSampleCountRef.current}/sec | Sample size: ${data.length} | First value: ${data[0]?.toFixed(4)}`);
                        audioSampleCountRef.current = 0;
                        lastAudioLogTimeRef.current = now;
                    }
                    setAudioSamples(data);
                } else if (audioSampleCountRef.current === 0) {
                    // Log first time we get empty/no audio
                    console.warn('⚠️ Audio callback received but no data');
                }
            },
            error: (error) => {
                console.error('═══════════════════════════════════════════════════');
                console.error('❌ CALL ERROR:', error);
                console.error('   • Error type:', error?.type || 'unknown');
                console.error('   • Error message:', error?.message || JSON.stringify(error));
                console.error('');
                console.error('🔧 TROUBLESHOOTING CHECKLIST:');
                console.error('   1. Is ngrok running? Run: ngrok http 3001');
                console.error('   2. Is backend running? Check: curl http://localhost:3001/health');
                console.error('   3. Retell agent Custom LLM URL: wss://caaa362a8359.ngrok-free.app/llm-websocket/{call_id}');
                console.error('   4. Does agent have a VOICE configured in Retell dashboard?');
                console.error('═══════════════════════════════════════════════════');
                alert('An error occurred during the interview. Check console for details.');
                handleCallEnded();
            }
        };
    }, [handleCallEnded]);

    // Check if the agent mentioned incompatibility (credit restoration)
    const checkForIncompatibility = (event) => {
        // Standardized phrase from backend - check for key part of the message
        const incompatibilityPhrases = [
            'your interview credit will be restored automatically',
            'your interview credit will be restored',
            'credit will be restored'
        ];

        const hasIncompatibilityMessage = event.transcript?.some((item) =>
            item.role === 'agent' &&
            incompatibilityPhrases.some(phrase => 
                item.content.toLowerCase().includes(phrase.toLowerCase())
            )
        );

        if (hasIncompatibilityMessage && !incompatibilityDetectedRef.current) {
            console.log('🚫 INCOMPATIBILITY DETECTED - Credit restoration phrase found in agent message');
            incompatibilityDetectedRef.current = true;
        }
    };

    const checkForCallEnd = async (event) => {
        const endCallPhrases = [
            'end call',
            'finish the call',
            'i give up of this interview',
            'terminate this conversation',
            "let's stop here",
            "it's over",
            "i'm done here",
            "we're done"
        ];

        const shouldEndCall = event.transcript.some((item) =>
            item.role === 'user' &&
            endCallPhrases.some(phrase => item.content.toLowerCase().includes(phrase.toLowerCase()))
        );

        if (shouldEndCall) {
            console.log('Match found, stopping the call...');
            await stopCall();
        }
    };

    return {
        callId,
        isCalling,
        isConnecting,
        isAgentTalking,
        audioSamples,
        startCall,
        stopCall,
        getCallHandlers
    };
};