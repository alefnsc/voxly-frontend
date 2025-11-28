import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TypingTextEffect from '../TypingTextEffect';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, variants, initial, animate, className }: any) => (
            <div
                data-testid="motion-div"
                data-initial={initial}
                data-animate={animate}
                data-variants={JSON.stringify(variants)}
                className={className}
            >
                {children}
            </div>
        ),
        span: ({ children, variants, className }: any) => (
            <span
                data-testid="motion-span"
                data-variants={JSON.stringify(variants)}
                className={className}
            >
                {children}
            </span>
        ),
    },
}));

describe('TypingTextEffect', () => {
    it('renders the text correctly', () => {
        const testText = 'Hello World';
        render(<TypingTextEffect text={testText} />);

        // Check that each non-space character is rendered
        testText.split('').forEach(char => {
            if (char !== ' ') {
                const elements = screen.getAllByText(char);
                expect(elements.length).toBeGreaterThan(0);
            }
        });

        // Check total number of spans matches text length
        const spans = screen.getAllByTestId('motion-span');
        expect(spans).toHaveLength(testText.length);
    });

    it('splits the text into individual characters', () => {
        const testText = 'ABC';
        render(<TypingTextEffect text={testText} />);

        // Check that each character is rendered in a separate span
        const spans = screen.getAllByTestId('motion-span');
        expect(spans).toHaveLength(3);
        expect(spans[0]).toHaveTextContent('A');
        expect(spans[1]).toHaveTextContent('B');
        expect(spans[2]).toHaveTextContent('C');
    });

    it('applies the correct animation variants', () => {
        render(<TypingTextEffect text="Test" />);

        // Check the motion.div props
        const motionDiv = screen.getByTestId('motion-div');
        expect(motionDiv).toHaveAttribute('data-initial', 'hidden');
        expect(motionDiv).toHaveAttribute('data-animate', 'visible');

        // Check that the variants are applied correctly
        const variants = JSON.parse(motionDiv.getAttribute('data-variants') || '{}');
        expect(variants).toHaveProperty('hidden');
        expect(variants).toHaveProperty('visible');
        expect(variants.visible).toHaveProperty('transition');
        expect(variants.visible.transition).toHaveProperty('staggerChildren');
        expect(variants.visible.transition).toHaveProperty('delayChildren');
    });

    it('applies the correct letter variants', () => {
        render(<TypingTextEffect text="Test" />);

        // Check the motion.span props
        const spans = screen.getAllByTestId('motion-span');
        const spanVariants = JSON.parse(spans[0].getAttribute('data-variants') || '{}');

        expect(spanVariants).toHaveProperty('hidden');
        expect(spanVariants).toHaveProperty('visible');
        expect(spanVariants.hidden).toHaveProperty('opacity');
        expect(spanVariants.hidden).toHaveProperty('y');
        expect(spanVariants.visible).toHaveProperty('opacity');
        expect(spanVariants.visible).toHaveProperty('y');
        expect(spanVariants.visible).toHaveProperty('transition');
    });

    it('handles empty text', () => {
        render(<TypingTextEffect text="" />);

        // Check that the component renders without crashing
        expect(screen.getByTestId('motion-div')).toBeInTheDocument();
        expect(screen.queryAllByTestId('motion-span')).toHaveLength(0);
    });

    it('handles custom animation props', () => {
        const customProps = {
            staggerDelay: 0.2,
            initialDelay: 0.5,
            yOffset: 20,
        };

        render(<TypingTextEffect text="Test" {...customProps} />);

        const motionDiv = screen.getByTestId('motion-div');
        const variants = JSON.parse(motionDiv.getAttribute('data-variants') || '{}');

        // Check that the values exist and are numbers
        expect(typeof variants.visible.transition.staggerChildren).toBe('number');
        expect(typeof variants.visible.transition.delayChildren).toBe('number');

        const spans = screen.getAllByTestId('motion-span');
        const spanVariants = JSON.parse(spans[0].getAttribute('data-variants') || '{}');
        expect(typeof spanVariants.hidden.y).toBe('number');
    });

    it('handles whitespace correctly', () => {
        const testText = 'Hello   World';
        render(<TypingTextEffect text={testText} />);

        const spans = screen.getAllByTestId('motion-span');
        expect(spans).toHaveLength(testText.length);

        // Check that spaces are preserved by checking total length
        const textContent = spans.map(span => span.textContent).join('');
        expect(textContent).toBe(testText);
    });

    it('handles special characters', () => {
        const testText = '!@#$%^&*()';
        render(<TypingTextEffect text={testText} />);

        const spans = screen.getAllByTestId('motion-span');
        expect(spans).toHaveLength(testText.length);

        // Check that special characters are rendered correctly
        testText.split('').forEach((char, index) => {
            expect(spans[index]).toHaveTextContent(char);
        });
    });

    it('handles long text efficiently', () => {
        const longText = 'a'.repeat(1000);
        render(<TypingTextEffect text={longText} />);

        const spans = screen.getAllByTestId('motion-span');
        expect(spans).toHaveLength(1000);

        // Check that all spans have the correct animation variants
        spans.forEach(span => {
            const variants = JSON.parse(span.getAttribute('data-variants') || '{}');
            expect(variants).toHaveProperty('hidden');
            expect(variants).toHaveProperty('visible');
        });
    });
}); 