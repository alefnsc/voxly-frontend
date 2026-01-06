import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BodyCopy from '../index';

describe('BodyCopy', () => {
    const defaultProps = {
        isMobile: false,
    };

    it('renders without crashing', () => {
        const { container } = render(<BodyCopy {...defaultProps} />);
        expect(container).toBeTruthy();
    });

    it('renders the main heading', () => {
        render(<BodyCopy {...defaultProps} />);
        expect(screen.getByText('How It Works')).toBeInTheDocument();
    });

    it('renders all feature titles', () => {
        render(<BodyCopy {...defaultProps} />);
        expect(screen.getByText('Master Interview')).toBeInTheDocument();
        expect(screen.getByText('Tailored Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Real-Time Feedback')).toBeInTheDocument();
        expect(screen.getByText('Comprehensive Results')).toBeInTheDocument();
    });

    it('renders all feature descriptions', () => {
        render(<BodyCopy {...defaultProps} />);
        expect(screen.getByText('Refine answers with AI-driven mock interviews')).toBeInTheDocument();
        expect(screen.getByText('Get tips based on job description and seniority')).toBeInTheDocument();
        expect(screen.getByText('Receive instant, constructive feedback')).toBeInTheDocument();
        expect(screen.getByText('Review detailed performance and insights')).toBeInTheDocument();
    });
}); 