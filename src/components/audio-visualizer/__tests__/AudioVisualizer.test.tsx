/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React, { forwardRef } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioVisualizer from '../index';

const MockMesh = forwardRef((props: any, ref) => (
    <div ref={ref} data-testid="mesh" {...props} />
));

const MockMeshStandardMaterial = (props: any) => (
    <div data-testid="meshStandardMaterial" {...props} />
);

const MockCircleGeometry = (props: any) => (
    <div data-testid="circleGeometry" {...props} />
);

jest.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="canvas">{children}</div>
    ),
    useFrame: jest.fn(),
    Mesh: ({ children, ...props }: { children: React.ReactNode } & any) => (
        <div data-testid="mesh" {...props}>{children}</div>
    ),
    meshStandardMaterial: (props: any) => (
        <div data-testid="meshStandardMaterial" {...props} />
    ),
}));

jest.mock('@react-three/drei', () => ({
    CircleGeometry: (props: any) => (
        <div data-testid="circleGeometry" {...props} />
    ),
}));

jest.mock('three', () => ({
    Mesh: jest.fn(),
    AmbientLight: jest.fn(),
    PointLight: jest.fn(),
    MeshStandardMaterial: jest.fn(),
    CircleGeometry: jest.fn(),
    Color: jest.fn(),
    Vector3: jest.fn(),
}));

// Mock the Line component
jest.mock('components/sphere', () => ({
    __esModule: true,
    default: ({ position, width, index, isAgentTalking }: {
        position: [number, number, number];
        width: number;
        index: number;
        isAgentTalking: boolean;
    }) => (
        <div
            data-testid={`line-${index}`}
            data-position={JSON.stringify(position)}
            data-width={width}
            data-agent-talking={isAgentTalking}
        />
    ),
}));

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveStyle(style: Record<string, any>): R;
            toHaveAttribute(attr: string, value?: string): R;
            toHaveLength(length: number): R;
            toBeLessThan(expected: number): R;
            toBe(expected: any): R;
        }
    }
}

describe('AudioVisualizer', () => {
    const defaultProps = {
        isAgentTalking: false,
        testMode: true,
    };

    beforeEach(() => {
        // Clear all mocks between tests
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(<AudioVisualizer {...defaultProps} />);
        const canvas = screen.getByTestId('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('renders canvas with correct dimensions', () => {
        render(<AudioVisualizer {...defaultProps} />);
        const canvas = screen.getByTestId('canvas');
        expect(canvas).toBeInTheDocument();
        expect(canvas.parentElement).toHaveStyle({ width: '100%', height: '300px' });
    });

    it('renders lighting components', () => {
        render(<AudioVisualizer {...defaultProps} />);
        const ambientLight = screen.getByTestId('ambient-light');
        const pointLight = screen.getByTestId('point-light');

        expect(ambientLight).toBeInTheDocument();
        expect(pointLight).toBeInTheDocument();
        expect(pointLight).toHaveAttribute('data-position', '[0,5,5]');
    });

    it('renders correct number of lines', () => {
        render(<AudioVisualizer {...defaultProps} />);
        const lines = screen.getAllByTestId(/line-/);
        expect(lines).toHaveLength(20); // lineCount is 20
    });

    it('renders with agent audio data', () => {
        const props = {
            ...defaultProps,
            agentAudioData: new Float32Array([0.5, 0.6, 0.7]),
            isAgentTalking: true,
        };
        render(<AudioVisualizer {...props} />);
        const lines = screen.getAllByTestId(/line-/);
        expect(lines).toHaveLength(20);
        expect(lines[0]).toHaveAttribute('data-agent-talking', 'true');
    });

    it('renders with user audio data', () => {
        const props = {
            ...defaultProps,
            userAudioData: new Float32Array([0.5, 0.6, 0.7]),
        };
        render(<AudioVisualizer {...props} />);
        const lines = screen.getAllByTestId(/line-/);
        expect(lines).toHaveLength(20);
        expect(lines[0]).toHaveAttribute('data-agent-talking', 'false');
    });

    it('renders with both audio data types', () => {
        const props = {
            ...defaultProps,
            agentAudioData: new Float32Array([0.5, 0.6, 0.7]),
            userAudioData: new Float32Array([0.3, 0.4, 0.5]),
        };
        render(<AudioVisualizer {...props} />);
        const lines = screen.getAllByTestId(/line-/);
        expect(lines).toHaveLength(20);
    });

    it('renders with isAgentTalking true', () => {
        const props = {
            ...defaultProps,
            isAgentTalking: true,
        };
        render(<AudioVisualizer {...props} />);
        const lines = screen.getAllByTestId(/line-/);
        expect(lines).toHaveLength(20);
        expect(lines[0]).toHaveAttribute('data-agent-talking', 'true');
    });

    it('positions lines correctly', () => {
        render(<AudioVisualizer {...defaultProps} />);
        const lines = screen.getAllByTestId(/line-/);
        const firstLinePosition = JSON.parse(lines[0].getAttribute('data-position') || '[]');
        const lastLinePosition = JSON.parse(lines[19].getAttribute('data-position') || '[]');

        // Check that lines are positioned from left to right
        expect(firstLinePosition[0]).toBeLessThan(lastLinePosition[0]);

        // Check that lines are on the same y and z plane
        expect(firstLinePosition[1]).toBe(lastLinePosition[1]);
        expect(firstLinePosition[2]).toBe(lastLinePosition[2]);
    });
});