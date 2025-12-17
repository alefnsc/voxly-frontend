'use client'

import { useNavigate } from 'react-router-dom'
import { DefaultLayout } from 'components/default-layout'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <DefaultLayout className="bg-gray-50">
      <div className="page-container py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <ArrowLeft onClick={() => navigate('/about')} className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Privacy <span className="text-voxly-purple">Policy</span>
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="voxly-card prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              Welcome to Voxly. We respect your privacy and are committed to protecting your personal data.
              This privacy policy will inform you about how we look after your personal data when you visit
              our website and use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Data We Collect</h2>
            <p className="text-gray-600 mb-4">We may collect the following types of information:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Identity Data:</strong> First name, last name, username</li>
              <li><strong>Contact Data:</strong> Email address</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
              <li><strong>Usage Data:</strong> Information about how you use our website and services</li>
              <li><strong>Interview Data:</strong> Resume content, job descriptions, interview responses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Data</h2>
            <p className="text-gray-600 mb-4">We use your data to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Provide and improve our AI interview practice services</li>
              <li>Generate personalized interview feedback</li>
              <li>Process payments and manage your account</li>
              <li>Communicate with you about our services</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We have implemented appropriate security measures to prevent your personal data from being
              accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal
              data to those employees and third parties who have a business need to know.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Third-Party Services</h2>
            <p className="text-gray-600 mb-4">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Clerk:</strong> Authentication and user management</li>
              <li><strong>MercadoPago:</strong> Payment processing</li>
              <li><strong>AI Services:</strong> Interview simulation and feedback generation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request transfer of your personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this privacy policy or our privacy practices, please contact us at{' '}
              <a href="mailto:privacy@voxly.ai" className="text-voxly-purple hover:underline">
                privacy@voxly.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </DefaultLayout>
  )
}
