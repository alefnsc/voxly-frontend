/**
 * Connected Accounts Component
 * 
 * Displays connected OAuth provider accounts with connect/disconnect functionality.
 * Shows status for Google, Microsoft, X, and LinkedIn.
 * 
 * @module components/account/ConnectedAccounts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { cn } from 'lib/utils';
import apiService, { ConnectedAccounts as ConnectedAccountsType, ProviderConnection } from 'services/APIService';

// Provider configuration
interface ProviderConfig {
  key: 'google' | 'microsoft' | 'x' | 'linkedin';
  name: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
}

// Provider icons (inline SVGs for simplicity)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF"/>
    <path d="M24 24H12.6V12.6H24V24z" fill="#FFB900"/>
    <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022"/>
    <path d="M24 11.4H12.6V0H24v11.4z" fill="#7FBA00"/>
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/>
  </svg>
);

const PROVIDERS: ProviderConfig[] = [
  {
    key: 'google',
    name: 'Google',
    icon: <GoogleIcon />,
    color: 'bg-white border-zinc-200',
    hoverColor: 'hover:bg-zinc-50',
  },
  {
    key: 'microsoft',
    name: 'Microsoft',
    icon: <MicrosoftIcon />,
    color: 'bg-white border-zinc-200',
    hoverColor: 'hover:bg-zinc-50',
  },
  {
    key: 'x',
    name: 'X',
    icon: <XIcon />,
    color: 'bg-white border-zinc-200',
    hoverColor: 'hover:bg-zinc-50',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: <LinkedInIcon />,
    color: 'bg-white border-zinc-200',
    hoverColor: 'hover:bg-zinc-50',
  },
];

interface ConnectedAccountsProps {
  className?: string;
}

export const ConnectedAccountsSection: React.FC<ConnectedAccountsProps> = ({ className }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [connections, setConnections] = useState<ConnectedAccountsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load connections on mount
  const loadConnections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getConnectedAccounts();
      setConnections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load connected accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Handle query params for connection success/error
  useEffect(() => {
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connected) {
      setSuccessMessage(t('account.connections.connectedSuccess', { provider: connected }));
      // Remove query param
      searchParams.delete('connected');
      setSearchParams(searchParams, { replace: true });
      // Refresh connections
      loadConnections();
    }

    if (errorParam) {
      if (errorParam.includes('already_linked')) {
        const provider = errorParam.replace('_already_linked', '');
        setError(t('account.connections.alreadyLinked', { provider }));
      } else {
        setError(t('account.connections.connectionFailed'));
      }
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, loadConnections, t]);

  // Clear messages after delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle connect
  const handleConnect = (provider: ProviderConfig['key']) => {
    apiService.startProviderConnect(provider);
  };

  // Handle disconnect
  const handleDisconnect = async (provider: ProviderConfig['key']) => {
    if (confirmDisconnect !== provider) {
      setConfirmDisconnect(provider);
      return;
    }

    try {
      setDisconnecting(provider);
      setError(null);
      await apiService.disconnectProvider(provider);
      setSuccessMessage(t('account.connections.disconnectedSuccess', { provider }));
      setConfirmDisconnect(null);
      await loadConnections();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect provider');
    } finally {
      setDisconnecting(null);
    }
  };

  // Cancel disconnect confirmation
  const cancelDisconnect = () => {
    setConfirmDisconnect(null);
  };

  // Get display label for connection
  const getConnectionLabel = (provider: ProviderConfig['key'], connection: ProviderConnection): string => {
    if (!connection.connected) return '';
    
    switch (provider) {
      case 'x':
        return connection.username ? `@${connection.username}` : connection.name || '';
      case 'linkedin':
        return connection.name || connection.email || '';
      default:
        return connection.email || connection.name || '';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white border border-zinc-200 rounded-xl p-6', className)}>
        <h2 className="text-xl font-bold text-zinc-900 mb-6">
          {t('account.connections.title', 'Connected Accounts')}
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white border border-zinc-200 rounded-xl p-6', className)}>
      <h2 className="text-xl font-bold text-zinc-900 mb-2">
        {t('account.connections.title', 'Connected Accounts')}
      </h2>
      <p className="text-sm text-zinc-500 mb-6">
        {t('account.connections.description', 'Manage your connected sign-in methods')}
      </p>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-purple-50 border-l-4 border-purple-600 rounded-r">
          <p className="text-sm text-purple-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-zinc-50 border-l-4 border-red-500 rounded-r">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Provider List */}
      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const connection = connections?.[provider.key];
          const isConnected = connection?.connected ?? false;
          const isConfirming = confirmDisconnect === provider.key;
          const isDisconnecting = disconnecting === provider.key;
          const label = connection ? getConnectionLabel(provider.key, connection) : '';

          return (
            <div
              key={provider.key}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-all',
                provider.color,
                provider.hoverColor
              )}
            >
              {/* Provider Info */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{provider.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">{provider.name}</span>
                    {isConnected ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        {t('account.connections.connected', 'Connected')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-500 rounded-full">
                        {t('account.connections.notConnected', 'Not connected')}
                      </span>
                    )}
                  </div>
                  {isConnected && label && (
                    <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  isConfirming ? (
                    <>
                      <button
                        onClick={cancelDisconnect}
                        disabled={isDisconnecting}
                        className="px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                      <button
                        onClick={() => handleDisconnect(provider.key)}
                        disabled={isDisconnecting}
                        className={cn(
                          'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
                          'bg-red-600 text-white hover:bg-red-700',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {isDisconnecting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t('common.removing', 'Removing...')}
                          </span>
                        ) : (
                          t('common.confirmRemove', 'Confirm Remove')
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDisconnect(provider.key)}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
                        'border border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                      )}
                    >
                      {t('account.connections.remove', 'Remove')}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleConnect(provider.key)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
                      'bg-purple-600 text-white hover:bg-purple-700'
                    )}
                  >
                    {t('account.connections.connect', 'Connect')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Note */}
      <p className="mt-6 text-xs text-zinc-400">
        {t('account.connections.securityNote', 'You must have at least one connected sign-in method to access your account.')}
      </p>
    </div>
  );
};

export default ConnectedAccountsSection;
