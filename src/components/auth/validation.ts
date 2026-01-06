/**
 * Auth Validation Schemas
 * 
 * Zod schemas for authentication form validation.
 * Follows Vocaid design language for error messaging.
 * 
 * @module components/auth/validation
 */

import { z } from 'zod';

/**
 * Password Policy Validation
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least 3 of 4 character classes: lowercase, uppercase, number, special
 * - No more than 2 identical characters in a row
 */

// Check for 3+ identical consecutive characters
function hasConsecutiveIdentical(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true;
    }
  }
  return false;
}

// Count how many character classes are present
function countCharacterClasses(password: string): number {
  let count = 0;
  if (/[a-z]/.test(password)) count++;
  if (/[A-Z]/.test(password)) count++;
  if (/[0-9]/.test(password)) count++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) count++;
  return count;
}

// Validate password against policy
export function validatePasswordPolicy(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  const classCount = countCharacterClasses(password);
  if (classCount < 3) {
    errors.push('Password must contain at least 3 of: lowercase, uppercase, number, special character');
  }
  
  if (hasConsecutiveIdentical(password)) {
    errors.push('Password cannot have more than 2 identical characters in a row');
  }
  
  return { valid: errors.length === 0, errors };
}

// Zod refinement for password policy
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (password) => countCharacterClasses(password) >= 3,
    'Password must contain at least 3 of: lowercase, uppercase, number, special character'
  )
  .refine(
    (password) => !hasConsecutiveIdentical(password),
    'Password cannot have more than 2 identical characters in a row'
  );

// User roles for the application - expanded generic options
export const USER_ROLES = [
  'Candidate',
  'Student',
  'Junior Developer',
  'Mid-level Developer',
  'Senior Developer',
  'Tech Lead',
  'Engineering Manager',
  'Product Manager',
  'Data Analyst',
  'Data Engineer',
  'Recruiter',
  'HR / People Ops',
  'Other'
] as const;

export type UserRole = typeof USER_ROLES[number];

// Seniority levels for interview targeting
export const SENIORITY_LEVELS = [
  'Intern',
  'Junior',
  'Mid',
  'Senior',
  'Staff',
  'Principal',
  'Manager'
] as const;

export type SeniorityLevel = typeof SENIORITY_LEVELS[number];

// Supported countries for B2C (all enabled)
// ID verification is only available for Brazil users
export const SUPPORTED_COUNTRIES = [
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', enabled: true, idVerificationAvailable: true },
  { code: 'US', name: 'United States', flag: '🇺🇸', enabled: true, idVerificationAvailable: false },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', enabled: true, idVerificationAvailable: false },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', enabled: true, idVerificationAvailable: false },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', enabled: true, idVerificationAvailable: false },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', enabled: true, idVerificationAvailable: false },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', enabled: true, idVerificationAvailable: false },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', enabled: true, idVerificationAvailable: false },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', enabled: true, idVerificationAvailable: false },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', enabled: true, idVerificationAvailable: false },
] as const;

// Helper to check if ID verification is available for a country
export function isIdVerificationAvailable(countryCode: string): boolean {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  return country?.idVerificationAvailable ?? false;
}

export type CountryCode = typeof SUPPORTED_COUNTRIES[number]['code'];

// Sign-up form validation schema (requires all fields)
export const signUpSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  password: passwordSchema,
  
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
  
  preferredLanguage: z.string().min(1, 'Please select a language'),
  
  countryCode: z.string().length(2, 'Please select a country').default('BR'),
});

// First-party sign-up schema (simplified - optional fields collected in onboarding)
export const firstPartySignUpSchema = z.object({
  firstName: z.string().max(50, 'First name must be less than 50 characters').optional(),
  lastName: z.string().max(50, 'Last name must be less than 50 characters').optional(),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type FirstPartySignUpFormData = z.infer<typeof firstPartySignUpSchema>;

// Sign-in form validation schema
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Verification code schema
export const verificationSchema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
});

// Password reset schema (for setting new password with confirm)
export const passwordResetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Set password schema (for SSO users setting their first password)
export const setPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type exports for form data
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type VerificationFormData = z.infer<typeof verificationSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;
