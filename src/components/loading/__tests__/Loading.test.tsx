import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loading from '../index';

// Mock the Icons component
jest.mock('components/icons', () => ({
    Icons: {
        loader: () => <div data-testid="loader-icon" className="animate-spin h-6 w-6" />,
    },
}));

describe('Loading', () => {
    it('renders without crashing', () => {
        const { container } = render(<Loading />);
        expect(container).toBeTruthy();
    });

    it('displays loading text', () => {
        render(<Loading />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders the loader icon', () => {
        render(<Loading />);
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('has animation class on loader', () => {
        render(<Loading />);
        const loader = screen.getByTestId('loader-icon');
        expect(loader).toHaveClass('animate-spin');
    });

    it('has correct dimensions on loader', () => {
        render(<Loading />);
        const loader = screen.getByTestId('loader-icon');
        expect(loader).toHaveClass('h-6', 'w-6');
    });

    it('has full screen container', () => {
        const { container } = render(<Loading />);
        const fullScreenDiv = container.firstChild;
        expect(fullScreenDiv).toHaveClass('h-screen', 'w-screen');
    });

    it('has centered content', () => {
        const { container } = render(<Loading />);
        const fullScreenDiv = container.firstChild;
        expect(fullScreenDiv).toHaveClass('flex', 'items-center', 'justify-center');
    });
}); 