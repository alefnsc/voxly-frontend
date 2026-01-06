import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useLocation } from 'react-router-dom';
import useCreditsRestoration from 'hooks/use-credits-restoration';
import MicPermissionCheck from '../index';

// Mock the useCreditsRestoration hook
jest.mock('hooks/use-credits-restoration', () => ({
    __esModule: true,
    default: jest.fn()
}));

// Mock the useLocation hook
jest.mock('react-router-dom', () => ({
    useLocation: () => ({
        state: {
            body: {
                metadata: {
                    interview_id: '123'
                }
            }
        }
    })
}));

describe('MicPermissionCheck Component', () => {
    const mockOnPermissionGranted = jest.fn();
    const mockRestoreCredits = jest.fn();
    const mockGetUserMedia = jest.fn();
    let originalMediaDevices;
    let originalUserAgent;

    beforeEach(() => {
        jest.clearAllMocks();
        (useCreditsRestoration as jest.Mock).mockReturnValue({
            restoreCredits: mockRestoreCredits
        });

        // Store original values
        originalMediaDevices = navigator.mediaDevices;
        originalUserAgent = navigator.userAgent;

        // Set up default mediaDevices mock
        Object.defineProperty(navigator, 'mediaDevices', {
            value: { getUserMedia: mockGetUserMedia },
            configurable: true,
            writable: true
        });
    });

    afterEach(() => {
        // Restore original values
        Object.defineProperty(navigator, 'mediaDevices', {
            value: originalMediaDevices,
            configurable: true,
            writable: true
        });
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true,
            writable: true
        });
    });

    it('shows modal when permission is denied', async () => {
        const err = new Error('no');
        (err as any).name = 'NotAllowedError';
        mockGetUserMedia.mockRejectedValueOnce(err);
        render(<MicPermissionCheck onPermissionGranted={mockOnPermissionGranted} />);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        expect(screen.getByText('Microphone Access Required')).toBeInTheDocument();
        expect(screen.getByText('Enable Microphone')).toBeInTheDocument();
    });

    it('handles unsupported browser case', async () => {
        // Set mediaDevices to undefined
        Object.defineProperty(navigator, 'mediaDevices', {
            value: undefined,
            configurable: true,
            writable: true
        });

        render(<MicPermissionCheck onPermissionGranted={mockOnPermissionGranted} />);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        expect(screen.getByText('Microphone Not Supported')).toBeInTheDocument();
    });

    it('handles successful permission grant', async () => {
        const mockStream = {
            getTracks: () => [{ stop: jest.fn() }],
        };
        mockGetUserMedia.mockResolvedValueOnce(mockStream);

        render(<MicPermissionCheck onPermissionGranted={mockOnPermissionGranted} />);

        await waitFor(() => {
            expect(mockOnPermissionGranted).toHaveBeenCalledWith(true);
        });
    });

    it('shows troubleshooting steps when permission is denied after request', async () => {
        // Initial permission check fails
        const err1 = new Error('no');
        (err1 as any).name = 'NotAllowedError';
        mockGetUserMedia.mockRejectedValueOnce(err1);

        render(<MicPermissionCheck onPermissionGranted={mockOnPermissionGranted} />);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        expect(screen.getByText('Enable Microphone')).toBeInTheDocument();

        // Second attempt also fails
        const err2 = new Error('no');
        (err2 as any).name = 'NotAllowedError';
        mockGetUserMedia.mockRejectedValueOnce(err2);

        const enableButton = screen.getByText('Enable Microphone');
        fireEvent.click(enableButton);

        await waitFor(() => {
            expect(screen.getByText('Microphone Troubleshooting')).toBeInTheDocument();
        });

        expect(screen.getByText(/unable to access your microphone/i)).toBeInTheDocument();
    });

});