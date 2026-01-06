'use client'

import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthCheck } from 'hooks/use-auth-check'
import { useUser } from 'contexts/AuthContext'
import Loading from 'components/loading'
import Landing from 'pages/Landing'

/**
 * Home Page Component
 * 
 * This component serves as the root route handler:
 * - If user is signed in: redirects to /app/b2c/dashboard
 * - If user is not signed in: renders the Landing page
 */
export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn, isLoaded: isUserLoaded } = useUser()
  const { isLoading } = useAuthCheck()

  // Clear any navigation state messages (e.g., from incompatibility redirect)
  useEffect(() => {
    if (location.state?.message) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Redirect signed-in users to the B2C dashboard
  useEffect(() => {
    if (isUserLoaded && isSignedIn) {
      navigate('/app/b2c/dashboard', { replace: true })
    }
  }, [isUserLoaded, isSignedIn, navigate])

  // Show loading while checking auth state
  if (isLoading || !isUserLoaded) {
    return <Loading />
  }

  // Not signed in: show Landing page
  return <Landing />
}
