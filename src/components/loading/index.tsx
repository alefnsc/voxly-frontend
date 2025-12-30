import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icons } from 'components/icons'

interface LoadingProps {
    message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message }) => {
    const { t } = useTranslation();
    const displayMessage = message || t('common.loading');
    
    return (
        <div 
            className="h-screen flex w-screen items-center justify-center bg-white"
            role="status"
            aria-live="polite"
            aria-label={displayMessage}
        >
            <div className="flex gap-x-2 items-center">
                {/* eslint-disable-next-line react/jsx-pascal-case */}
                <Icons.loader className="animate-spin h-6 w-6 text-gray-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-600">
                    {displayMessage}
                </span>
            </div>
        </div>
    )
}

export default Loading
