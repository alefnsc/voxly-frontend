'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from 'components/ui/button'
import { Checkbox } from 'components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from 'components/ui/dialog'

type CookiePreferences = {
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

const STORAGE_KEY = 'vocaid_cookie_preferences_v1'

function safeReadPreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>
    if (typeof parsed !== 'object' || parsed == null) return null
    if (parsed.necessary !== true) return null
    if (typeof parsed.analytics !== 'boolean') return null
    if (typeof parsed.marketing !== 'boolean') return null
    if (typeof parsed.updatedAt !== 'string') return null
    return {
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt: parsed.updatedAt
    }
  } catch {
    return null
  }
}

function safeWritePreferences(prefs: Omit<CookiePreferences, 'updatedAt'>): void {
  try {
    const payload: CookiePreferences = {
      ...prefs,
      necessary: true,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export const CookieConsentBanner: React.FC = () => {
  const [isReady, setIsReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [hasChoice, setHasChoice] = useState(false)

  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = safeReadPreferences()
    if (existing) {
      setHasChoice(true)
      setAnalytics(existing.analytics)
      setMarketing(existing.marketing)
    }
    setIsReady(true)
  }, [])

  const bannerVisible = isReady && !hasChoice

  const currentPrefs = useMemo(
    () => ({
      necessary: true as const,
      analytics,
      marketing
    }),
    [analytics, marketing]
  )

  const acceptAll = () => {
    safeWritePreferences({ necessary: true, analytics: true, marketing: true })
    setAnalytics(true)
    setMarketing(true)
    setHasChoice(true)
    setIsOpen(false)
  }

  const rejectNonEssential = () => {
    safeWritePreferences({ necessary: true, analytics: false, marketing: false })
    setAnalytics(false)
    setMarketing(false)
    setHasChoice(true)
    setIsOpen(false)
  }

  const savePreferences = () => {
    safeWritePreferences(currentPrefs)
    setHasChoice(true)
    setIsOpen(false)
  }

  if (!bannerVisible) return null

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-700">
            <p className="font-medium text-zinc-900">We use cookies</p>
            <p className="mt-1">
              We use necessary cookies to make our site work. We’d also like to set optional cookies to help us improve
              your experience and for marketing.
              <a href="/privacy-policy" className="ml-1 underline underline-offset-2">
                Learn more
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button onClick={acceptAll} className="sm:whitespace-nowrap">
              Accept all
            </Button>
            <Button variant="outline" onClick={rejectNonEssential} className="sm:whitespace-nowrap">
              Reject non-essential
            </Button>
            <Button variant="ghost" onClick={() => setIsOpen(true)} className="sm:whitespace-nowrap">
              Manage preferences
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">Cookie preferences</DialogTitle>
            <DialogDescription className="text-zinc-600 mt-2">
              You can choose which optional cookies we use. Necessary cookies are always on.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4">
              <Checkbox checked disabled aria-readonly />
              <div className="flex-1">
                <div className="font-medium text-zinc-900">Necessary</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Required for core functionality, security, and to keep you signed in.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4">
              <Checkbox
                checked={analytics}
                onCheckedChange={(v) => setAnalytics(Boolean(v))}
                aria-label="Toggle analytics cookies"
              />
              <div className="flex-1">
                <div className="font-medium text-zinc-900">Analytics</div>
                <div className="mt-1 text-sm text-zinc-600">Helps us understand how the product is used.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4">
              <Checkbox
                checked={marketing}
                onCheckedChange={(v) => setMarketing(Boolean(v))}
                aria-label="Toggle marketing cookies"
              />
              <div className="flex-1">
                <div className="font-medium text-zinc-900">Marketing</div>
                <div className="mt-1 text-sm text-zinc-600">Used to deliver and measure relevant advertising.</div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={rejectNonEssential}>
              Reject non-essential
            </Button>
            <Button variant="secondary" onClick={acceptAll}>
              Accept all
            </Button>
            <Button onClick={savePreferences}>Save preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CookieConsentBanner
