import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopBar from '../index';
import { useUser } from '@clerk/clerk-react';

// Mock the Clerk hooks
jest.mock('@clerk/clerk-react', () => ({
    useUser: jest.fn(),
    SignInButton: () => <div data-testid="sign-in-button">Sign In</div>,
    UserButton: () => <div data-testid="user-button">User Button</div>,
}));

// Mock the useMediaQuery hook
jest.mock('@mantine/hooks', () => ({
    useMediaQuery: jest.fn(),
}));

// Mock the MainLogo component
jest.mock('../../main-logo', () => ({
    __esModule: true,
    default: () => <div data-testid="main-logo">Main Logo</div>,
}));

describe('TopBar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the main logo', () => {
        (useUser as jest.Mock).mockReturnValue({ user: null });
        (require('@mantine/hooks').useMediaQuery as jest.Mock).mockReturnValue(false);

        render(<TopBar />);
        expect(screen.getByTestId('main-logo')).toBeInTheDocument();
    });

    it('renders SignInButton when user is not logged in', () => {
        (useUser as jest.Mock).mockReturnValue({ user: null });
        (require('@mantine/hooks').useMediaQuery as jest.Mock).mockReturnValue(false);

        render(<TopBar />);
        expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
        expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
    });

    it('renders UserButton when user is logged in on desktop', () => {
        (useUser as jest.Mock).mockReturnValue({ user: { id: '123' } });
        (require('@mantine/hooks').useMediaQuery as jest.Mock).mockReturnValue(false);

        render(<TopBar />);
        expect(screen.getByTestId('user-button')).toBeInTheDocument();
        expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
    });

    it('does not render UserButton on mobile when user is logged in', () => {
        (useUser as jest.Mock).mockReturnValue({ user: { id: '123' } });
        (require('@mantine/hooks').useMediaQuery as jest.Mock).mockReturnValue(true);

        render(<TopBar />);
        expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
    });

    it('has correct layout classes', () => {
        (useUser as jest.Mock).mockReturnValue({ user: null });
        (require('@mantine/hooks').useMediaQuery as jest.Mock).mockReturnValue(false);

        render(<TopBar />);

        // Test the outer container
        const outerContainer = screen.getByTestId('main-logo').closest('div.flex.h-\\[70px\\]');
        expect(outerContainer).toBeInTheDocument();
        expect(outerContainer).toHaveClass('flex');
        expect(outerContainer).toHaveClass('h-[70px]');
        expect(outerContainer).toHaveClass('items-center');
        expect(outerContainer).toHaveClass('justify-center');
        expect(outerContainer).toHaveClass('border-b');
        expect(outerContainer).toHaveClass('border-slate-6');

        // Test the inner container
        const innerContainer = screen.getByTestId('main-logo').closest('div.flex.flex-row');
        expect(innerContainer).toBeInTheDocument();
        expect(innerContainer).toHaveClass('w-full');
        expect(innerContainer).toHaveClass('max-w-[80%]');
    });
}); 