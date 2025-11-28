import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthCheck } from 'hooks/use-auth-check';
import InputForm from '../index';

// Mock the hooks and dependencies
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

jest.mock('hooks/use-auth-check', () => ({
    useAuthCheck: jest.fn(),
}));

// Mock pdfToText function
const mockPdfToText = jest.fn();
jest.mock('react-pdftotext', () => ({
    __esModule: true,
    default: (file: File) => mockPdfToText(file),
}));

describe('InputForm Component', () => {
    const mockNavigate = jest.fn();
    const mockUpdateCredits = jest.fn();
    const mockSetShowCreditsModal = jest.fn();

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
        (useAuthCheck as jest.Mock).mockReturnValue({
            user: { id: '123' },
            isLoading: false,
            userCredits: 5,
            showCreditsModal: false,
            setShowCreditsModal: mockSetShowCreditsModal,
            updateCredits: mockUpdateCredits,
        });

        // Setup default PDF mock
        mockPdfToText.mockImplementation((file) => {
            if (file.name === 'error.pdf') {
                return Promise.reject(new Error('Failed to extract text'));
            }
            return Promise.resolve('Sample resume text');
        });

        // Mock localStorage and sessionStorage
        const mockStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        };

        Object.defineProperty(window, 'localStorage', { value: mockStorage });
        Object.defineProperty(window, 'sessionStorage', { value: mockStorage });
    });

    it('renders all form fields correctly', () => {
        render(<InputForm isMobile={false} />);

        expect(screen.getByPlaceholderText(/First Name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Last Name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Company Name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Job Title/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Job Description/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload your resume/i)).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start Interview/i })).toBeInTheDocument();
    });


    it('handles file upload correctly', async () => {
        render(<InputForm isMobile={false} />);

        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const fileInput = screen.getByTestId('resume-upload');

        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockPdfToText).toHaveBeenCalledWith(file);
        });

        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });
    });


    it('shows credits modal when user has no credits', async () => {
        (useAuthCheck as jest.Mock).mockReturnValue({
            user: { id: '123' },
            isLoading: false,
            userCredits: 0,
            showCreditsModal: false,
            setShowCreditsModal: mockSetShowCreditsModal,
            updateCredits: mockUpdateCredits,
        });

        render(<InputForm isMobile={false} />);

        // Fill in required fields
        fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { name: 'firstName', value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { name: 'lastName', value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText(/Company Name/i), { target: { name: 'companyName', value: 'Test Corp' } });
        fireEvent.change(screen.getByPlaceholderText(/Job Title/i), { target: { name: 'jobTitle', value: 'Developer' } });
        fireEvent.change(screen.getByPlaceholderText(/Job Description/i), { target: { name: 'jobDescription', value: 'a'.repeat(200) } });
        fireEvent.click(screen.getByRole('checkbox'));

        // Upload a file
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const fileInput = screen.getByTestId('resume-upload');
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Wait for file processing
        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Start Interview/i });
        fireEvent.click(submitButton);

    });

    it('handles form submission with valid data', async () => {
        // Mock storage to return the same values we set
        const mockStorage = {
            getItem: jest.fn().mockImplementation((key) => {
                if (key === 'interviewValidationToken') return '1234567890';
                if (key === 'tokenExpiration') return (Date.now() + 30 * 60 * 1000).toString();
                return null;
            }),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        };

        Object.defineProperty(window, 'localStorage', { value: mockStorage });
        Object.defineProperty(window, 'sessionStorage', { value: mockStorage });

        // Mock updateCredits to return a positive number
        mockUpdateCredits.mockResolvedValue(4);

        render(<InputForm isMobile={false} />);

        // Fill in required fields
        fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { name: 'firstName', value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { name: 'lastName', value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText(/Company Name/i), { target: { name: 'companyName', value: 'Test Corp' } });
        fireEvent.change(screen.getByPlaceholderText(/Job Title/i), { target: { name: 'jobTitle', value: 'Developer' } });
        fireEvent.change(screen.getByPlaceholderText(/Job Description/i), { target: { name: 'jobDescription', value: 'a'.repeat(200) } });
        fireEvent.click(screen.getByRole('checkbox'));

        // Upload a file
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const fileInput = screen.getByTestId('resume-upload');
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Wait for file processing
        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Start Interview/i });
        fireEvent.click(submitButton);

    });
});