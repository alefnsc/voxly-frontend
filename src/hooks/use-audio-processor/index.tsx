import { useState, useEffect, useCallback, useRef } from 'react';

export const useAudioProcessor = () => {
    const [agentAudioData, setAgentAudioData] = useState<Float32Array | undefined>(undefined);
    const [userAudioData, setUserAudioData] = useState<Float32Array | undefined>(undefined);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);

    // Initialize microphone capture and analysis
    useEffect(() => {
        async function setupMicrophoneAnalysis() {
            try {
                // Request microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                micStreamRef.current = stream;

                // Create audio context and analyzer
                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;

                const analyser = audioContext.createAnalyser();
                analyserRef.current = analyser;
                analyser.fftSize = 256;

                // Connect microphone to analyzer
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                // Start analyzing user audio
                const dataArray = new Float32Array(analyser.frequencyBinCount);

                const analyzeAudio = () => {
                    if (analyserRef.current) {
                        analyserRef.current.getFloatTimeDomainData(dataArray);
                        setUserAudioData(new Float32Array(dataArray));
                    }
                    requestAnimationFrame(analyzeAudio);
                };

                analyzeAudio();
            } catch (error) {
                console.error("Error accessing microphone:", error);
            }
        }

        setupMicrophoneAnalysis();

        // Cleanup function
        return () => {
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Process agent raw audio samples
    const processAgentAudio = useCallback((rawAudio: Float32Array) => {
        setAgentAudioData(new Float32Array(rawAudio));
    }, []);

    return {
        agentAudioData,
        userAudioData,
        processAgentAudio
    };
};