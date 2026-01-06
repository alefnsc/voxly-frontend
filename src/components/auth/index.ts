/**
 * Auth Components Barrel Export
 * 
 * Central export for all authentication-related components.
 * 
 * @module components/auth
 */

// Validation schemas and types
export * from './validation';

// Input components
export { AuthInput } from './AuthInput';
export { AuthSelect } from './AuthSelect';

// OAuth buttons
export { FirstPartyAuthButtons, FirstPartyAuthDivider } from './FirstPartyAuthButtons';

// Layout components
export { AuthShell } from './AuthShell';
export { AuthLogoBlock } from './AuthLogoBlock';
export { AuthLegalNotice } from './AuthLegalNotice';

// Avatar
export { CustomAvatar } from './CustomAvatar';

// Auth forms (first-party authentication)
export { FirstPartySignIn } from './FirstPartySignIn';
export { FirstPartySignUp } from './FirstPartySignUp';

// Password setup (for OAuth users)
export { SetPasswordForm } from './SetPasswordForm';
export { SetPasswordModal } from './SetPasswordModal';
