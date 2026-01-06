import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtectedInterviewRoute } from '../index';
import { useAuthCheck } from 'hooks/use-auth-check';
import { useLocation } from 'react-router-dom';
import { useUser } from 'contexts/AuthContext';

jest.mock('contexts/AuthContext', () => ({
    __esModule: true,
    useUser: jest.fn(),
}));

jest.mock('hooks/use-auth-check', () => ({
    useAuthCheck: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn(),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}));

jest.mock('components/loading', () => ({
    __esModule: true,
    default: () => <div data-testid="loading">Loading...</div>,
}));

describe('ProtectedInterviewRoute', () => {
    const mockLocation = {
        state: {
            body: {
                metadata: {
                    first_name: 'John',
                    job_title: 'Developer',
                    company_name: 'Tech Corp',
                    job_description: 'Job description',
                    interview_id: '123', // Resume is fetched server-side from Azure Blob
                },
            },
        },
    };

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        // Reset mocks
        jest.clearAllMocks();
    });

    it('renders loading state when auth is not loaded', () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: false, isSignedIn: false, user: null });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 1, isLoading: false });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        render(
            <ProtectedInterviewRoute>
                <div>Protected Content</div>
            </ProtectedInterviewRoute>
        );

        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders loading state when auth check is loading', () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: true, user: { id: '123' } });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 1, isLoading: true });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        render(
            <ProtectedInterviewRoute>
                <div>Protected Content</div>
            </ProtectedInterviewRoute>
        );

        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('redirects to home when user is not signed in', async () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: false, user: null });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 1, isLoading: false });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        render(
            <ProtectedInterviewRoute>
                <div>Protected Content</div>
            </ProtectedInterviewRoute>
        );

        await waitFor(() => expect(screen.getByTestId('navigate')).toBeInTheDocument());
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });

    it('redirects to home when validation token is missing', async () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: true, user: { id: '123' } });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 1, isLoading: false });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        render(
            <ProtectedInterviewRoute>
                <div>Protected Content</div>
            </ProtectedInterviewRoute>
        );

        await waitFor(() => expect(screen.getByTestId('navigate')).toBeInTheDocument());
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });

    it('redirects to home when user has no credits', async () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: true, user: { id: '123' } });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 0, isLoading: false });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        // Set validation token
        localStorage.setItem('interviewValidationToken', '123');
        localStorage.setItem('tokenExpiration', (Date.now() + 3600000).toString());

        render(
            <ProtectedInterviewRoute>
                <div>Protected Content</div>
            </ProtectedInterviewRoute>
        );

        await waitFor(() => expect(screen.getByTestId('navigate')).toBeInTheDocument());
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });

    it('renders children when all validation passes', async () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: true, user: { id: '123' } });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 1, isLoading: false });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        // Set validation token
        localStorage.setItem('interviewValidationToken', '123');
        localStorage.setItem('tokenExpiration', (Date.now() + 3600000).toString());

        render(
            <ProtectedInterviewRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedInterviewRoute>
        );

        await waitFor(() => expect(screen.getByTestId('protected-content')).toBeInTheDocument());
        expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
}); 