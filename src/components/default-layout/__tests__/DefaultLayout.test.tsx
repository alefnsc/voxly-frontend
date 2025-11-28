import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DefaultLayout } from '../index';

// Mock the TopBar component
jest.mock('components/top-bar', () => ({
    __esModule: true,
    default: () => <div data-testid="top-bar">TopBar</div>,
}));

describe('DefaultLayout Component', () => {
    const renderDefaultLayout = (children: React.ReactNode = <div data-testid="test-content">Test</div>, className?: string) => {
        return render(
            <DefaultLayout className={className}>
                {children}
            </DefaultLayout>
        );
    };

    it('renders children correctly', () => {
        const testContent = 'Test Content';
        renderDefaultLayout(<div data-testid="test-content">{testContent}</div>);
        expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('renders TopBar component', () => {
        renderDefaultLayout();
        expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });

    it('applies custom className correctly', () => {
        const customClass = 'custom-class';
        renderDefaultLayout(<div data-testid="test-content">Test</div>, customClass);

        // Test the main element
        const main = screen.getByTestId('main-content');
        expect(main).toHaveClass('w-full');

        // Test the content container
        const contentContainer = screen.getByTestId('content-container');
        expect(contentContainer).toHaveClass('mx-auto', 'container', 'pt-6', customClass);
    });

    it('has correct default layout structure', () => {
        renderDefaultLayout();

        // Test the root container
        const rootContainer = screen.getByTestId('root-container');
        expect(rootContainer).toHaveClass('flex', 'min-h-screen');

        // Test the main element
        const mainElement = screen.getByTestId('main-content');
        expect(mainElement).toHaveClass('w-full');

        // Test the content wrapper and container
        const contentWrapper = screen.getByTestId('content-wrapper');
        const contentContainer = screen.getByTestId('content-container');

        expect(contentWrapper).toHaveClass('pb-0');
        expect(contentContainer).toHaveClass('mx-auto', 'container', 'pt-6');
    });

    it('renders multiple children correctly', () => {
        renderDefaultLayout(
            <>
                <div data-testid="child-1">Child 1</div>
                <div data-testid="child-2">Child 2</div>
                <div data-testid="child-3">Child 3</div>
            </>
        );

        expect(screen.getByTestId('child-1')).toBeInTheDocument();
        expect(screen.getByTestId('child-2')).toBeInTheDocument();
        expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('handles empty children', () => {
        renderDefaultLayout(null);
        expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    });

    it('handles undefined className', () => {
        renderDefaultLayout();

        // Test the content container without custom class
        const contentContainer = screen.getByTestId('content-container');
        expect(contentContainer).toHaveClass('mx-auto', 'container', 'pt-6');
    });

    it('maintains correct padding and margin structure', () => {
        renderDefaultLayout();

        const contentWrapper = screen.getByTestId('content-wrapper');
        const contentContainer = screen.getByTestId('content-container');

        expect(contentWrapper).toHaveClass('pb-0');
        expect(contentContainer).toHaveClass('mx-auto', 'container', 'pt-6');
    });

    it('renders complex children components', () => {
        const ComplexComponent = () => (
            <div data-testid="complex-component">
                <h1>Title</h1>
                <p>Paragraph</p>
                <button>Click me</button>
            </div>
        );

        renderDefaultLayout(<ComplexComponent />);

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Paragraph')).toBeInTheDocument();
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });
}); 