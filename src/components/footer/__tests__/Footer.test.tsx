import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../index';

import { useUser } from 'contexts/AuthContext';

jest.mock('contexts/AuthContext', () => ({
    __esModule: true,
    useUser: jest.fn(),
}));

jest.mock('components/shared/AppFooter', () => ({
    __esModule: true,
    AppFooter: ({ variant }: { variant: string }) => (
        <footer role="contentinfo" data-testid="app-footer" data-variant={variant} />
    ),
}));

describe('Footer Component', () => {
    it('renders without crashing', () => {
        (useUser as jest.Mock).mockReturnValue({ isSignedIn: false, isLoaded: true, user: null });
        render(<Footer />);
        expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    });

    it('uses the full footer when signed out', () => {
        (useUser as jest.Mock).mockReturnValue({ isSignedIn: false, isLoaded: true, user: null });
        render(<Footer />);
        expect(screen.getByTestId('app-footer')).toHaveAttribute('data-variant', 'full');
    });

    it('uses the app footer when signed in', () => {
        (useUser as jest.Mock).mockReturnValue({ isSignedIn: true, isLoaded: true, user: { id: 'user' } });
        render(<Footer />);
        expect(screen.getByTestId('app-footer')).toHaveAttribute('data-variant', 'app');
    });
}); 