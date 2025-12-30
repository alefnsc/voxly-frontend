import React, { Component, ErrorInfo, ReactNode } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { Card } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    const { t } = this.props;
    
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500" aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t('errorBoundary.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {t('errorBoundary.message')}
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  {t('errorBoundary.technicalDetails')}
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="w-full sm:w-auto min-h-[44px]"
                aria-label={t('errorBoundary.returnHome')}
              >
                {t('errorBoundary.returnHome')}
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full sm:w-auto min-h-[44px]"
                aria-label={t('errorBoundary.refreshPage')}
              >
                {t('errorBoundary.refreshPage')}
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
