import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DefaultLayout } from 'components/default-layout';
import { cn } from 'lib/utils';
import { validatePasswordPolicy } from 'components/auth/validation';
import apiService from 'services/APIService';

const AuthPasswordConfirm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(t('account.passwordResetConfirm.missingToken', 'Missing reset token.'));
      return;
    }

    // Validate password against policy
    const validation = validatePasswordPolicy(password);
    if (!validation.valid) {
      setError(validation.errors[0] || t('account.validation.passwordInvalid', 'Password does not meet requirements'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('account.validation.passwordsDoNotMatch', 'Passwords do not match'));
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.confirmPasswordReset(token, password);
      setSuccess(true);
    } catch (err: any) {
      const message = err?.message || t('account.passwordResetConfirm.invalidToken', 'This reset link is invalid or expired.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout className="min-h-screen bg-zinc-50" hideSidebar>
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">
            {t('account.passwordResetConfirm.title', 'Set a new password')}
          </h1>
          <p className="text-sm text-zinc-600 mt-2">
            {t('account.passwordResetConfirm.subtitle', 'Enter a new password for your account.')}
          </p>

          {success ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <div className="font-semibold">
                  {t('account.passwordResetConfirm.successTitle', 'Password updated')}
                </div>
                <div>
                  {t('account.passwordResetConfirm.successMessage', 'Your password was updated. You can sign in now.')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/sign-in')}
                className={cn(
                  'w-full py-3 px-4 rounded-lg text-sm font-semibold',
                  'bg-zinc-900 text-white',
                  'transition-all duration-200',
                  'hover:bg-zinc-800'
                )}
              >
                {t('account.passwordResetConfirm.backToSignIn', 'Back to sign in')}
              </button>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  {t('account.passwordResetConfirm.passwordLabel', 'New password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  {t('account.passwordResetConfirm.confirmLabel', 'Confirm new password')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full py-3 px-4 rounded-lg text-sm font-semibold',
                  'bg-zinc-900 text-white',
                  'transition-all duration-200',
                  'hover:bg-zinc-800',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSubmitting
                  ? t('account.passwordResetConfirm.updating', 'Updating...')
                  : t('account.passwordResetConfirm.submit', 'Update password')}
              </button>
            </form>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default AuthPasswordConfirm;
