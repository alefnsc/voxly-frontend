/**
 * Access Denied Page
 * 
 * Shown when a user tries to access a route they don't have permission for.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import PurpleButton from 'components/ui/purple-button';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('accessDenied.title', 'Access Denied')}
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          {t('accessDenied.description', "You don't have permission to access this page. This area is restricted to specific user roles.")}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <PurpleButton
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.goBack', 'Go Back')}
          </PurpleButton>
          
          <PurpleButton
            variant="primary"
            onClick={() => navigate('/app/b2c/dashboard')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('common.goHome', 'Go Home')}
          </PurpleButton>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
