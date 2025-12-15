'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { DefaultLayout } from 'components/default-layout'
import { Check, X, Clock, Loader2, RefreshCw, Coins, ArrowRight, Plus, Wallet } from 'lucide-react'
import PurpleButton from 'components/ui/purple-button'
import apiService from 'services/APIService'
import { useUserContext } from 'contexts/UserContext'

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

// Credit packages for reference (matching backend)
const CREDIT_PACKAGES: Record<string, { credits: number; name: string }> = {
  starter: { credits: 5, name: 'Starter' },
  intermediate: { credits: 10, name: 'Intermediate' },
  professional: { credits: 15, name: 'Professional' }
}

export default function PaymentResult() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoaded } = useUser()
  const { onCreditsPurchased, invalidateCache, userCredits } = useUserContext()
  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({})
  const [creditsVerified, setCreditsVerified] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pollAttempts, setPollAttempts] = useState(0)
  const [isPopup, setIsPopup] = useState(false)
  
  // Credit tracking
  const [previousCredits, setPreviousCredits] = useState<number | null>(null)
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0)
  const [currentCredits, setCurrentCredits] = useState<number>(0)
  const initialCreditsRef = useRef<number | null>(null)
  
  // Auto-redirect countdown
  const [countdown, setCountdown] = useState(10)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Parse external_reference to get package info
  const getPackageFromReference = useCallback((externalReference: string | undefined): { credits: number; name: string } | null => {
    if (!externalReference) return null
    try {
      const parsed = JSON.parse(externalReference)
      if (parsed.packageId && CREDIT_PACKAGES[parsed.packageId]) {
        return CREDIT_PACKAGES[parsed.packageId]
      }
      if (parsed.credits) {
        return { credits: parsed.credits, name: 'Credits' }
      }
    } catch {
      // Not JSON, try to match package ID directly
      if (CREDIT_PACKAGES[externalReference]) {
        return CREDIT_PACKAGES[externalReference]
      }
    }
    return null
  }, [])

  // Check if we're in a popup and handle redirect to opener
  useEffect(() => {
    const isInPopup = window.opener !== null && window.opener !== window
    setIsPopup(isInPopup)

    if (isInPopup) {
      console.log('📦 Payment result loaded in popup, will redirect opener...')
      const currentUrl = window.location.href
      
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.location.href = currentUrl
          setTimeout(() => {
            window.close()
          }, 500)
        }
      } catch (e) {
        console.warn('Could not access opener window:', e)
        setTimeout(() => {
          window.close()
        }, 2000)
      }
    }
  }, [])

  // Store initial credits when component mounts
  useEffect(() => {
    if (userCredits !== null && initialCreditsRef.current === null) {
      // This is the total AFTER purchase (webhook already processed)
      // We'll calculate previous credits once we know the package
      initialCreditsRef.current = userCredits
      setCurrentCredits(userCredits)
    }
  }, [userCredits])

  // Poll for credits update from backend PostgreSQL
  const pollForCredits = useCallback(async () => {
    if (!user || creditsVerified) return

    try {
      setIsRefreshing(true)
      
      const result = await apiService.getCurrentUser(user.id)
      const fetchedCredits = result.user?.credits || 0
      
      console.log(`Polling credits from backend: attempt ${pollAttempts + 1}, credits: ${fetchedCredits}`)
      
      setCurrentCredits(fetchedCredits)
      
      // If we have package info, calculate previous credits
      const pkg = getPackageFromReference(paymentDetails.external_reference)
      if (pkg && fetchedCredits > 0) {
        const calculatedPrevious = fetchedCredits - pkg.credits
        setPreviousCredits(Math.max(0, calculatedPrevious))
        setPurchasedCredits(pkg.credits)
        setCreditsVerified(true)
        console.log('✅ Credits verified:', {
          previous: calculatedPrevious,
          purchased: pkg.credits,
          total: fetchedCredits
        })
        invalidateCache()
        apiService.invalidatePaymentCaches(user.id)
        await onCreditsPurchased()
      } else if (fetchedCredits > 0) {
        // Fallback: credits exist but no package info
        setCreditsVerified(true)
        invalidateCache()
        await onCreditsPurchased()
      }
      
      setPollAttempts(prev => prev + 1)
    } catch (error) {
      console.error('Error polling credits from backend:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [user, creditsVerified, pollAttempts, invalidateCache, onCreditsPurchased, paymentDetails.external_reference, getPackageFromReference])

  // Auto-poll on success page
  useEffect(() => {
    if (status === 'success' && !creditsVerified && pollAttempts < 12) {
      const timer = setTimeout(pollForCredits, 2000)
      return () => clearTimeout(timer)
    }
  }, [status, creditsVerified, pollAttempts, pollForCredits])

  // Determine status and extract payment details from URL
  useEffect(() => {
    const path = location.pathname
    if (path.includes('/payment/success')) {
      setStatus('success')
    } else if (path.includes('/payment/failure')) {
      setStatus('failure')
    } else if (path.includes('/payment/pending')) {
      setStatus('pending')
    }

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

    // Extract purchased credits from external_reference
    const pkg = getPackageFromReference(details.external_reference)
    if (pkg) {
      setPurchasedCredits(pkg.credits)
    }

    console.log('Payment result:', {
      path,
      status: path.includes('/payment/success') ? 'success' : 
              path.includes('/payment/failure') ? 'failure' : 'pending',
      details,
      package: pkg
    })
  }, [location.pathname, searchParams, getPackageFromReference])

  // Auto-redirect countdown for success
  useEffect(() => {
    if (status === 'success' && creditsVerified) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
            }
            navigate('/')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [status, creditsVerified, navigate])

  const handleGoHome = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    navigate('/')
  }

  const handleTryAgain = () => {
    navigate('/credits')
  }

  const handleManualRefresh = async () => {
    await pollForCredits()
  }

  // If we're in a popup, show a brief message while redirecting
  if (isPopup) {
    return (
      <DefaultLayout className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
        <div className="page-container py-8 sm:py-12 flex items-center justify-center min-h-[60vh]">
          <div className="voxly-card max-w-md w-full text-center">
            <div className="flex flex-col items-center space-y-6">
              <div className="p-4 bg-purple-100 rounded-full">
                <Loader2 className="w-12 h-12 text-voxly-purple animate-spin" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Redirecting...
              </h1>
              <p className="text-gray-600">
                Payment completed! Returning to your browser...
              </p>
            </div>
          </div>
        </div>
      </DefaultLayout>
    )
  }

  return (
    <DefaultLayout className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="page-container py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          
          {/* Status Card */}
          <div className="voxly-card mb-6">
            <div className="flex flex-col items-center text-center space-y-6">
              
              {/* Status Icon */}
              {status === 'loading' && (
                <div className="p-5 bg-purple-100 rounded-full">
                  <Loader2 className="w-14 h-14 text-voxly-purple animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="p-5 bg-green-100 rounded-full">
                  <Check className="w-14 h-14 text-green-600" />
                </div>
              )}
              {status === 'failure' && (
                <div className="p-5 bg-red-100 rounded-full">
                  <X className="w-14 h-14 text-red-600" />
                </div>
              )}
              {status === 'pending' && (
                <div className="p-5 bg-amber-100 rounded-full">
                  <Clock className="w-14 h-14 text-amber-600" />
                </div>
              )}

              {/* Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {status === 'loading' && 'Processing...'}
                  {status === 'success' && 'Payment Successful!'}
                  {status === 'failure' && 'Payment Failed'}
                  {status === 'pending' && 'Payment Pending'}
                </h1>
                <p className="text-gray-600">
                  {status === 'loading' && 'Please wait while we verify your payment.'}
                  {status === 'success' && (creditsVerified 
                    ? 'Your credits have been added to your account.'
                    : 'Processing your payment... Credits will be added shortly.'
                  )}
                  {status === 'failure' && 'Your payment could not be processed. Please try again.'}
                  {status === 'pending' && 'Your payment is being processed. Credits will be added once confirmed.'}
                </p>
              </div>
            </div>
          </div>

          {/* Credits Breakdown (Success only) */}
          {status === 'success' && (
            <div className="voxly-card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-voxly-purple" />
                Credits Summary
              </h2>
              
              {creditsVerified ? (
                <div className="space-y-4">
                  {/* Credits Flow */}
                  <div className="flex items-center justify-between gap-2 p-4 bg-gray-50 rounded-xl">
                    {/* Previous Balance */}
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Wallet className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Previous</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-700">
                        {previousCredits ?? 0}
                      </p>
                    </div>
                    
                    {/* Plus Sign */}
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Plus className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    
                    {/* Purchased */}
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Coins className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-gray-500">Purchased</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        +{purchasedCredits}
                      </p>
                    </div>
                    
                    {/* Equals Sign */}
                    <div className="flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    {/* Total Balance */}
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Coins className="w-4 h-4 text-voxly-purple" />
                        <span className="text-xs text-gray-500">Total</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-voxly-purple">
                        {currentCredits}
                      </p>
                    </div>
                  </div>
                  
                  {/* Auto-redirect countdown */}
                  <div className="flex items-center justify-center gap-2 pt-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Redirecting to home in {countdown} seconds...</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <Loader2 className="w-8 h-8 text-voxly-purple animate-spin mb-3" />
                  <p className="text-sm text-gray-500">Verifying credits...</p>
                  {pollAttempts >= 12 && (
                    <button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="mt-3 flex items-center gap-2 text-sm text-voxly-purple hover:text-voxly-purple-dark transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>Refresh manually</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Reference */}
          {paymentDetails.payment_id && (
            <div className="voxly-card mb-6">
              <p className="text-xs text-gray-500 mb-1">Payment Reference</p>
              <p className="text-sm font-mono text-gray-700 break-all">
                {paymentDetails.payment_id}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <PurpleButton
                variant="gradient"
                size="lg"
                onClick={handleGoHome}
                className="w-full"
              >
                Go to Home
                <ArrowRight className="w-5 h-5 ml-2" />
              </PurpleButton>
            )}
            
            {status === 'failure' && (
              <>
                <PurpleButton
                  variant="gradient"
                  size="lg"
                  onClick={handleTryAgain}
                  className="w-full"
                >
                  Try Again
                  <RefreshCw className="w-5 h-5 ml-2" />
                </PurpleButton>
                <PurpleButton
                  variant="outline"
                  size="lg"
                  onClick={handleGoHome}
                  className="w-full"
                >
                  Go to Home
                </PurpleButton>
              </>
            )}
            
            {status === 'pending' && (
              <PurpleButton
                variant="gradient"
                size="lg"
                onClick={handleGoHome}
                className="w-full"
              >
                Go to Home
                <ArrowRight className="w-5 h-5 ml-2" />
              </PurpleButton>
            )}
          </div>

          {/* User info */}
          {isLoaded && user && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Logged in as {user.primaryEmailAddress?.emailAddress}
            </p>
          )}
        </div>
      </div>
    </DefaultLayout>
  )
}
