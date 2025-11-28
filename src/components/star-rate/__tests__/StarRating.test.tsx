import React from 'react';
import { render, screen } from '@testing-library/react';
import StarRating from '../StarRating';

describe('StarRating', () => {
    const mockOnRatingChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the correct number of filled stars based on score', () => {
        render(<StarRating score="3" onRatingChange={mockOnRatingChange} />);

        // Find all SVG elements
        const stars = screen.getAllByTestId('star');
        expect(stars).toHaveLength(5);

        // Check that 3 stars are filled (yellow) and 2 are not (gray)
        const filledStars = stars.filter(star => star.getAttribute('fill') === 'yellow');
        const unfilledStars = stars.filter(star => star.getAttribute('fill') === 'gray');

        expect(filledStars).toHaveLength(3);
        expect(unfilledStars).toHaveLength(2);
    });

    it('calls onRatingChange with the correct rating value', () => {
        render(<StarRating score="4" onRatingChange={mockOnRatingChange} />);

        expect(mockOnRatingChange).toHaveBeenCalledWith(4);
    });

    it('handles invalid score values by defaulting to 1', () => {
        render(<StarRating score="invalid" onRatingChange={mockOnRatingChange} />);

        // Find all SVG elements
        const stars = screen.getAllByTestId('star');
        const filledStars = stars.filter(star => star.getAttribute('fill') === 'yellow');

        expect(filledStars).toHaveLength(1);
        expect(mockOnRatingChange).toHaveBeenCalledWith(1);
    });

    it('caps score values at 5', () => {
        render(<StarRating score="10" onRatingChange={mockOnRatingChange} />);

        // Find all SVG elements
        const stars = screen.getAllByTestId('star');
        const filledStars = stars.filter(star => star.getAttribute('fill') === 'yellow');

        expect(filledStars).toHaveLength(5);
        expect(mockOnRatingChange).toHaveBeenCalledWith(5);
    });

    it('caps score values at 1 for values less than 1', () => {
        render(<StarRating score="0" onRatingChange={mockOnRatingChange} />);

        // Find all SVG elements
        const stars = screen.getAllByTestId('star');
        const filledStars = stars.filter(star => star.getAttribute('fill') === 'yellow');

        expect(filledStars).toHaveLength(1);
        expect(mockOnRatingChange).toHaveBeenCalledWith(1);
    });
}); 