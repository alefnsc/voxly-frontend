'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MainLogo from '../main-logo'
import { useUser, SignInButton, UserButton } from '@clerk/clerk-react';
import { Coins } from 'lucide-react';
import { useAuthCheck } from '../../hooks/use-auth-check';

interface NavItem {
  label: string;
  path: string;
  requiresAuth?: boolean;
}

// Dashboard is now integrated into Home page for logged-in users
const navItems: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Credits', path: '/credits', requiresAuth: true },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

const TopBar: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const { userCredits } = useAuthCheck();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActivePath = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeMobileMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Filter nav items based on auth
  const visibleNavItems = navItems.filter(
    item => !item.requiresAuth || isSignedIn
  );
  
  return (
    <>
      <nav className="flex h-[70px] items-center justify-center border-b border-gray-200 bg-white" role="navigation" aria-label="Main navigation">
        <div className="flex flex-row items-center justify-between w-full max-w-7xl px-6 sm:px-8 md:px-10 lg:px-8">
          {/* Logo */}
          <div className="flex justify-center items-center">
            <MainLogo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={isActivePath(item.path) ? 'nav-link-active' : 'nav-link'}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Section & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* User Button / Sign In */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {/* Credits Display - Desktop */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full">
                  <Coins className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">{userCredits}</span>
                  <span className="text-xs text-gray-500 hidden lg:inline">credits</span>
                </div>
                {/* User name and avatar */}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    {user.firstName}
                  </span>
                  <UserButton 
                    afterSignOutUrl='/' 
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9",
                        userButtonPopoverCard: "shadow-lg"
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <SignInButton 
                mode='modal'
                forceRedirectUrl='/'
              >
                <button 
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-md transition-colors shadow-sm"
                  aria-label="Sign in to Voxly"
                >
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        className={`mobile-menu-panel md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="font-semibold text-gray-900">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Section - Mobile */}
          {user && (
            <div className="border-b border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <UserButton 
                  afterSignOutUrl='/' 
                  appearance={{
                    elements: {
                      avatarBox: "w-14 h-14",
                      userButtonPopoverCard: "shadow-lg"
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
              {/* Credits Display - Mobile */}
              <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl">
                <Coins className="w-5 h-5 text-gray-500" />
                <span className="text-base font-semibold text-gray-700">{userCredits}</span>
                <span className="text-sm text-gray-500">credits available</span>
              </div>
            </div>
          )}

          {/* Mobile Navigation Links */}
          <div className="flex-1 py-4">
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-6 py-4 text-lg font-medium transition-colors ${
                  isActivePath(item.path)
                    ? 'text-voxly-purple bg-purple-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={closeMobileMenu}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default TopBar