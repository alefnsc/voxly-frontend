import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import InterviewReady from '../index';
import i18n from 'lib/i18n';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

describe('InterviewReady', () => {
  beforeEach(async () => {
    localStorage.setItem('Vocaid_language', 'en-US');
    await i18n.changeLanguage('en-US');
  });

  it('renders the ready message and button', () => {
    const subtitle = i18n.t('interview.ready.subtitle', { defaultValue: 'Ready to practice?' });
    const title = i18n.t('dashboard.startNewInterview', { defaultValue: 'Start Your Next Interview' });
    const buttonLabel = i18n.t('interviews.startNew', { defaultValue: 'Start Interview' });

    render(
      <MemoryRouter>
        <InterviewReady />
      </MemoryRouter>
    );
    expect(screen.getByText(subtitle)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: title, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(buttonLabel, 'i') })).toBeInTheDocument();
  });

  it('navigates to /app/b2c/interview/new on button click', () => {
    const navigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(navigate);

    const buttonLabel = i18n.t('interviews.startNew', { defaultValue: 'Start Interview' });

    render(
      <MemoryRouter>
        <InterviewReady />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: new RegExp(buttonLabel, 'i') }));
    expect(navigate).toHaveBeenCalledWith('/app/b2c/interview/new');
  });
});
