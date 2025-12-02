 'use client'

import { lazy, Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { DefaultLayout } from 'components/default-layout'
import Loading from 'components/loading'
import PurpleButton from 'components/ui/purple-button'
import { Coins, Receipt, CreditCard, ArrowLeft, Calendar, Package, CheckCircle, Clock, XCircle, Sparkles, ChevronDown, Mic } from 'lucide-react'
import { useAuthCheck } from 'hooks/use-auth-check'
import apiService, { PaymentHistoryItem, InterviewSummary } from 'services/APIService'
import ContactButton from 'components/contact-button'

// Lazy load credit packages
const CreditPackages = lazy(() => import('components/credit-packages'))

interface ConsumptionDay {
  date: string
  displayDate: string
  interviews: InterviewSummary[]
  totalCredits: number
}

const getStatusIcon = (status: string) => {
  const upperStatus = status.toUpperCase()
  switch (upperStatus) {
    case 'APPROVED':
      return <CheckCircle className="w-4 h-4 text-purple-500" />
    case 'PENDING':
    case 'IN_PROCESS':
      return <Clock className="w-4 h-4 text-amber-500" />
    case 'REJECTED':
    case 'CANCELLED':
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  const upperStatus = status.toUpperCase()
  switch (upperStatus) {
    case 'APPROVED':
      return 'bg-purple-100 text-purple-700'
    case 'PENDING':
    case 'IN_PROCESS':
      return 'bg-amber-100 text-amber-700'
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  })
}

export default function Credits() {
  const navigate = useNavigate()
  const { user, isSignedIn, isLoaded } = useUser()
  const { userCredits, isLoading: authLoading } = useAuthCheck()
  const buyCreditsRef = useRef<HTMLDivElement>(null)
  
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([])
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionDay[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [isLoadingConsumption, setIsLoadingConsumption] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalCreditsPurchased, setTotalCreditsPurchased] = useState(0)
  const [totalCreditsUsed, setTotalCreditsUsed] = useState(0)

  const scrollToBuyCredits = () => {
    buyCreditsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fetchPaymentHistory = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoadingPayments(true)
    try {
      const result = await apiService.getPaymentHistory(user.id)
      if (result && result.length > 0) {
        setPayments(result)
        // Calculate totals from approved payments
        const approved = result.filter((p) => p.status.toUpperCase() === 'APPROVED')
        setTotalSpent(approved.reduce((sum, p) => sum + p.amountUSD, 0))
        setTotalCreditsPurchased(approved.reduce((sum, p) => sum + p.creditsAmount, 0))
      }
    } catch (err) {
      console.error('Failed to fetch payment history:', err)
    } finally {
      setIsLoadingPayments(false)
    }
  }, [user?.id])

  const fetchConsumptionHistory = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoadingConsumption(true)
    try {
      const result = await apiService.getUserInterviews(user.id, 1, 50)
      if (result.interviews && result.interviews.length > 0) {
        // Group interviews by date
        const grouped: { [key: string]: InterviewSummary[] } = {}
        result.interviews.forEach((interview) => {
          const date = new Date(interview.createdAt).toDateString()
          if (!grouped[date]) {
            grouped[date] = []
          }
          grouped[date].push(interview)
        })
        
        // Convert to array and sort by date descending
        const consumptionDays: ConsumptionDay[] = Object.entries(grouped)
          .map(([date, interviews]) => ({
            date,
            displayDate: formatDateShort(date),
            interviews,
            totalCredits: interviews.length // 1 credit per interview
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        setConsumptionHistory(consumptionDays)
        setTotalCreditsUsed(result.interviews.length)
      }
    } catch (err) {
      console.error('Failed to fetch consumption history:', err)
    } finally {
      setIsLoadingConsumption(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchPaymentHistory()
      fetchConsumptionHistory()
    }
  }, [isSignedIn, user?.id, fetchPaymentHistory, fetchConsumptionHistory])

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/')
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded || authLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading />
        </div>
      </DefaultLayout>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50">
      <div className="page-container py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Credits & <span className="text-voxly-purple">Billing</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your credits and view your payment history
            </p>
          </div>
          
          {/* Buy Credits CTA Button */}
          <PurpleButton
            variant="primary"
            size="lg"
            onClick={scrollToBuyCredits}
            className="w-full sm:w-auto"
          >
            <Sparkles className="w-5 h-5" />
            Buy More Credits
            <ChevronDown className="w-4 h-4" />
          </PurpleButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Balance</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{userCredits}</p>
            </div>
          </div>

          <div className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Purchased</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalCreditsPurchased}</p>
            </div>
          </div>

          <div className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Used</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalCreditsUsed}</p>
            </div>
          </div>

          <div className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Spent</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">${totalSpent.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* History Sections - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Payment History Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Receipt className="w-5 h-5 text-voxly-purple" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment History</h2>
            </div>
            
            <div className="voxly-card max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {isLoadingPayments ? (
                <div className="flex items-center justify-center py-12">
                  <Loading />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No payment history yet</p>
                  <p className="text-sm text-gray-400">
                    Purchase credits to see your transaction history
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <div key={payment.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {payment.packageName}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5" />
                              {payment.creditsAmount} credits
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(payment.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${payment.amountUSD.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            R$ {payment.amountBRL.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Consumption History Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Mic className="w-5 h-5 text-voxly-purple" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Credit Usage</h2>
            </div>
            
            <div className="voxly-card max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {isLoadingConsumption ? (
                <div className="flex items-center justify-center py-12">
                  <Loading />
                </div>
              ) : consumptionHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No interviews yet</p>
                  <p className="text-sm text-gray-400">
                    Complete interviews to see your usage history
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consumptionHistory.map((day) => (
                    <div key={day.date} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-gray-900">{day.displayDate}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          <Coins className="w-3 h-3" />
                          {day.totalCredits} credit{day.totalCredits !== 1 ? 's' : ''} used
                        </span>
                      </div>
                      <div className="pl-6 space-y-1">
                        {day.interviews.map((interview) => (
                          <div key={interview.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 truncate max-w-[200px]">
                              {interview.position || 'Interview'}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {new Date(interview.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buy Credits Section */}
        <div ref={buyCreditsRef} className="scroll-mt-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CreditCard className="w-5 h-5 text-voxly-purple" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Buy Credits</h2>
          </div>
          <Suspense fallback={<Loading />}>
            <CreditPackages onPurchaseComplete={fetchPaymentHistory} />
          </Suspense>
        </div>
      </div>
      
      {/* Contact Button */}
      <ContactButton />
    </DefaultLayout>
  )
}
