/**
 * Set Password Form Component
 * 
 * Reusable form for SSO/OAuth users to set their database password.
 * Used in onboarding flow and optionally as fallback in dashboard.
 * Matches onboarding styling: purple-600 primary buttons, zinc borders, etc.
 * 
 * @module components/auth/SetPasswordForm
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { validatePasswordPolicy } from './validation';
import { AuthInput } from './AuthInput';
import apiService from 'services/APIService';

interface SetPasswordFormProps {
  /** User ID to set password for */
  userId: string;
  /** Called on successful password set */
  onSuccess: () => void;
  /** Called when user clicks back (optional - renders back button if provided) */
  onBack?: () => void;
  /** Whether form is in loading/submitting state externally */
  disabled?: boolean;
  /** Additional class name for the form container */
  className?: string;
}

export const SetPasswordForm: React.FC<SetPasswordFormProps> = ({
  userId,
  onSuccess,
  onBack,
  disabled = false,
  className,
}) => {
  const { t } = useTranslation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Validate password on change
  useEffect(() => {
    if (password) {
      const validation = validatePasswordPolicy(password);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password policy
    const validation = validatePasswordPolicy(password);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError(t('account.validation.passwordsDoNotMatch', 'Passwords do not match'));
      return;
    }

    if (!userId) {
      setError(t('auth.errors.notAuthenticated', 'Not authenticated'));
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.setPassword(userId, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('account.security.setPasswordFailed', 'Failed to set password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = disabled || isSubmitting;
  const canSubmit = password.length > 0 && confirmPassword.length > 0 && passwordErrors.length === 0;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Error message */}
      {error && (
        <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-sm text-zinc-700">
          {error}
        </div>
      )}

      <AuthInput
        type="password"
        label={t('auth.setPassword.passwordLabel', 'New Password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('auth.setPassword.passwordPlaceholder', 'Enter your password')}
        autoComplete="new-password"
        disabled={isFormDisabled}
        required
      />
      
      {/* Live password validation errors */}
      {passwordErrors.length > 0 && (
        <ul className="text-xs text-amber-600 space-y-0.5">
          {passwordErrors.map((err, i) => (
            <li key={i}>• {err}</li>
          ))}
        </ul>
      )}

      <AuthInput
        type="password"
        label={t('auth.setPassword.confirmLabel', 'Confirm Password')}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder={t('auth.setPassword.confirmPlaceholder', 'Confirm your password')}
        autoComplete="new-password"
        disabled={isFormDisabled}
        required
      />

      {/* Password Requirements Checklist */}
      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
        <p className="text-xs font-medium text-zinc-700 mb-1">
          {t('auth.setPassword.requirements', 'Password must have:')}
        </p>
        <ul className="text-xs text-zinc-500 space-y-0.5">
          <li className={cn(password.length >= 8 && 'text-emerald-600')}>
            • {t('auth.setPassword.reqLength', 'At least 8 characters')}
          </li>
          <li className={cn(
            /[a-z]/.test(password) && /[A-Z]/.test(password) && 'text-emerald-600'
          )}>
            • {t('auth.setPassword.reqCase', 'Uppercase and lowercase letters')}
          </li>
          <li className={cn(/[0-9]/.test(password) && 'text-emerald-600')}>
            • {t('auth.setPassword.reqNumber', 'At least one number')}
          </li>
          <li className={cn(
            /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) && 'text-emerald-600'
          )}>
            • {t('auth.setPassword.reqSpecial', 'At least one special character')}
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className={cn('flex gap-3 pt-2', onBack ? 'flex-col sm:flex-row' : '')}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isFormDisabled}
            className="flex-1 py-3 px-4 bg-white text-zinc-700 font-medium rounded-lg border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.back', 'Back')}
          </button>
        )}
        <button
          type="submit"
          disabled={isFormDisabled || !canSubmit}
          className={cn(
            'flex-1 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg',
            'hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
            'disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors'
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('common.saving', 'Saving...')}
            </span>
          ) : (
            t('auth.setPassword.submit', 'Set Password')
          )}
        </button>
      </div>
    </form>
  );
};

export default SetPasswordForm;
