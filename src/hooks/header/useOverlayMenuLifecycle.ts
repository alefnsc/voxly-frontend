/**
 * useOverlayMenuLifecycle
 *
 * Shared hook for overlay menus (mobile drawer, slide-out panel, etc.).
 * Encapsulates common behaviors:
 * - Close on `Escape` key
 * - Close on route change
 * - Lock body scroll while open
 *
 * @module hooks/header/useOverlayMenuLifecycle
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface UseOverlayMenuLifecycleOptions {
  /** Whether the menu is currently open */
  isOpen: boolean;
  /** Callback to close the menu */
  onClose: () => void;
  /** Close menu when pathname changes (default: true) */
  closeOnRouteChange?: boolean;
  /** Close menu on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Lock body scroll while menu is open (default: true) */
  lockBodyScroll?: boolean;
}

export function useOverlayMenuLifecycle({
  isOpen,
  onClose,
  closeOnRouteChange = true,
  closeOnEscape = true,
  lockBodyScroll = true,
}: UseOverlayMenuLifecycleOptions): void {
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    if (closeOnRouteChange && isOpen) {
      onClose();
    }
    // Only react to pathname changes, not to onClose reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!lockBodyScroll) return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lockBodyScroll, isOpen]);
}

export default useOverlayMenuLifecycle;
