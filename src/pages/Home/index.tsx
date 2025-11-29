'use client'

import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DefaultLayout } from 'components/default-layout'
import { Separator } from 'components/ui/separator'
import { useMediaQuery } from '@mantine/hooks'
import { useAuthCheck } from 'hooks/use-auth-check'
import Loading from 'components/loading'

// Lazy load components for better initial load performance
const BodyCopy = lazy(() => import('components/body-copy'))
const InputForm = lazy(() => import('components/input-form'))

export default function Home() {
  const isMobile = useMediaQuery('only screen and (max-width: 768px)')
  const location = useLocation()
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)
  
  const {
    isLoading,
    userCredits,
  } = useAuthCheck();

  // Check for navigation state (e.g., from incompatibility redirect)
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type || 'info'
      })
      
      // Clear the state to prevent showing on refresh
      window.history.replaceState({}, document.title)
      
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setNotification(null)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [location.state])

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <DefaultLayout className="flex flex-col overflow-hidden items-center bg-white">
        {/* Notification banner for incompatibility or other messages */}
        {notification && (
          <div className={`w-full max-w-4xl mx-auto mt-4 px-4 sm:px-6 lg:px-8`}>
            <div className={`
              p-4 rounded-lg border shadow-sm
              ${notification.type === 'incompatibility' 
                ? 'bg-purple-50 border-purple-200 text-purple-800' 
                : notification.type === 'early_interruption'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'}
            `}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {notification.type === 'incompatibility' ? (
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : notification.type === 'early_interruption' ? (
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                </div>
                <button 
                  onClick={() => setNotification(null)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="lg:mt-10 relative flex flex-col md:flex-row lg:flex-row xl:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Show image above text on mobile, to the right on desktop */}
          {isMobile && (
            <div className="flex flex-col w-full items-center mb-6">
              <img
                src='/Main.png'
                alt="Interview"
                className="rounded-3xl w-[60%] max-w-[300px] shadow-inner-2xl"
              />
            </div>
          )}

          <Suspense fallback={<div className="h-40 flex items-center justify-center text-gray-600">Loading content...</div>}>
            <BodyCopy isMobile={Boolean(isMobile)} />
          </Suspense>

          {!isMobile && (
            <div className="flex flex-col h-full overflow-hidden w-full md:w-[45%] items-end">
              <img
                src='/Main.png'
                alt="Interview"
                className="flex rounded-3xl w-[80%] shadow-inner-2xl"
              />
            </div>
          )}
        </div>
      </DefaultLayout>
      <Separator />
      <div id="form" className="relative flex flex-col w-full items-center justify-center m-auto py-20 bg-gray-50">
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-gray-600">Loading form...</div>}>
          <InputForm isMobile={Boolean(isMobile)} credits={userCredits} />
        </Suspense>
      </div>
    </>
  )
}