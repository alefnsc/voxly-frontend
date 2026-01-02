import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtectedInterviewRoute } from '../index';
import { useUser } from '@clerk/clerk-react';
import { useAuthCheck } from 'hooks/use-auth-check';
import { useLocation } from 'react-router-dom';
import Loading from 'components/loading';

// Mock the hooks and components
jest.mock('@clerk/clerk-react', () => ({
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
        (useUser as jest.Mock).mockReturnValue({ isLoaded: false, isSignedIn: false });
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
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: true });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 1, isLoading: true });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        render(
            <ProtectedInterviewRoute>
                <div>Protected Content</div>
            </ProtectedInterviewRoute>
        );

        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('redirects to home when user is not signed in', () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: false });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 1, isLoading: false });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        render(
            <ProtectedInterviewRoute>
                <div>Protected Content</div>
            </ProtectedInterviewRoute>
        );

        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });

    it('redirects to home when validation token is missing', () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: true });
        (useAuthCheck as jest.Mock).mockReturnValue({ userCredits: 1, isLoading: false });
        (useLocation as jest.Mock).mockReturnValue(mockLocation);

        render(
            <ProtectedInterviewRoute>
                <div>Protected Content</div>
            </ProtectedInterviewRoute>
        );

        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });

    it('redirects to home when user has no credits', () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: true });
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

        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });

    it('renders children when all validation passes', () => {
        (useUser as jest.Mock).mockReturnValue({ isLoaded: true, isSignedIn: true });
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

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
}); 