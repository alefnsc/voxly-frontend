import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BodyCopy from '../index';

// Mock the react-scroll Link component
jest.mock('react-scroll', () => ({
    Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the TypingTextEffect component
jest.mock('components/typing-text-effect/TypingTextEffect', () => ({
    __esModule: true,
    default: ({ text }: { text: string }) => <div data-testid="typing-text">{text}</div>,
}));

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
        expect(screen.getByText(/Unlock Your Next/i)).toBeInTheDocument();
        expect(screen.getByText(/Voxly/i)).toBeInTheDocument();
    });

    it('renders all section headings', () => {
        render(<BodyCopy {...defaultProps} />);
        expect(screen.getByText(/Master Interview:/i)).toBeInTheDocument();
        expect(screen.getByText(/Tailored Recommendations:/i)).toBeInTheDocument();
        expect(screen.getByText(/Real-Time Feedback:/i)).toBeInTheDocument();
        expect(screen.getByText(/Comprehensive Results:/i)).toBeInTheDocument();
    });

    it('renders all section descriptions', () => {
        render(<BodyCopy {...defaultProps} />);
        expect(screen.getByText(/Refine answers with AI-driven mock interview./i)).toBeInTheDocument();
        expect(screen.getByText(/Get tips on to showcase your skills based on job description and seniority./i)).toBeInTheDocument();
        expect(screen.getByText(/Receive instant, constructive feedback./i)).toBeInTheDocument();
        expect(screen.getByText(/Review a detailed performance, strengths and opportunities./i)).toBeInTheDocument();
    });

    it('renders the Get Started button', () => {
        render(<BodyCopy {...defaultProps} />);
        expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('applies mobile styles when isMobile is true', () => {
        render(<BodyCopy isMobile={true} />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('p-7');
    });

    it('applies desktop styles when isMobile is false', () => {
        render(<BodyCopy {...defaultProps} />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('p-7', 'lg:p-10');
    });
}); 