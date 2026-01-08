/**
 * Account Dashboard Page
 * 
 * User profile management with Vocaid styling.
 * Allows updating name, role, language, password, and account deletion.
 * 
 * @module pages/Account
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useUser, useAuth } from 'contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { config } from 'lib/config';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from 'lib/i18n';
import { useLanguage } from 'hooks/use-language';
import { CustomAvatar } from 'components/auth/CustomAvatar';
import { AuthInput } from 'components/auth/AuthInput';
import { AuthSelect } from 'components/auth/AuthSelect';
import { profileUpdateSchema, USER_ROLES, SUPPORTED_COUNTRIES, UserRole } from 'components/auth/validation';
import { CreditsPurchaseSection, BillingHistorySection } from 'components/billing';
import { PhoneVerificationCard } from 'pages/app/b2c/dashboard/PhoneVerificationCard';
import { ConnectedAccountsSection } from 'components/account';
import apiService from 'services/APIService';

// Section types
type Section = 'profile' | 'connections' | 'security' | 'creditsPurchase' | 'billingHistory';

// Animation variants
const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

interface ProfileFormData {
  firstName: string;
  lastName: string;
  role: UserRole;
}

const AccountDashboard: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  // Section state - profile is the default/first section
  const [activeSection, setActiveSection] = useState<Section>(() => {
    const sectionParam = searchParams.get('section');
    const validSections: Section[] = ['profile', 'connections', 'security', 'creditsPurchase', 'billingHistory'];
    if (sectionParam && validSections.includes(sectionParam as Section)) {
      return sectionParam as Section;
    }
    return 'profile';
  });

  // Keep activeSection in sync with ?section query param
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    const validSections: Section[] = ['profile', 'connections', 'security', 'creditsPurchase', 'billingHistory'];
    if (sectionParam && validSections.includes(sectionParam as Section) && sectionParam !== activeSection) {
      setActiveSection(sectionParam as Section);
    }
  }, [searchParams, activeSection]);
  
  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Form data
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    role: 'Candidate',
  });
  
  // Country state (separate from profileData since it's persisted differently)
  const [countryCode, setCountryCode] = useState<string>('BR');
  
  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Messages
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Field errors
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: (user.publicMetadata?.role as UserRole) || 'Candidate',
      });
      // Load country from user metadata
      const userCountry = user.publicMetadata?.countryCode as string;
      if (userCountry) {
        setCountryCode(userCountry);
      }
    }
  }, [user]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/');
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Language options
  const languageOptions = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    value: code,
    label: info.name,
  }));

  // Country options (Brazil-only enabled for now)
  const countryOptions = SUPPORTED_COUNTRIES.map((country) => ({
    value: country.code,
    label: `${country.flag} ${country.name}`,
    disabled: !country.enabled,
    sublabel: !country.enabled ? t('common.comingSoon') : undefined,
  }));

  // Role options
  const roleOptions = USER_ROLES.map((role) => ({
    value: role,
    label: t(`auth.roles.${role.toLowerCase()}`, role),
  }));

  // Handle profile input change
  const handleProfileChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setProfileSuccess(null);
    setProfileError(null);
  }, []);

  // Handle language change (instant)
  const handleLanguageChange = async (newLanguage: string) => {
    await changeLanguage(newLanguage as SupportedLanguageCode);
    
    // Also update in backend
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/api/users/metadata`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ preferredLanguage: newLanguage }),
      });
      
      if (!response.ok) {
        console.warn('Failed to sync language to backend:', await response.text());
      }
    } catch (error) {
      console.warn('Failed to sync language to backend:', error);
    }
  };

  // Handle country change
  const handleCountryChange = async (newCountry: string) => {
    setCountryCode(newCountry);
    
    if (!user?.id) return;
    
    // Update in backend
    try {
      const response = await fetch(`${config.backendUrl}/api/users/metadata`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ countryCode: newCountry }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setProfileError(data.error?.message || t('account.validation.updateFailed', 'Failed to update country'));
      } else {
        setProfileSuccess(t('account.countryUpdated', 'Country updated successfully'));
      }
    } catch (error) {
      console.warn('Failed to sync country to backend:', error);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate
    const result = profileUpdateSchema.safeParse(profileData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ProfileFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsUpdatingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      // Update profile via backend API
      const response = await fetch(`${config.backendUrl}/api/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          role: profileData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.message || 'Failed to update profile');
      }

      // Update local user state
      updateUser({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        fullName: `${profileData.firstName} ${profileData.lastName}`.trim(),
      });

      setProfileSuccess(t('account.profileUpdated', 'Profile updated successfully'));
    } catch (error: any) {
      console.error('Profile update error:', error);
      setProfileError(error.message || error.errors?.[0]?.message || t('account.validation.failedToUpdateProfile'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Request password reset email (double-step validation)
  const handleSendPasswordReset = async () => {
    if (!user?.id) return;

    setIsSendingResetEmail(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await apiService.requestPasswordResetEmail(user.id);
      setPasswordSuccess(t('account.security.resetEmailSent', 'We sent a reset link to your email.'));
    } catch (error: any) {
      console.error('Password reset request error:', error);
      setPasswordError(error?.message || t('account.security.resetEmailFailed', 'Failed to send reset link.'));
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError(t('account.validation.typeDeleteToConfirm'));
      return;
    }
    
    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      // Delete account via backend API
      const response = await fetch(`${config.backendUrl}/api/users/delete`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      setDeleteError(error.errors?.[0]?.message || t('account.validation.failedToDeleteAccount'));
      setIsDeletingAccount(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">
            {t('account.title', 'Account')} <span className="text-purple-600">{t('account.titleHighlight', 'Settings')}</span>
          </h1>
          <p className="text-zinc-500 mt-1">
            {t('account.subtitle', 'Manage your profile and preferences')}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white border border-zinc-200 rounded-xl p-4">
              <ul className="space-y-1">
                {[
                  { id: 'profile', label: t('account.sections.profile', 'Profile') },
                  { id: 'connections', label: t('account.sections.connections', 'Connected Accounts') },
                  { id: 'security', label: t('account.sections.security', 'Security') },
                  { id: 'creditsPurchase', label: t('account.sections.creditsPurchase', 'Buy Credits') },
                  { id: 'billingHistory', label: t('account.sections.billingHistory', 'Transaction History') },
                ].map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id as Section)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        activeSection === section.id
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      )}
                    >
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* User Card */}
            <div className="mt-4 bg-white border border-zinc-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CustomAvatar
                  imageUrl={user?.imageUrl}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {user?.email || user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <motion.div
                  key="profile"
                  variants={fadeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-zinc-900 mb-6">
                      {t('account.profile.title', 'Profile Information')}
                    </h2>

                    {/* Success/Error Messages */}
                    {profileSuccess && (
                      <div className="mb-4 p-3 bg-purple-50 border-l-4 border-purple-600 rounded-r">
                        <p className="text-sm text-purple-700">{profileSuccess}</p>
                      </div>
                    )}
                    {profileError && (
                      <div className="mb-4 p-3 bg-zinc-50 border-l-4 border-black rounded-r">
                        <p className="text-sm text-zinc-700">{profileError}</p>
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      {/* Avatar Upload (read-only for now) */}
                      <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
                        <CustomAvatar
                          imageUrl={user?.imageUrl}
                          firstName={user?.firstName}
                          lastName={user?.lastName}
                          size="xl"
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-700">
                            {t('account.profile.avatar', 'Profile Picture')}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {t('account.profile.avatarHint', 'Managed through your OAuth provider')}
                          </p>
                        </div>
                      </div>

                      {/* Name Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <AuthInput
                          label={t('auth.firstName', 'First Name')}
                          value={profileData.firstName}
                          onChange={(e) => handleProfileChange('firstName', e.target.value)}
                          error={errors.firstName}
                        />
                        <AuthInput
                          label={t('auth.lastName', 'Last Name')}
                          value={profileData.lastName}
                          onChange={(e) => handleProfileChange('lastName', e.target.value)}
                          error={errors.lastName}
                        />
                      </div>

                      {/* Email (read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                          {t('auth.email', 'Email')}
                        </label>
                        <div className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-500">
                          {user?.email || user?.primaryEmailAddress?.emailAddress}
                        </div>
                      </div>

                      {/* Role */}
                      <AuthSelect
                        label={t('auth.role', 'Current Role')}
                        value={profileData.role}
                        onChange={(value) => handleProfileChange('role', value)}
                        options={roleOptions}
                        error={errors.role}
                      />

                      {/* Country */}
                      <AuthSelect
                        label={t('auth.country', 'Country')}
                        value={countryCode}
                        onChange={handleCountryChange}
                        options={countryOptions}
                      />

                      {/* Language (instant change) */}
                      <AuthSelect
                        label={t('auth.preferredLanguage', 'Preferred Language')}
                        value={currentLanguage}
                        onChange={handleLanguageChange}
                        options={languageOptions}
                      />

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className={cn(
                          'w-full py-3 px-4 rounded-lg text-sm font-semibold',
                          'bg-purple-600 text-white',
                          'transition-all duration-200',
                          'hover:bg-purple-700',
                          'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {isUpdatingProfile ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t('common.saving', 'Saving...')}
                          </span>
                        ) : (
                          t('account.profile.save', 'Save Changes')
                        )}
                      </button>
                    </form>

                    {/* Phone Verification Section */}
                    <div className="mt-6 pt-6 border-t border-zinc-100">
                      <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                        {t('account.profile.phone', 'Phone Number')}
                      </h3>
                      <p className="text-sm text-zinc-500 mb-4">
                        {t('account.profile.phoneDescription', 'Verify your phone number to claim free interview credits.')}
                      </p>
                      <PhoneVerificationCard className="w-full" />
                    </div>

                    {/* Danger Zone (nested in Profile) */}
                    <div className="mt-8 pt-6 border-t border-zinc-100">
                      <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                        {t('account.danger.title', 'Delete Account')}
                      </h3>
                      <p className="text-sm text-zinc-500 mb-4">
                        {t('account.danger.warning', 'This action is permanent and cannot be undone. All your data will be permanently deleted.')}
                      </p>

                      {/* Error Message */}
                      {deleteError && (
                        <div className="mb-4 p-3 bg-zinc-50 border-l-4 border-black rounded-r">
                          <p className="text-sm text-zinc-700">{deleteError}</p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                            {t('account.danger.confirmLabel', 'Type DELETE to confirm')}
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => {
                              setDeleteConfirmation(e.target.value);
                              setDeleteError(null);
                            }}
                            placeholder="DELETE"
                            className={cn(
                              'w-full px-4 py-3 bg-white border rounded-lg text-sm text-zinc-900',
                              'transition-all duration-200 outline-none',
                              'border-zinc-200 focus:border-zinc-900'
                            )}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount || deleteConfirmation !== 'DELETE'}
                          className={cn(
                            'w-full py-3 px-4 rounded-lg text-sm font-bold',
                            'bg-white text-zinc-900 border-2 border-zinc-900',
                            'transition-all duration-200',
                            'hover:bg-zinc-100',
                            'focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                          )}
                        >
                          {isDeletingAccount ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                              {t('account.danger.deleting', 'Deleting...')}
                            </span>
                          ) : (
                            t('account.danger.deleteButton', 'Permanently Delete Account')
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Connected Accounts Section */}
              {activeSection === 'connections' && (
                <motion.div
                  key="connections"
                  variants={fadeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <ConnectedAccountsSection />
                </motion.div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <motion.div
                  key="security"
                  variants={fadeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-zinc-900 mb-6">
                      {t('account.security.title', 'Reset Password')}
                    </h2>

                    {/* Success/Error Messages */}
                    {passwordSuccess && (
                      <div className="mb-4 p-3 bg-purple-50 border-l-4 border-purple-600 rounded-r">
                        <p className="text-sm text-purple-700">{passwordSuccess}</p>
                      </div>
                    )}
                    {passwordError && (
                      <div className="mb-4 p-3 bg-zinc-50 border-l-4 border-black rounded-r">
                        <p className="text-sm text-zinc-700">{passwordError}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <p className="text-sm text-zinc-600">
                        {t('account.security.resetDescription', 'We will email you a secure link to complete your password change.')}
                      </p>
                      <button
                        type="button"
                        onClick={handleSendPasswordReset}
                        disabled={isSendingResetEmail}
                        className={cn(
                          'w-full py-3 px-4 rounded-lg text-sm font-semibold',
                          'bg-zinc-900 text-white',
                          'transition-all duration-200',
                          'hover:bg-zinc-800',
                          'focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {isSendingResetEmail ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t('account.security.sendingReset', 'Sending...')}
                          </span>
                        ) : (
                          t('account.security.sendResetLink', 'Send reset link')
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Credits Purchase Section */}
              {activeSection === 'creditsPurchase' && (
                <motion.div
                  key="creditsPurchase"
                  variants={fadeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <CreditsPurchaseSection />
                </motion.div>
              )}

              {/* Billing History Section */}
              {activeSection === 'billingHistory' && (
                <motion.div
                  key="billingHistory"
                  variants={fadeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  <BillingHistorySection />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDashboard;
