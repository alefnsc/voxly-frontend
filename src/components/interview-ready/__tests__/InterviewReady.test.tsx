import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import InterviewReady from '../index';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

describe('InterviewReady', () => {
  it('renders the ready message and button', () => {
    render(
      <MemoryRouter>
        <InterviewReady />
      </MemoryRouter>
    );
    expect(screen.getByText(/Ready for another practice session/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Interview/i)).toBeInTheDocument();
  });

  it('navigates to /interview-setup on button click', () => {
    const navigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(navigate);
    render(
      <MemoryRouter>
        <InterviewReady />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Start Interview/i));
    expect(navigate).toHaveBeenCalledWith('/interview-setup');
  });
});
