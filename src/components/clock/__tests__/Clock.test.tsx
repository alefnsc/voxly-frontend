import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Clock from '../index';

describe('Clock Component', () => {
    it('renders with default props', () => {
        render(<Clock />);

        // Check if minutes and seconds are displayed with default values
        expect(screen.getByLabelText('minutes')).toHaveTextContent('15');
        expect(screen.getByLabelText('seconds')).toHaveTextContent('00');

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
        expect(screen.getByLabelText('minutes')).toHaveTextContent('05');
        expect(screen.getByLabelText('seconds')).toHaveTextContent('30');
    });

    it('renders with single digit values', () => {
        render(<Clock timerMinutes={1} timerSeconds={9} />);

        // Check if single digit values are displayed correctly
        expect(screen.getByLabelText('minutes')).toHaveTextContent('01');
        expect(screen.getByLabelText('seconds')).toHaveTextContent('09');
    });

    it('renders with zero values', () => {
        render(<Clock timerMinutes={0} timerSeconds={0} />);

        // Check if zero values are displayed correctly
        expect(screen.getByLabelText('minutes')).toHaveTextContent('00');
        expect(screen.getByLabelText('seconds')).toHaveTextContent('00');
    });

    it('renders with double digit values', () => {
        render(<Clock timerMinutes={45} timerSeconds={59} />);

        // Check if double digit values are displayed correctly
        expect(screen.getByLabelText('minutes')).toHaveTextContent('45');
        expect(screen.getByLabelText('seconds')).toHaveTextContent('59');
    });

    it('maintains proper structure with all elements', () => {
        render(<Clock />);

        // Check if all structural elements are present
        expect(screen.getByTestId('timer-container')).toBeInTheDocument();
        expect(screen.getByTestId('timer')).toBeInTheDocument();
        expect(screen.getByTestId('clock')).toBeInTheDocument();
    });
}); 