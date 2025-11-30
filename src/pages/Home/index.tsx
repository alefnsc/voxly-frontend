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
          <div className={`w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto mt-4 md:mt-6 lg:mt-8 px-4 sm:px-6 lg:px-8 xl:px-12`}>
            <div className={`
              p-4 md:p-5 lg:p-6 rounded-lg lg:rounded-xl border shadow-sm
              ${notification.type === 'incompatibility' 
                ? 'bg-purple-50 border-purple-200 text-purple-800' 
                : notification.type === 'early_interruption'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'}
            `}>
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0">
                  {notification.type === 'incompatibility' ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : notification.type === 'early_interruption' ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-base lg:text-lg font-medium">{notification.message}</p>
                </div>
                <button 
                  onClick={() => setNotification(null)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main hero section with improved spacing and sizing */}
        <div className="
          mt-8 md:mt-12 lg:mt-16 xl:mt-20 2xl:mt-24
          relative flex flex-col md:flex-row items-center justify-center
          gap-8 md:gap-10 lg:gap-16 xl:gap-24 2xl:gap-32
          w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl
          px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16
          pb-8 md:pb-12 lg:pb-16
        ">
          {/* Show image above text on mobile, to the right on desktop */}
          {isMobile && (
            <div className="flex flex-col w-full items-center mb-4">
              <img
                src='/Main.png'
                alt="Voxly AI Interview"
                className="w-[80%] max-w-[380px] drop-shadow-[0_20px_40px_rgba(147,51,234,0.35)]"
              />
            </div>
          )}

          <Suspense fallback={<div className="h-40 lg:h-60 flex items-center justify-center text-gray-600">Loading content...</div>}>
            <BodyCopy isMobile={Boolean(isMobile)} />
          </Suspense>

          {!isMobile && (
            <div className="flex flex-col h-full overflow-hidden w-full md:w-[50%] lg:w-[45%] items-center justify-center">
              <img
                src='/Main.png'
                alt="Voxly AI Interview"
                className="
                  w-[95%] md:w-full lg:w-full xl:w-full
                  max-w-[450px] lg:max-w-[520px] xl:max-w-[580px] 2xl:max-w-[650px]
                  drop-shadow-[0_25px_50px_rgba(147,51,234,0.4)]
                "
              />
            </div>
          )}
        </div>
      </DefaultLayout>
      <Separator className="my-0" />
      <div id="form" className="
        relative flex flex-col w-full items-center justify-center m-auto
        py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28
        bg-gray-50
      ">
        <Suspense fallback={<div className="h-40 lg:h-60 flex items-center justify-center text-gray-600">Loading form...</div>}>
          <InputForm isMobile={Boolean(isMobile)} credits={userCredits} />
        </Suspense>
      </div>
    </>
  )
}