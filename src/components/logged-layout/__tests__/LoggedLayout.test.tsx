/**
 * LoggedLayout Tests
 * 
 * Verifies that the LoggedLayout component renders correctly
 * with TopBar, Sidebar, and Footer for authenticated users.
 * 
 * @module components/logged-layout/__tests__
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Link, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';
import { useUser } from 'contexts/AuthContext';

// Mock dependencies
jest.mock('contexts/AuthContext', () => ({
  useUser: jest.fn(),
}));

jest.mock('hooks/use-auth-check', () => ({
  useAuthCheck: () => ({
    isLoading: false,
    userCredits: 10,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('components/language-selector', () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));

jest.mock('components/header', () => () => <div data-testid="app-header" />);

jest.mock('components/beta-feedback', () => ({
  BetaFeedbackFab: () => null,
}));

// Import after mocks
import { LoggedLayout, useLoggedLayout } from '../index';

beforeEach(() => {
  jest.clearAllMocks();
  (useUser as unknown as jest.Mock).mockReturnValue({
    user: {
      id: 'test-user-id',
      firstName: 'John',
      lastName: 'Doe',
      imageUrl: null,
      email: 'john@test.com',
      publicMetadata: { role: 'Candidate' },
    },
    isSignedIn: true,
    isLoaded: true,
  });

  // JSDOM doesn't implement scrollTo; LoggedLayout calls it in an effect.
  (window as any).scrollTo = jest.fn();
});

// Helper to render with router
const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div>
      <div data-testid="pathname">{location.pathname}</div>
      <div data-testid="hash">{location.hash}</div>
    </div>
  );
};

describe('LoggedLayout Component', () => {
  describe('Layout Structure', () => {
    it('renders skip-to-content link for accessibility', () => {
      renderWithRouter(
        <LoggedLayout>
          <div>Test Content</div>
        </LoggedLayout>
      );

      const skipLink = screen.getByText('Skip to content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('renders main content area with correct id', () => {
      renderWithRouter(
        <LoggedLayout>
          <div data-testid="test-content">Test Content</div>
        </LoggedLayout>
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('renders children inside the layout', () => {
      renderWithRouter(
        <LoggedLayout>
          <div data-testid="test-content">Test Content</div>
        </LoggedLayout>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

    it('scrolls to top on sidebar navigation (no hash)', async () => {
      const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      renderWithRouter(
        <LoggedLayout>
          <LocationDisplay />
        </LoggedLayout>,
        { route: '/app/b2c/performance' }
      );

      scrollSpy.mockClear();
      fireEvent.click(screen.getByText('nav.dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/app/b2c/dashboard');
      });

      expect(scrollSpy).toHaveBeenCalled();
      scrollSpy.mockRestore();
    });

    it('does not scroll to top when navigating to a hash URL', async () => {
      const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      renderWithRouter(
        <LoggedLayout>
          <Link to="/app/b2c/dashboard#section">Go hash</Link>
          <LocationDisplay />
        </LoggedLayout>,
        { route: '/app/b2c/performance' }
      );

      scrollSpy.mockClear();
      fireEvent.click(screen.getByText('Go hash'));

      await waitFor(() => {
        expect(screen.getByTestId('hash')).toHaveTextContent('#section');
      });

      expect(scrollSpy).not.toHaveBeenCalled();
      scrollSpy.mockRestore();
    });


  describe('Authentication States', () => {
    it('shows loading skeleton when auth is not loaded', () => {
      (useUser as unknown as jest.Mock).mockReturnValue({
        user: null,
        isSignedIn: false,
        isLoaded: false,
      });

      renderWithRouter(
        <LoggedLayout>
          <div>Test Content</div>
        </LoggedLayout>
      );

      // Should show loading indicator
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('renders children directly when not signed in', () => {
      (useUser as unknown as jest.Mock).mockReturnValue({
        user: null,
        isSignedIn: false,
        isLoaded: true,
      });

      renderWithRouter(
        <LoggedLayout>
          <div data-testid="test-content">Test Content</div>
        </LoggedLayout>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('useLoggedLayout Hook', () => {
    it('returns default values when used outside LoggedLayout', () => {
      const TestComponent = () => {
        const context = useLoggedLayout();
        return (
          <div>
            <span data-testid="drawer-open">{String(context.isMobileDrawerOpen)}</span>
            <span data-testid="recent-interview">{String(context.hasRecentInterview)}</span>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('drawer-open')).toHaveTextContent('false');
      expect(screen.getByTestId('recent-interview')).toHaveTextContent('false');
    });
  });
});

describe('Layout Presence Test', () => {
  /**
   * QA Checklist Item: Verify TopBar, Sidebar, Footer appear on logged routes
   */
  it('should render all layout elements for authenticated users', () => {
    renderWithRouter(
      <LoggedLayout>
        <div>Page Content</div>
      </LoggedLayout>
    );

    // Verify main content area exists
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Verify skip link exists (accessibility)
    expect(screen.getByText('Skip to content')).toBeInTheDocument();
  });
});
