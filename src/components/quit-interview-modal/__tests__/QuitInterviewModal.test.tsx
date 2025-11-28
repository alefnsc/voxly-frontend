import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuitInterviewModal from '../index';

describe('QuitInterviewModal Component', () => {
    const mockOnClose = jest.fn();
    const mockOnQuit = jest.fn();
    const defaultMessage = "This action can't be undone and your interview credits will be consumed.";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with default props', () => {
        render(
            <QuitInterviewModal
                isOpen={true}
                onClose={mockOnClose}
                onQuit={mockOnQuit}
            />
        );

        // Check modal title
        expect(screen.getByText('Are you sure you want to quit?')).toBeInTheDocument();

        // Check default message
        expect(screen.getByText(defaultMessage)).toBeInTheDocument();

        // Check warning section
        expect(screen.getByText('What happens if you quit')).toBeInTheDocument();
        expect(screen.getByText('Your interview credit will be marked as used')).toBeInTheDocument();
        expect(screen.getByText('Your current progress will not be saved')).toBeInTheDocument();

        // Check buttons
        expect(screen.getByText('Return to Interview')).toBeInTheDocument();
        expect(screen.getByText('Quit Anyway')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
        const customMessage = 'Custom warning message';
        render(
            <QuitInterviewModal
                isOpen={true}
                onClose={mockOnClose}
                onQuit={mockOnQuit}
                message={customMessage}
            />
        );

        expect(screen.getByText(customMessage)).toBeInTheDocument();
        expect(screen.queryByText(defaultMessage)).not.toBeInTheDocument();
    });

    it('handles close button click', () => {
        render(
            <QuitInterviewModal
                isOpen={true}
                onClose={mockOnClose}
                onQuit={mockOnQuit}
            />
        );

        const closeButton = screen.getByText('Return to Interview');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnQuit).not.toHaveBeenCalled();
    });

    it('handles quit button click', () => {
        render(
            <QuitInterviewModal
                isOpen={true}
                onClose={mockOnClose}
                onQuit={mockOnQuit}
            />
        );

        const quitButton = screen.getByText('Quit Anyway');
        fireEvent.click(quitButton);

        expect(mockOnQuit).toHaveBeenCalledTimes(1);
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('does not render when isOpen is false', () => {
        render(
            <QuitInterviewModal
                isOpen={false}
                onClose={mockOnClose}
                onQuit={mockOnQuit}
            />
        );

        expect(screen.queryByText('Are you sure you want to quit?')).not.toBeInTheDocument();
        expect(screen.queryByText(defaultMessage)).not.toBeInTheDocument();
        expect(screen.queryByText('Return to Interview')).not.toBeInTheDocument();
        expect(screen.queryByText('Quit Anyway')).not.toBeInTheDocument();
    });
}); 