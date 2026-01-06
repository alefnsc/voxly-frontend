/**
 * Set Password Modal
 * 
 * Modal component for SSO users to set their DB password.
 * Required for full account access and future email/password login.
 * 
 * @module components/auth/SetPasswordModal
 */

import React, { useState, useEffect } from 'react';
import { useUser } from 'contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from 'lib/utils';
import { validatePasswordPolicy, setPasswordSchema, SetPasswordFormData } from './validation';
import { AuthInput } from './AuthInput';
import apiService from 'services/APIService';

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** If true, user cannot dismiss the modal */
  required?: boolean;
}

export const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  required = false,
}) => {
  const { user } = useUser();
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

    if (!user?.id) {
      setError(t('auth.errors.notAuthenticated', 'Not authenticated'));
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.setPassword(user.id, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('account.security.setPasswordFailed', 'Failed to set password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={required ? undefined : onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-zinc-900">
                {t('auth.setPassword.title', 'Set Your Password')}
              </h2>
              <p className="text-sm text-zinc-600 mt-2">
                {t('auth.setPassword.subtitle', 'Create a password for your account. This allows you to sign in with email and password in the future.')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
                required
              />
              {passwordErrors.length > 0 && (
                <ul className="mt-1 text-xs text-amber-600 space-y-0.5">
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
                required
              />

              {/* Password Requirements */}
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

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                {!required && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg text-sm font-medium',
                      'bg-zinc-100 text-zinc-700',
                      'hover:bg-zinc-200',
                      'transition-colors duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {t('common.later', 'Later')}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || passwordErrors.length > 0}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg text-sm font-semibold',
                    'bg-zinc-900 text-white',
                    'hover:bg-zinc-800',
                    'transition-colors duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    required && 'w-full'
                  )}
                >
                  {isSubmitting
                    ? t('common.saving', 'Saving...')
                    : t('auth.setPassword.submit', 'Set Password')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SetPasswordModal;
