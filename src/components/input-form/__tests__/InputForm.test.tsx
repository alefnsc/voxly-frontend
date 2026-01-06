import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthCheck } from 'hooks/use-auth-check';
import InputForm from '../index';

jest.mock('hooks/use-language', () => ({
    __esModule: true,
    useLanguage: () => ({ currentLanguage: 'en-US' }),
}));

jest.mock('components/credits-modal', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('components/credit-packages', () => ({
    __esModule: true,
    default: () => <div data-testid="credit-packages" />,
}));

// Mock the hooks and dependencies
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

jest.mock('hooks/use-auth-check', () => ({
    useAuthCheck: jest.fn(),
}));

describe('InputForm Component', () => {
    const mockNavigate = jest.fn();
    const mockUpdateCredits = jest.fn();
    const mockSetShowCreditsModal = jest.fn();

    const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john@example.com',
    };

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
        (useAuthCheck as jest.Mock).mockReturnValue({
            user: mockUser,
            isLoading: false,
            userCredits: 5,
            showCreditsModal: false,
            setShowCreditsModal: mockSetShowCreditsModal,
            updateCredits: mockUpdateCredits,
            refreshCredits: jest.fn(),
        });

        // Mock FileReader for base64 resume upload
        class FileReaderMock {
            result: string | ArrayBuffer | null = null;
            onloadend: null | (() => void) = null;
            onerror: null | (() => void) = null;
            readAsDataURL(_file: File) {
                this.result = 'data:application/pdf;base64,ZmFrZV9iYXNlNjQ=';
                this.onloadend?.();
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).FileReader = FileReaderMock;

        localStorage.clear();
        sessionStorage.clear();
    });

    it('renders all form fields correctly', () => {
        render(<InputForm isMobile={false} />);

        expect(screen.getByPlaceholderText('Company Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Job Title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Job Description (minimum 200 characters)')).toBeInTheDocument();
        expect(screen.getByText('Upload your resume')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start Interview/i })).toBeInTheDocument();
    });


    it('handles file upload correctly', async () => {
        render(<InputForm isMobile={false} />);

        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const fileInput = screen.getByTestId('resume-upload');

        fireEvent.change(fileInput, { target: { files: [file] } });
        await waitFor(() => {
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });
    });

    it('renders payment options when user has no credits', () => {
        (useAuthCheck as jest.Mock).mockReturnValue({
            user: mockUser,
            isLoading: false,
            userCredits: 0,
            showCreditsModal: false,
            setShowCreditsModal: mockSetShowCreditsModal,
            updateCredits: mockUpdateCredits,
            refreshCredits: jest.fn(),
        });

        render(<InputForm isMobile={false} />);
        expect(screen.getByTestId('credit-packages')).toBeInTheDocument();
    });

    it('submits and navigates to /interview with valid data', async () => {
        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
        jest.spyOn(Math, 'random').mockReturnValue(0.123456);

        mockUpdateCredits.mockResolvedValue(undefined);
        render(<InputForm isMobile={false} />);

        fireEvent.change(screen.getByPlaceholderText('Company Name'), { target: { name: 'companyName', value: 'Test Corp' } });
        fireEvent.change(screen.getByPlaceholderText('Job Title'), { target: { name: 'jobTitle', value: 'Developer' } });
        fireEvent.change(screen.getByPlaceholderText('Job Description (minimum 200 characters)'), { target: { name: 'jobDescription', value: 'a'.repeat(200) } });

        // Upload a file
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const fileInput = screen.getByTestId('resume-upload');
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(screen.getByText('test.pdf')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('checkbox'));

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Start Interview/i });
        fireEvent.click(submitButton);

        await waitFor(() => expect(mockUpdateCredits).toHaveBeenCalledWith('use'));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

        const [path, navOptions] = mockNavigate.mock.calls[0];
        expect(path).toBe('/interview');
        expect(navOptions.state.body.metadata.company_name).toBe('Test Corp');
        expect(navOptions.state.body.metadata.job_title).toBe('Developer');
        expect(navOptions.state.body.metadata.job_description).toBe('a'.repeat(200));
        expect(navOptions.state.body.metadata.first_name).toBe('John');
        expect(navOptions.state.body.metadata.last_name).toBe('Doe');
        expect(navOptions.state.body.metadata.interviewee_cv).toBe('ZmFrZV9iYXNlNjQ=');
        expect(navOptions.state.body.metadata.preferred_language).toBe('en-US');
        expect(navOptions.state.body.metadata.interview_id).toMatch(/^interview_1700000000000_/);

    });
});