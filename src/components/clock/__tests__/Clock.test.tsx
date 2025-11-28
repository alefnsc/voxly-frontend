import React from 'react';
import { render, screen } from '@testing-library/react';
import Clock from '../index';

describe('Clock Component', () => {
    it('renders with default props', () => {
        render(<Clock />);

        // Check if minutes and seconds are displayed with default values
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();

        // Check if labels are present
        expect(screen.getByText('Minutes')).toBeInTheDocument();
        expect(screen.getByText('Seconds')).toBeInTheDocument();

        // Check if colon separator is present
        expect(screen.getByText(':')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
        const customMinutes = 5;
        const customSeconds = 30;

        render(<Clock timerMinutes={customMinutes} timerSeconds={customSeconds} />);

        // Check if custom values are displayed
        expect(screen.getByText(customMinutes.toString())).toBeInTheDocument();
        expect(screen.getByText(customSeconds.toString())).toBeInTheDocument();
    });

    it('renders with single digit values', () => {
        render(<Clock timerMinutes={1} timerSeconds={9} />);

        // Check if single digit values are displayed correctly
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('renders with zero values', () => {
        render(<Clock timerMinutes={0} timerSeconds={0} />);

        // Check if zero values are displayed correctly
        const zeroElements = screen.getAllByText('0');
        expect(zeroElements).toHaveLength(2);
    });

    it('renders with double digit values', () => {
        render(<Clock timerMinutes={45} timerSeconds={59} />);

        // Check if double digit values are displayed correctly
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByText('59')).toBeInTheDocument();
    });

    it('maintains proper structure with all elements', () => {
        render(<Clock />);

        // Check if all structural elements are present
        expect(screen.getByTestId('timer-container')).toBeInTheDocument();
        expect(screen.getByTestId('timer')).toBeInTheDocument();
        expect(screen.getByTestId('clock')).toBeInTheDocument();
    });
}); 