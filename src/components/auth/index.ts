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
export { AuthButtons, AuthDivider } from './AuthButtons';

// Layout components
export { AuthShell } from './AuthShell';
export { AuthLogoBlock } from './AuthLogoBlock';
export { AuthLegalNotice } from './AuthLegalNotice';

// Avatar
export { CustomAvatar } from './CustomAvatar';

// Main auth forms
export { CustomSignUp } from './CustomSignUp';
export { CustomSignIn } from './CustomSignIn';
