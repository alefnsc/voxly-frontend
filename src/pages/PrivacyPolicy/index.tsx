'use client'

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import TopBar from 'components/top-bar'
import Footer from 'components/footer'

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  
  // Show disclaimer for non-English locales
  const isEnglish = i18n.language === 'en-US' || i18n.language.startsWith('en')

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <TopBar showLogo={true} />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowLeft onClick={() => navigate(-1)} className="w-5 h-5 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer" aria-label={t('common.goBack')} />
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
                    {t('legal.privacy.title')} <span className="text-purple-600">{t('legal.privacy.titleHighlight')}</span>
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer for non-English */}
          {!isEnglish && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {t('legal.disclaimer')}
              </p>
            </div>
          )}

        {/* Content */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl prose prose-zinc max-w-none">
          <p className="text-zinc-600 mb-8">
            <em>Last Updated: January 5, 2026</em>
          </p>

          {/* Section 1: Introduction */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">1. {t('legal.privacy.sections.introduction')}</h2>
            <p className="text-zinc-600 mb-4">
              Vocaid ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              AI-powered voice interview practice platform ("Service").
            </p>
            <p className="text-zinc-600 mb-4">
              By using Vocaid, you consent to the practices described in this policy. If you do not agree
              with any part of this policy, please do not use our Service.
            </p>
          </section>

          {/* Section 2: Data We Collect */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">2. {t('legal.privacy.sections.dataCollected')}</h2>
            <p className="text-zinc-600 mb-4">We collect the following categories of information:</p>
            
            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Email address, name, and profile details provided during registration</li>
              <li>Authentication credentials managed through our provider (Clerk)</li>
              <li>Phone number (if provided for verification)</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Resume and Professional Data</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>PDF resumes you upload for interview practice</li>
              <li>Extracted text and structured data from your resume</li>
              <li>Job titles, company names, and career information you provide</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Interview Session Data</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Voice recordings of your practice interview sessions</li>
              <li>Transcripts generated from your spoken responses</li>
              <li>AI-generated feedback, scores, and performance analytics</li>
              <li>Session metadata (duration, language, interview type)</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Usage and Device Data</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Browser type, operating system, and device information</li>
              <li>IP address and approximate geographic location</li>
              <li>Device fingerprints for fraud prevention</li>
              <li>Platform interaction data and feature usage patterns</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Payment Information</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4">
              <li>Transaction records and credit purchase history</li>
              <li>Payment processor identifiers (we do not store full payment card details)</li>
            </ul>
          </section>

          {/* Section 3: How We Use Your Data */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">3. {t('legal.privacy.sections.howWeUse')}</h2>
            <p className="text-zinc-600 mb-4">We use your information for the following purposes:</p>
            
            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Service Delivery</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Conduct AI-powered voice interview practice sessions</li>
              <li>Generate personalized feedback and performance analytics</li>
              <li>Provide interview history and progress tracking</li>
              <li>Process payments and manage your credit balance</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Platform Improvement</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Improve our AI models, voice recognition, and feedback quality</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Develop new features based on user needs</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Security and Compliance</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Prevent fraud, abuse, and unauthorized access</li>
              <li>Enforce our Terms of Use and policies</li>
              <li>Comply with legal obligations and respond to lawful requests</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Communications</h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4">
              <li>Send essential service-related notifications</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Share product updates (with your consent where required)</li>
            </ul>
          </section>

          {/* Section 4: Data Retention */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">4. Data Retention</h2>
            <p className="text-zinc-600 mb-4">
              We retain your data according to the following schedule:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li><strong>Account Information:</strong> Retained while your account is active and for 30 days after deletion request</li>
              <li><strong>Resume Data:</strong> Retained while your account is active; deleted upon account deletion</li>
              <li><strong>Voice Recordings:</strong> Retained for 30 days after each session, then automatically deleted</li>
              <li><strong>Interview Transcripts and Feedback:</strong> Retained while your account is active</li>
              <li><strong>Payment Records:</strong> Retained for 7 years as required by tax and financial regulations</li>
              <li><strong>Security Logs:</strong> Retained for 90 days for fraud prevention purposes</li>
            </ul>
            <p className="text-zinc-600">
              You may request earlier deletion of your data (except where retention is legally required) by
              contacting us or using account settings.
            </p>
          </section>

          {/* Section 5: Cookies and Tracking */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-zinc-600 mb-4">We use the following types of cookies and similar technologies:</p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li><strong>Essential Cookies:</strong> Required for authentication, session management, and security</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            </ul>
            <p className="text-zinc-600">
              You can control non-essential cookies through your browser settings. Disabling essential cookies
              may prevent you from using certain features of our Service.
            </p>
          </section>

          {/* Section 6: How We Share Your Data */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">6. How We Share Your Data</h2>
            <p className="text-zinc-600 mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate our Service (e.g., cloud hosting, payment processing, voice AI providers)</li>
              <li><strong>Analytics Partners:</strong> Services that help us analyze usage and improve our platform</li>
              <li><strong>Legal Authorities:</strong> When required by law, court order, or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="text-zinc-600">
              We do not sell your personal information to third parties. We require all service providers to
              maintain confidentiality and use your data only for the purposes we specify.
            </p>
          </section>

          {/* Section 7: Your Rights */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">7. {t('legal.privacy.sections.yourRights')}</h2>
            <p className="text-zinc-600 mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain types of processing</li>
              <li><strong>Restriction:</strong> Request that we limit how we use your data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-zinc-600">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@vocaid.ai" className="text-purple-600 hover:underline">
                privacy@vocaid.ai
              </a>. We will respond within the timeframe required by applicable law.
            </p>
          </section>

          {/* Section 8: Data Security */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">8. {t('legal.privacy.sections.dataSecurity')}</h2>
            <p className="text-zinc-600 mb-4">
              We implement appropriate technical and organizational measures to protect your data, including:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments and monitoring</li>
              <li>Employee training on data protection practices</li>
            </ul>
            <p className="text-zinc-600">
              While we strive to protect your information, no method of transmission over the Internet
              or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 9: International Data Transfers */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">9. International Data Transfers</h2>
            <p className="text-zinc-600 mb-4">
              Your data may be transferred to and processed in countries other than your country of residence,
              including the United States. These countries may have different data protection laws.
            </p>
            <p className="text-zinc-600">
              When we transfer data internationally, we use appropriate safeguards such as standard
              contractual clauses to protect your information.
            </p>
          </section>

          {/* Section 10: Changes to This Policy */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-zinc-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last Updated" date at the top</li>
              <li>Sending you an email notification for significant changes</li>
            </ul>
            <p className="text-zinc-600">
              Your continued use of the Service after changes become effective constitutes acceptance
              of the revised policy.
            </p>
          </section>

          {/* Section 11: Contact Us */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">11. {t('legal.privacy.sections.contactUs')}</h2>
            <p className="text-zinc-600 mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data
              practices, please contact us:
            </p>
            <div className="bg-zinc-50 rounded-lg p-4">
              <p className="text-zinc-700 mb-2"><strong>Vocaid Privacy Team</strong></p>
              <p className="text-zinc-600 mb-1">
                Email:{' '}
                <a href="mailto:privacy@vocaid.ai" className="text-purple-600 hover:underline">
                  privacy@vocaid.ai
                </a>
              </p>
              <p className="text-zinc-600">
                For general inquiries:{' '}
                <a href="mailto:support@vocaid.ai" className="text-purple-600 hover:underline">
                  support@vocaid.ai
                </a>
              </p>
            </div>
          </section>
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
