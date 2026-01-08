/**
 * Phone Input Component
 * 
 * International phone input with country selector, formatting, and validation.
 * Reuses phone utilities from lib/phone.ts.
 * 
 * @module components/ui/phone-input
 */

'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search, Phone } from 'lucide-react'
import { Input } from './input'
import {
  getAllCountriesWithCallingCodes,
  getCountryDisplayName,
  formatAsYouType,
  normalizeToE164,
  validatePhone,
  getDefaultCountry,
  getPlaceholder,
  type CountryOption,
  type CountryCode,
} from 'lib/phone'

interface PhoneInputProps {
  value: string
  onChange: (value: string, e164?: string, isValid?: boolean) => void
  disabled?: boolean
  error?: string
  preferredCountry?: string
  detectedCountry?: string
  className?: string
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  preferredCountry,
  detectedCountry,
  className = '',
}) => {
  const { i18n } = useTranslation()
  
  // Country list
  const allCountries = useMemo(
    () => getAllCountriesWithCallingCodes(i18n.language),
    [i18n.language]
  )
  
  // State
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() =>
    getDefaultCountry(preferredCountry, detectedCountry)
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  
  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return allCountries
    const search = countrySearch.toLowerCase()
    return allCountries.filter((c) => {
      const displayName = getCountryDisplayName(i18n.language, c.iso2).toLowerCase()
      return (
        displayName.includes(search) ||
        c.iso2.toLowerCase().includes(search) ||
        `+${c.dialCode}`.includes(search)
      )
    })
  }, [allCountries, countrySearch, i18n.language])
  
  // Selected country info
  const selectedCountryInfo = useMemo(
    () => allCountries.find((c) => c.iso2 === selectedCountry) || allCountries[0],
    [allCountries, selectedCountry]
  )
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setCountrySearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Focus search when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isDropdownOpen])
  
  // Handle phone input change
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      
      // If starts with +, allow international
      if (raw.startsWith('+')) {
        onChange(raw, normalizeToE164(raw), validatePhone(raw).isValid)
      } else {
        const formatted = formatAsYouType(raw, selectedCountry)
        const e164 = normalizeToE164(formatted, selectedCountry)
        const validation = validatePhone(formatted, selectedCountry)
        onChange(formatted, e164, validation.isValid)
      }
    },
    [selectedCountry, onChange]
  )
  
  // Handle country selection
  const handleCountrySelect = useCallback((country: CountryOption) => {
    setSelectedCountry(country.iso2)
    setIsDropdownOpen(false)
    setCountrySearch('')
    // Clear and reformat with new country
    onChange('', undefined, false)
  }, [onChange])
  
  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country selector */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 h-10 px-3 border border-r-0 border-zinc-300 rounded-l-lg bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-base">{selectedCountryInfo.flag}</span>
            <span className="text-sm text-zinc-600">+{selectedCountryInfo.dialCode}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-50 top-full left-0 mt-1 w-64 max-h-60 overflow-auto bg-white border border-zinc-200 rounded-lg shadow-lg">
              {/* Search */}
              <div className="sticky top-0 p-2 bg-white border-b border-zinc-100">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              {/* Country list */}
              <div className="py-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.iso2}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                      country.iso2 === selectedCountry ? 'bg-purple-50 text-purple-700' : 'text-zinc-700'
                    }`}
                  >
                    <span>{country.flag}</span>
                    <span className="flex-1 text-left truncate">{country.name}</span>
                    <span className="text-zinc-400">+{country.dialCode}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-2 text-sm text-zinc-500">No countries found</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Phone input */}
        <Input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          disabled={disabled}
          placeholder={getPlaceholder(selectedCountry)}
          className={`rounded-l-none flex-1 h-10 px-3 py-2 ${error ? 'border-red-300' : ''}`}
          icon={<Phone className="w-4 h-4 text-zinc-400" />}
        />
      </div>
      
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default PhoneInput
