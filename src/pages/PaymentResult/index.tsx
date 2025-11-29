'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { DefaultLayout } from 'components/default-layout'
import { Button } from 'components/ui/button'
import { Check, X, Clock, Loader2 } from 'lucide-react'

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

  const getStatusContent = () => {
    switch (status) {
      case 'success':
        return {
          icon: <Check className="w-16 h-16 text-green-500" />,
          title: 'Payment Successful!',
          message: 'Your credits have been added to your account. You can now start your interview practice.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        }
      case 'failure':
        return {
          icon: <X className="w-16 h-16 text-red-500" />,
          title: 'Payment Failed',
          message: 'Unfortunately, your payment could not be processed. Please try again or use a different payment method.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        }
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-amber-500" />,
          title: 'Payment Pending',
          message: 'Your payment is being processed. Credits will be added to your account once the payment is confirmed.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        }
      default:
        return {
          icon: <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />,
          title: 'Processing...',
          message: 'Please wait while we verify your payment.',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800'
        }
    }
  }

  const content = getStatusContent()

  return (
    <DefaultLayout className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className={`max-w-md w-full mx-4 p-8 rounded-2xl border-2 ${content.bgColor} ${content.borderColor} shadow-lg`}>
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className="p-4 rounded-full bg-white shadow-md">
            {content.icon}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold ${content.textColor}`}>
            {content.title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 leading-relaxed">
            {content.message}
          </p>

          {/* Payment Details (for debugging, can be removed in production) */}
          {paymentDetails.payment_id && (
            <div className="w-full p-4 bg-white rounded-lg border border-gray-200 text-left">
              <p className="text-sm text-gray-500 mb-2">Payment Reference:</p>
              <p className="text-sm font-mono text-gray-700 break-all">
                {paymentDetails.payment_id}
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleGoHome}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {status === 'failure' ? 'Try Again' : 'Go to Home'}
          </Button>

          {/* User info */}
          {isLoaded && user && (
            <p className="text-xs text-gray-400">
              Logged in as {user.primaryEmailAddress?.emailAddress}
            </p>
          )}
        </div>
      </div>
    </DefaultLayout>
  )
}
