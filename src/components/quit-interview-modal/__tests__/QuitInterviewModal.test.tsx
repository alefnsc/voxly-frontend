import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuitInterviewModal from '../index';

describe('QuitInterviewModal Component', () => {
    const mockOnClose = jest.fn();
    const mockOnQuit = jest.fn();
    const defaultMessage = "Your interview will end and you'll be redirected.";

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
        expect(screen.getByText(/credit will be restored/i)).toBeInTheDocument();
        expect(screen.getByText(/credit will be consumed/i)).toBeInTheDocument();
        expect(screen.getByText(/no feedback will be generated/i)).toBeInTheDocument();
        expect(screen.getByText('Your current progress will not be saved')).toBeInTheDocument();

        // Confirmation text
        expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();

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