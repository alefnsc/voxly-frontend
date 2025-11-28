import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Helmet } from 'react-helmet';
import Metadata from '../index';

describe('Metadata', () => {
    it('renders without crashing', () => {
        const { container } = render(<Metadata />);
        expect(container).toBeTruthy();
    });

    it('sets correct title', () => {
        render(<Metadata />);
        const helmet = Helmet.peek();
        expect(helmet.title).toBe('Voxly AI | Mock Interview');
    });

    it('sets correct description', () => {
        render(<Metadata />);
        const helmet = Helmet.peek();
        const metaDescription = helmet.metaTags.find(tag => tag.name === 'description');
        expect(metaDescription?.content).toBe('Your AI Interviewer for surpassing hiring challenges.');
    });

    it('sets correct favicon', () => {
        render(<Metadata />);
        const helmet = Helmet.peek();
        const link = helmet.linkTags.find(tag => tag.rel === 'icon');
        expect(link?.href).toBe('/logo.svg');
    });

    it('handles custom title prop', () => {
        render(<Metadata title="Custom Title" />);
        const helmet = Helmet.peek();
        expect(helmet.title).toBe('Voxly AI | Mock Interview');
    });

    it('handles custom description prop', () => {
        render(<Metadata description="Custom Description" />);
        const helmet = Helmet.peek();
        const metaDescription = helmet.metaTags.find(tag => tag.name === 'description');
        expect(metaDescription?.content).toBe('Your AI Interviewer for surpassing hiring challenges.');
    });
}); 