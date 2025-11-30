'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { DefaultLayout } from 'components/default-layout'
import { Button } from 'components/ui/button'
import { Check, X, Clock, Loader2, RefreshCw, Sparkles } from 'lucide-react'

type PaymentStatus = 'success' | 'failure' | 'pending' | 'loading'

interface PaymentDetails {
  collection_id?: string
  collection_status?: string
  payment_id?: string
  status?: string
  external_reference?: string
  payment_type?: string
  merchant_order_id?: string
  preference_id?: string
  site_id?: string
  processing_mode?: string
  merchant_account_id?: string
}

export default function PaymentResult() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoaded } = useUser()
  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({})
  const [creditsVerified, setCreditsVerified] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pollAttempts, setPollAttempts] = useState(0)

  // Poll for credits update
  const pollForCredits = useCallback(async () => {
    if (!user || creditsVerified) return

    try {
      setIsRefreshing(true)
      await user.reload()
      const currentCredits = (user.publicMetadata?.credits as number) || 0
      
      console.log(`Polling credits: attempt ${pollAttempts + 1}, credits: ${currentCredits}`)
      
      // If credits > 0, consider it verified (webhook processed)
      if (currentCredits > 0) {
        setCreditsVerified(true)
        console.log('✅ Credits verified:', currentCredits)
      }
      
      setPollAttempts(prev => prev + 1)
    } catch (error) {
      console.error('Error polling credits:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [user, creditsVerified, pollAttempts])

  // Auto-poll on success page
  useEffect(() => {
    if (status === 'success' && !creditsVerified && pollAttempts < 12) {
      const timer = setTimeout(pollForCredits, 3000) // Poll every 3 seconds
      return () => clearTimeout(timer)
    }
  }, [status, creditsVerified, pollAttempts, pollForCredits])

  // Determine status from URL path
  useEffect(() => {
    const path = location.pathname
    if (path.includes('/payment/success')) {
      setStatus('success')
    } else if (path.includes('/payment/failure')) {
      setStatus('failure')
    } else if (path.includes('/payment/pending')) {
      setStatus('pending')
    }

    // Extract payment details from query params
    const details: PaymentDetails = {
      collection_id: searchParams.get('collection_id') || undefined,
      collection_status: searchParams.get('collection_status') || undefined,
      payment_id: searchParams.get('payment_id') || undefined,
      status: searchParams.get('status') || undefined,
      external_reference: searchParams.get('external_reference') || undefined,
      payment_type: searchParams.get('payment_type') || undefined,
      merchant_order_id: searchParams.get('merchant_order_id') || undefined,
      preference_id: searchParams.get('preference_id') || undefined,
      site_id: searchParams.get('site_id') || undefined,
      processing_mode: searchParams.get('processing_mode') || undefined,
      merchant_account_id: searchParams.get('merchant_account_id') || undefined,
    }
    setPaymentDetails(details)

    // Log for debugging
    console.log('Payment result:', {
      path,
      status: path.includes('/payment/success') ? 'success' : 
              path.includes('/payment/failure') ? 'failure' : 'pending',
      details
    })
  }, [location.pathname, searchParams])

  const handleGoHome = () => {
    navigate('/')
  }

  const handleManualRefresh = async () => {
    await pollForCredits()
  }

  const getStatusContent = () => {
    switch (status) {
      case 'success':
        return {
          icon: <Check className="w-16 h-16 text-emerald-600" />,
          title: 'Payment Successful!',
          message: creditsVerified 
            ? 'Your credits have been added to your account. You can now start your interview practice.'
            : 'Processing your payment... Credits will be added shortly.',
          containerBg: 'bg-white',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-900',
          iconBg: 'bg-emerald-100'
        }
      case 'failure':
        return {
          icon: <X className="w-16 h-16 text-red-600" />,
          title: 'Payment Failed',
          message: 'Unfortunately, your payment could not be processed. Please try again or use a different payment method.',
          containerBg: 'bg-white',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-900',
          iconBg: 'bg-red-100'
        }
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-amber-600" />,
          title: 'Payment Pending',
          message: 'Your payment is being processed. Credits will be added to your account once the payment is confirmed.',
          containerBg: 'bg-white',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-900',
          iconBg: 'bg-amber-100'
        }
      default:
        return {
          icon: <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />,
          title: 'Processing...',
          message: 'Please wait while we verify your payment.',
          containerBg: 'bg-white',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-900',
          iconBg: 'bg-purple-100'
        }
    }
  }

  const content = getStatusContent()
  const currentCredits = (user?.publicMetadata?.credits as number) || 0

  return (
    <DefaultLayout className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className={`max-w-md w-full mx-4 p-8 rounded-2xl border ${content.borderColor} ${content.containerBg} shadow-xl`}>
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className={`p-5 rounded-full ${content.iconBg}`}>
            {content.icon}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold ${content.titleColor}`}>
            {content.title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 leading-relaxed">
            {content.message}
          </p>

          {/* Credits Display (for success) */}
          {status === 'success' && (
            <div className="w-full p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-purple-700 font-medium">Your Credits</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {currentCredits}
              </p>
              {!creditsVerified && pollAttempts < 12 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-xs text-purple-600">Verifying credits...</span>
                </div>
              )}
              {!creditsVerified && pollAttempts >= 12 && (
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="flex items-center justify-center gap-2 mt-3 text-xs text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh credits</span>
                </button>
              )}
            </div>
          )}

          {/* Payment Reference */}
          {paymentDetails.payment_id && (
            <div className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-left">
              <p className="text-xs text-gray-500 mb-1">Payment Reference:</p>
              <p className="text-xs font-mono text-gray-700 break-all">
                {paymentDetails.payment_id}
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleGoHome}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
          >
            {status === 'failure' ? 'Try Again' : 'Go to Home'}
          </Button>

          {/* User info */}
          {isLoaded && user && (
            <p className="text-xs text-gray-500">
              Logged in as {user.primaryEmailAddress?.emailAddress}
            </p>
          )}
        </div>
      </div>
    </DefaultLayout>
  )
}
