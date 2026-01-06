import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLogo from '../index';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

describe('MainLogo', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it('renders without crashing', () => {
        const { container } = render(<MainLogo />);
        expect(container).toBeTruthy();
    });

    it('renders the logo image', () => {
        render(<MainLogo />);
        const logo = screen.getByAltText('Logo');
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', '/app-logo.png');
    });

    it('has correct image dimensions', () => {
        render(<MainLogo />);
        const logo = screen.getByAltText('Logo');
        expect(logo).toHaveAttribute('height', '100');
        expect(logo).toHaveAttribute('width', '100');
    });

    it('maintains aspect ratio with mobile prop', () => {
        render(<MainLogo isMobile={true} />);
        const logo = screen.getByAltText('Logo');
        expect(logo).toHaveAttribute('height', '100');
        expect(logo).toHaveAttribute('width', '100');
    });
}); 