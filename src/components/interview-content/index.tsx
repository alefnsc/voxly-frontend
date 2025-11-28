import React from 'react';
import { Card } from 'components/ui/card';
import { X, Mic, Speech, Loader2 } from 'lucide-react';
import { Separator } from 'components/ui/separator';
import TypingTextEffect from 'components/typing-text-effect/TypingTextEffect';
import Clock from 'components/clock';
import AudioVisualizer from 'components/audio-visualizer';
import { useAudioProcessor } from 'hooks/use-audio-processor';

interface InterviewContentProps {
    isConnecting: boolean;
    isAgentTalking: boolean;
    minutes: number;
    seconds: number;
    onQuitClick: () => void;
    audioSamples?: Float32Array;
}

const InterviewContent: React.FC<InterviewContentProps> = ({ isConnecting, isAgentTalking, minutes, seconds, onQuitClick, audioSamples }) => {
    const { agentAudioData, userAudioData, processAgentAudio } = useAudioProcessor();

    // Process audio samples when they arrive
    React.useEffect(() => {
        if (audioSamples) {
            processAgentAudio(audioSamples);
        }
    }, [audioSamples, processAgentAudio]);

    // Determine the current interview state
    const getInterviewStatus = () => {
        if (isConnecting) {
            return {
                icon: <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-purple-600 animate-spin" />,
                text: "Connecting to Voxly..."
            };
        }
        if (isAgentTalking) {
            return {
                icon: <Speech className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-purple-600 animate-pulse" />,
                text: "Voxly is Speaking..."
            };
        }
        return {
            icon: <Mic className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-gray-700 animate-pulse" />,
            text: "Voxly is Listening..."
        };
    };

    const status = getInterviewStatus();

    return (
        <Card className="xl:w-[80%] lg:w-[90%] w-[95%] flex flex-col p-4 sm:p-6 md:p-8 relative items-center justify-center mb-12 max-w-7xl shadow-xl bg-white/95 backdrop-blur-sm border-2 border-gray-200">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                <button 
                    onClick={onQuitClick}
                    aria-label="Quit interview"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                    <X className="text-gray-400 hover:text-gray-600 w-6 h-6 sm:w-8 sm:h-8" />
                </button>
            </div>

            <h1 className='flex text-3xl sm:text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 my-6 sm:my-8 lg:my-12 animate-gradient'>Interview</h1>

            <div className="flex flex-col my-2 sm:my-4 items-center justify-center w-full px-2">
                <div className="flex flex-col items-center justify-center mb-8">
                    <AudioVisualizer
                        agentAudioData={agentAudioData}
                        userAudioData={userAudioData}
                        isAgentTalking={isAgentTalking}
                    />
                </div>

                <Separator className="mb-4" />

                <div className="flex flex-row items-center justify-center space-x-3 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    {status.icon}
                    <TypingTextEffect text={status.text} />
                </div>

                <Separator className="my-4" />

                <Clock timerMinutes={minutes} timerSeconds={seconds} />
            </div>
        </Card>
    );
};

export default InterviewContent;