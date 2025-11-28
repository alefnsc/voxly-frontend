import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../index';

describe('Footer Component', () => {
    it('renders without crashing', () => {
        render(<Footer />);
        const footer = screen.getByRole('contentinfo');
        expect(footer).toBeInTheDocument();
    });

    it('displays the correct copyright text', () => {
        render(<Footer />);
        const copyrightText = screen.getByText('© voxly  - All Rights Reserved.');
        expect(copyrightText).toBeInTheDocument();
    });

    it('has the correct styling classes', () => {
        render(<Footer />);
        const footer = screen.getByRole('contentinfo');

        expect(footer).toHaveClass('flex');
        expect(footer).toHaveClass('b-0');
        expect(footer).toHaveClass('h-[90px]');
        expect(footer).toHaveClass('items-center');
        expect(footer).toHaveClass('justify-center');
        expect(footer).toHaveClass('border-t');
        expect(footer).toHaveClass('border-slate-6');
    });

    it('has the correct structure', () => {
        render(<Footer />);
        const footer = screen.getByRole('contentinfo');
        expect(footer.tagName).toBe('FOOTER');
        expect(footer.children.length).toBe(0);
        expect(footer.textContent).toBe('© voxly  - All Rights Reserved.');
    });
}); 