'use client'

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, ValidationError } from '@formspree/react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { DefaultLayout } from 'components/default-layout'
import { CheckCircle, AlertCircle, Loader2, Mail, Clock, HelpCircle, Send } from 'lucide-react'

const FORMSPREE_FORM_ID = process.env.REACT_APP_FORMSPREE_ID || 'mqaregzo'

// Validation constants matching Formspree settings
const MESSAGE_MIN_LENGTH = 50
const MESSAGE_MAX_LENGTH = 250

export default function Contact() {
  const navigate = useNavigate()
  const { executeRecaptcha } = useGoogleReCaptcha()
  
  // Pass the executeRecaptcha function to Formspree via the data option
  const [state, handleFormspreeSubmit] = useForm(FORMSPREE_FORM_ID, {
    data: { 'g-recaptcha-response': executeRecaptcha }
  })
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    subject: false,
    message: false
  })

  // Validation
  const messageLength = formData.message.trim().length
  const validation = useMemo(() => {
    const errors: { [key: string]: string } = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.subject) {
      errors.subject = 'Please select a subject'
    }
    
    if (messageLength === 0) {
      errors.message = 'Message is required'
    } else if (messageLength < MESSAGE_MIN_LENGTH) {
      errors.message = `Message must be at least ${MESSAGE_MIN_LENGTH} characters (${MESSAGE_MIN_LENGTH - messageLength} more needed)`
    } else if (messageLength > MESSAGE_MAX_LENGTH) {
      errors.message = `Message must be less than ${MESSAGE_MAX_LENGTH} characters (${messageLength - MESSAGE_MAX_LENGTH} over limit)`
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }, [formData, messageLength])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // For message, prevent typing beyond max length
    if (name === 'message' && value.length > MESSAGE_MAX_LENGTH + 10) {
      return
    }
    
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true
    })
    
    // If validation fails, prevent submission
    if (!validation.isValid) {
      e.preventDefault()
      return
    }
    
    // Let Formspree's handler take over
    handleFormspreeSubmit(e)
  }

  // Redirect on success
  useEffect(() => {
    if (state.succeeded) {
      const timer = setTimeout(() => {
        navigate('/contact/thank-you')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [state.succeeded, navigate])

  // Character count color
  const getCharCountColor = () => {
    if (messageLength === 0) return 'text-gray-400'
    if (messageLength < MESSAGE_MIN_LENGTH) return 'text-amber-500'
    if (messageLength > MESSAGE_MAX_LENGTH) return 'text-red-500'
    return 'text-green-500'
  }

  const getInputBorderClass = (field: keyof typeof touched) => {
    if (!touched[field]) return 'border-gray-300'
    if (validation.errors[field]) return 'border-red-300'
    return 'border-green-300'
  }

  return (
    <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50">
      <div className="page-container py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Contact <span className="text-voxly-purple">Us</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
        </div>

        {/* Quick Info Stats - Same pattern as Credits page */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Email</p>
              <a href="mailto:support@voxly.ai" className="text-sm sm:text-base font-bold text-gray-900 hover:text-voxly-purple truncate block">
                support@voxly.ai
              </a>
            </div>
          </div>

          <div className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Response Time</p>
              <p className="text-sm sm:text-base font-bold text-gray-900">24-48 hours</p>
            </div>
          </div>

          <div className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">FAQ</p>
              <a href="/about" className="text-sm sm:text-base font-bold text-gray-900 hover:text-voxly-purple">
                About page
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Send className="w-5 h-5 text-voxly-purple" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Send us a Message</h2>
          </div>
          
          <div className="voxly-card">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('name')}
                    className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base ${getInputBorderClass('name')}`}
                    placeholder="Your name"
                  />
                  <ValidationError prefix="Name" field="name" errors={state.errors} />
                  {touched.name && validation.errors.name && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validation.errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('email')}
                    className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base ${getInputBorderClass('email')}`}
                    placeholder="your@email.com"
                  />
                  <ValidationError prefix="Email" field="email" errors={state.errors} />
                  {touched.email && validation.errors.email && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validation.errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('subject')}
                  className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base ${getInputBorderClass('subject')}`}
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="feedback">Feedback</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
                <ValidationError prefix="Subject" field="subject" errors={state.errors} />
                {touched.subject && validation.errors.subject && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validation.errors.subject}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  minLength={MESSAGE_MIN_LENGTH}
                  maxLength={MESSAGE_MAX_LENGTH + 10}
                  value={formData.message}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('message')}
                  className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm sm:text-base ${
                    touched.message && messageLength > 0
                      ? messageLength < MESSAGE_MIN_LENGTH
                        ? 'border-amber-300 bg-amber-50/50'
                        : messageLength > MESSAGE_MAX_LENGTH
                        ? 'border-red-300 bg-red-50/50'
                        : 'border-green-300'
                      : 'border-gray-300'
                  }`}
                  placeholder={`How can we help you? (min ${MESSAGE_MIN_LENGTH} chars)`}
                />
                <ValidationError prefix="Message" field="message" errors={state.errors} />
                
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex-1">
                    {touched.message && messageLength > 0 && messageLength < MESSAGE_MIN_LENGTH && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {MESSAGE_MIN_LENGTH - messageLength} more needed
                      </p>
                    )}
                    {messageLength > MESSAGE_MAX_LENGTH && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {messageLength - MESSAGE_MAX_LENGTH} over limit
                      </p>
                    )}
                    {messageLength >= MESSAGE_MIN_LENGTH && messageLength <= MESSAGE_MAX_LENGTH && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Looks good!
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${getCharCountColor()}`}>
                    {messageLength}/{MESSAGE_MAX_LENGTH}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={state.submitting || !validation.isValid}
                className="w-full btn-voxly py-2.5 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state.submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    Send Message
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-400 text-center">
                Protected by reCAPTCHA.{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Privacy</a>
                {' & '}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Terms</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}