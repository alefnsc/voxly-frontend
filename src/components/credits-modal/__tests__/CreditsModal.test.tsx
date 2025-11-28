import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreditsModal from '../index';

// Mock the window.open function
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

describe('CreditsModal Component', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly when closed', () => {
        render(<CreditsModal isOpen={false} onClose={mockOnClose} />);

        // Modal should not be visible when isOpen is false
        expect(screen.queryByText('No Interview Credits Available')).not.toBeInTheDocument();
    });

    it('renders correctly when open', () => {
        render(<CreditsModal isOpen={true} onClose={mockOnClose} />);

        // Check if title is present
        expect(screen.getByText('No Interview Credits Available')).toBeInTheDocument();

        // Check if main message is present
        expect(screen.getByText(/You currently have no interview credits available/)).toBeInTheDocument();

        // Check if credit earning methods are listed
        expect(screen.getByText('How to earn more credits:')).toBeInTheDocument();
        expect(screen.getByText('3 credits are automatically provided each month')).toBeInTheDocument();
        expect(screen.getByText('Earn additional credits through community participation and contributions')).toBeInTheDocument();

        // Check if buttons are present
        expect(screen.getByTestId('close-button')).toBeInTheDocument();
        expect(screen.getByText('Visit Community')).toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
        render(<CreditsModal isOpen={true} onClose={mockOnClose} />);

        const closeButton = screen.getByTestId('close-button');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('opens community page when Visit Community button is clicked', () => {
        render(<CreditsModal isOpen={true} onClose={mockOnClose} />);

        const communityButton = screen.getByText('Visit Community');
        fireEvent.click(communityButton);

        expect(mockWindowOpen).toHaveBeenCalledWith('/community', '_blank');
    });

    it('displays all icons correctly', () => {
        render(<CreditsModal isOpen={true} onClose={mockOnClose} />);

        // Check if all icons are present
        expect(screen.getByTestId('coins-icon')).toBeInTheDocument();
        expect(screen.getByTestId('award-icon')).toBeInTheDocument();
        expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });
});