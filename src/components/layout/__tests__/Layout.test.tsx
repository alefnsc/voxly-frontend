import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from '../index';

// Mock the components
jest.mock('react-router-dom', () => ({
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

jest.mock('components/footer', () => ({
    __esModule: true,
    default: () => <div data-testid="footer">Footer Content</div>,
}));

jest.mock('components/metadata', () => ({
    __esModule: true,
    default: () => <div data-testid="metadata">Metadata Content</div>,
}));

describe('Layout', () => {
    it('renders without crashing', () => {
        const { container } = render(<Layout />);
        expect(container).toBeTruthy();
    });

    it('renders the Metadata component', () => {
        render(<Layout />);
        expect(screen.getByTestId('metadata')).toBeInTheDocument();
    });

    it('renders the Outlet component', () => {
        render(<Layout />);
        expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('renders the Footer component', () => {
        render(<Layout />);
        expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('renders components in correct order', () => {
        render(<Layout />);
        const elements = screen.getAllByTestId(/metadata|outlet|footer/);
        expect(elements[0]).toHaveAttribute('data-testid', 'metadata');
        expect(elements[1]).toHaveAttribute('data-testid', 'outlet');
        expect(elements[2]).toHaveAttribute('data-testid', 'footer');
    });
}); 