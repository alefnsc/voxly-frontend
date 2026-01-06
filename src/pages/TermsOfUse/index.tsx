'use client'

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function TermsOfUse() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  
  // Show disclaimer for non-English locales
  const isEnglish = i18n.language === 'en-US' || i18n.language.startsWith('en')

  return (
    <div className="min-h-screen bg-zinc-50">
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowLeft onClick={() => navigate(-1)} className="w-5 h-5 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer" aria-label={t('common.goBack')} />
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
                    {t('legal.terms.title')} <span className="text-purple-600">{t('legal.terms.titleHighlight')}</span>
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

          {/* Section 1: Acceptance of Terms */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">1. {t('legal.terms.sections.acceptance')}</h2>
            <p className="text-zinc-600 mb-4">
              By accessing or using Vocaid's AI-powered voice interview practice platform ("Service"),
              you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms,
              do not use our Service.
            </p>
            <p className="text-zinc-600 mb-4">
              These Terms constitute a legally binding agreement between you and Vocaid. We may update these
              Terms from time to time, and your continued use of the Service after such updates constitutes
              acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 2: Description of Services */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">2. {t('legal.terms.sections.services')}</h2>
            <p className="text-zinc-600 mb-4">
              Vocaid provides an AI-powered voice interview practice platform designed to help users
              prepare for job interviews. Our Service includes:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li><strong>Voice Interview Simulations:</strong> Real-time AI-driven interview practice sessions with spoken responses</li>
              <li><strong>Personalized Feedback:</strong> AI-generated analysis of your interview performance, including communication skills, content quality, and areas for improvement</li>
              <li><strong>Resume Analysis:</strong> Upload and store resumes to personalize your interview experience</li>
              <li><strong>Interview History:</strong> Access to your past interviews, scores, and progress tracking</li>
              <li><strong>Multi-language Support:</strong> Practice interviews in multiple languages</li>
            </ul>
            <p className="text-zinc-600">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time
              without prior notice.
            </p>
          </section>

          {/* Section 3: User Accounts */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">3. {t('legal.terms.sections.userAccounts')}</h2>
            <p className="text-zinc-600 mb-4">To access our Service, you must create an account. You agree to:</p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Not share your account with others or create multiple accounts</li>
            </ul>
            <p className="text-zinc-600">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage
              in fraudulent or abusive behavior.
            </p>
          </section>

          {/* Section 4: Credits and Payments */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">4. Credits and Payments</h2>
            <p className="text-zinc-600 mb-4">Our Service operates on a credit-based payment system:</p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li><strong>Credit Purchases:</strong> Credits are purchased in advance through our platform using supported payment methods</li>
              <li><strong>Credit Usage:</strong> One credit is consumed per interview session, regardless of duration or completion</li>
              <li><strong>Non-Refundable:</strong> Purchased credits are non-refundable except as required by law or at our discretion</li>
              <li><strong>No Expiration:</strong> Credits do not expire while your account remains active</li>
              <li><strong>Price Changes:</strong> We may modify pricing at any time; changes do not affect previously purchased credits</li>
              <li><strong>Account Termination:</strong> Unused credits are forfeited upon account termination for Terms violations</li>
            </ul>
            <p className="text-zinc-600">
              All payments are processed through third-party payment providers. By making a purchase,
              you agree to their terms of service as well.
            </p>
          </section>

          {/* Section 5: Acceptable Use */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">5. Acceptable Use</h2>
            <p className="text-zinc-600 mb-4">You agree to use our Service responsibly. You may NOT:</p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Use the Service for any unlawful purpose or in violation of applicable laws</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated tools, bots, or scripts to access or interact with the Service</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Impersonate another person or misrepresent your identity</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Share offensive, discriminatory, or inappropriate content during interviews</li>
              <li>Attempt to exploit the credit system or payment processes</li>
              <li>Circumvent any security or access controls</li>
            </ul>
            <p className="text-zinc-600">
              Violation of these rules may result in immediate account termination without refund.
            </p>
          </section>

          {/* Section 6: User Content and Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">6. {t('legal.terms.sections.intellectualProperty')}</h2>
            
            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Your Content</h3>
            <p className="text-zinc-600 mb-4">
              You retain ownership of content you upload (resumes, responses, etc.). By using the Service,
              you grant Vocaid a non-exclusive, worldwide, royalty-free license to use, process, and store
              your content solely for the purpose of providing and improving our Service.
            </p>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Our Content</h3>
            <p className="text-zinc-600 mb-4">
              All content, features, and functionality of the Service (including but not limited to software,
              text, graphics, logos, AI models, and user interface) are owned by Vocaid and protected by
              copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-2">Restrictions</h3>
            <p className="text-zinc-600">
              You may not copy, modify, distribute, sell, or lease any part of our Service or its content
              without our prior written consent.
            </p>
          </section>

          {/* Section 7: Disclaimers */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">7. Disclaimers</h2>
            <p className="text-zinc-600 mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, VOCAID DISCLAIMS ALL WARRANTIES,
              INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
              <li>That the Service will be uninterrupted, error-free, or secure</li>
              <li>That defects will be corrected</li>
              <li>That the Service is free of viruses or harmful components</li>
            </ul>
            <p className="text-zinc-600 mb-4">
              <strong>Important:</strong> Vocaid is an interview practice tool only. We make no guarantees
              about job outcomes. Using our Service does not guarantee you will receive job offers, pass
              interviews, or achieve any specific career results. AI-generated feedback is for practice
              purposes and should not be relied upon as professional career advice.
            </p>
          </section>

          {/* Section 8: Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">8. {t('legal.terms.sections.limitation')}</h2>
            <p className="text-zinc-600 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, VOCAID SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Loss of profits, revenue, or data</li>
              <li>Business interruption</li>
              <li>Cost of substitute services</li>
              <li>Any damages arising from your use or inability to use the Service</li>
            </ul>
            <p className="text-zinc-600">
              In no event shall our total liability exceed the amount you paid to Vocaid in the twelve (12)
              months preceding the claim.
            </p>
          </section>

          {/* Section 9: Indemnification */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">9. Indemnification</h2>
            <p className="text-zinc-600">
              You agree to indemnify, defend, and hold harmless Vocaid and its officers, directors, employees,
              and agents from any claims, damages, losses, or expenses (including reasonable legal fees)
              arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          {/* Section 10: Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">10. {t('legal.terms.sections.changes')}</h2>
            <p className="text-zinc-600 mb-4">
              We may modify these Terms at any time. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li>Posting the updated Terms on our website</li>
              <li>Updating the "Last Updated" date at the top</li>
              <li>Sending you an email notification for significant changes</li>
            </ul>
            <p className="text-zinc-600">
              Your continued use of the Service after changes become effective constitutes acceptance of
              the revised Terms. If you do not agree to the new Terms, you must stop using the Service.
            </p>
          </section>

          {/* Section 11: Governing Law and Disputes */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">11. Governing Law and Disputes</h2>
            <p className="text-zinc-600 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
              where Vocaid is established, without regard to conflict of law principles.
            </p>
            <p className="text-zinc-600">
              Any disputes arising from these Terms or your use of the Service shall be resolved through
              binding arbitration or in the courts of competent jurisdiction, as permitted by applicable law.
            </p>
          </section>

          {/* Section 12: Miscellaneous */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">12. Miscellaneous</h2>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 ml-4 mb-4">
              <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Vocaid regarding the Service</li>
              <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
              <li><strong>Waiver:</strong> Failure to enforce any right does not constitute a waiver of that right</li>
              <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent; we may assign our rights freely</li>
            </ul>
          </section>

          {/* Section 13: Contact Us */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">13. {t('legal.terms.sections.contactUs')}</h2>
            <p className="text-zinc-600 mb-4">
              If you have questions about these Terms of Use, please contact us:
            </p>
            <div className="bg-zinc-50 rounded-lg p-4">
              <p className="text-zinc-700 mb-2"><strong>Vocaid Legal Team</strong></p>
              <p className="text-zinc-600 mb-1">
                Email:{' '}
                <a href="mailto:support@vocaid.ai" className="text-purple-600 hover:underline">
                  support@vocaid.ai
                </a>
              </p>
            </div>
          </section>
        </div>
        </div>
      </main>
    </div>
  )
}
