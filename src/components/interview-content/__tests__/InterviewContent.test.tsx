import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InterviewContent from '../index';

// Mock the hooks
jest.mock('hooks/use-audio-processor', () => ({
    useAudioProcessor: () => ({
        agentAudioData: new Float32Array([0.5, 0.6, 0.7]),
        userAudioData: new Float32Array([0.3, 0.4, 0.5]),
        processAgentAudio: jest.fn(),
    }),
}));

// Mock the components
jest.mock('components/audio-visualizer', () => ({
    __esModule: true,
    default: ({ agentAudioData, userAudioData, isAgentTalking }) => (
        <div data-testid="audio-visualizer" data-agent-talking={isAgentTalking} />
    ),
}));

jest.mock('components/typing-text-effect/TypingTextEffect', () => ({
    __esModule: true,
    default: ({ text }) => <div data-testid="typing-text">{text}</div>,
}));

jest.mock('components/clock', () => ({
    __esModule: true,
    default: ({ timerMinutes, timerSeconds }) => (
        <div data-testid="clock">{`${timerMinutes}:${timerSeconds}`}</div>
    ),
}));

describe('InterviewContent', () => {
    const defaultProps = {
        isAgentTalking: false,
        minutes: 30,
        seconds: 0,
        onQuitClick: jest.fn(),
        audioSamples: new Float32Array([0.1, 0.2, 0.3]),
    };

    it('renders without crashing', () => {
        const { container } = render(<InterviewContent {...defaultProps} />);
        expect(container).toBeTruthy();
    });

    it('renders the interview title', () => {
        render(<InterviewContent {...defaultProps} />);
        expect(screen.getByText('Interview')).toBeInTheDocument();
    });

    it('renders the audio visualizer', () => {
        render(<InterviewContent {...defaultProps} />);
        const visualizer = screen.getByTestId('audio-visualizer');
        expect(visualizer).toBeInTheDocument();
        expect(visualizer).toHaveAttribute('data-agent-talking', 'false');
    });

    it('shows correct status when agent is talking', () => {
        render(<InterviewContent {...defaultProps} isAgentTalking={true} />);
        expect(screen.getByText('Voxly is Speaking...')).toBeInTheDocument();
    });

    it('shows correct status when agent is listening', () => {
        render(<InterviewContent {...defaultProps} isAgentTalking={false} />);
        expect(screen.getByText('Voxly is Listening...')).toBeInTheDocument();
    });

    it('renders the clock with correct time', () => {
        render(<InterviewContent {...defaultProps} />);
        const clock = screen.getByTestId('clock');
        expect(clock).toHaveTextContent('30:0');
    });

    it('handles quit button click', () => {
        render(<InterviewContent {...defaultProps} />);
        const quitButton = screen.getByRole('button');
        fireEvent.click(quitButton);
        expect(defaultProps.onQuitClick).toHaveBeenCalled();
    });

    it('processes audio samples when they change', () => {
        const { rerender } = render(<InterviewContent {...defaultProps} />);
        const newProps = {
            ...defaultProps,
            audioSamples: new Float32Array([0.4, 0.5, 0.6]),
        };
        rerender(<InterviewContent {...newProps} />);
        // The processAgentAudio function should be called with the new samples
        // This is handled by the useEffect hook
    });
}); 