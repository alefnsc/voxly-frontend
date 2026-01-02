/**
 * Legal Modal Component
 * 
 * Displays Privacy Policy and Terms of Use content in a modal dialog.
 * Supports switching between documents without closing the modal.
 * 
 * @module components/auth/LegalModal
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'components/ui/dialog';
import { AlertCircle } from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms';

interface LegalModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onOpenChange: (open: boolean) => void;
  /** Which document to display */
  activeDoc: LegalDocType;
  /** Callback to switch document */
  onDocChange: (doc: LegalDocType) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  open,
  onOpenChange,
  activeDoc,
  onDocChange,
}) => {
  const { t, i18n } = useTranslation();
  
  // Show disclaimer for non-English locales
  const isEnglish = i18n.language === 'en-US' || i18n.language.startsWith('en');

  const title = activeDoc === 'privacy' 
    ? t('legal.privacy.title', 'Privacy') + ' ' + t('legal.privacy.titleHighlight', 'Policy')
    : t('legal.terms.title', 'Terms of') + ' ' + t('legal.terms.titleHighlight', 'Use');

  const switchLabel = activeDoc === 'privacy'
    ? t('auth.legal.switchToTerms', 'View Terms of Use')
    : t('auth.legal.switchToPrivacy', 'View Privacy Policy');

  const handleSwitch = () => {
    onDocChange(activeDoc === 'privacy' ? 'terms' : 'privacy');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-zinc-900">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Disclaimer for non-English */}
        {!isEnglish && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-800">
              {t('legal.disclaimer', 'This legal document is available in English only. The English version is the binding version.')}
            </p>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {activeDoc === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfUseContent />}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-zinc-200">
          <button
            type="button"
            onClick={handleSwitch}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2"
          >
            {switchLabel}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold',
              'bg-purple-600 text-white',
              'hover:bg-purple-700',
              'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'
            )}
          >
            {t('common.close', 'Close')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========================================
// PRIVACY POLICY CONTENT
// ========================================

const PrivacyPolicyContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="prose prose-zinc prose-sm max-w-none">
      <p className="text-zinc-600 mb-6">
        <em>Last Updated: January 5, 2026</em>
      </p>

      {/* Section 1: Introduction */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">1. {t('legal.privacy.sections.introduction', 'Introduction')}</h2>
        <p className="text-zinc-600 mb-3 text-sm">
          Vocaid ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you use our
          AI-powered voice interview practice platform ("Service").
        </p>
        <p className="text-zinc-600 text-sm">
          By using Vocaid, you consent to the practices described in this policy. If you do not agree
          with any part of this policy, please do not use our Service.
        </p>
      </section>

      {/* Section 2: Data We Collect */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">2. {t('legal.privacy.sections.dataCollected', 'Data We Collect')}</h2>
        <p className="text-zinc-600 mb-3 text-sm">We collect the following categories of information:</p>
        
        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Account Information</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>Email address, name, and profile details provided during registration</li>
          <li>Authentication credentials managed through our provider (Clerk)</li>
          <li>Phone number (if provided for verification)</li>
        </ul>

        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Resume and Professional Data</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>PDF resumes you upload for interview practice</li>
          <li>Extracted text and structured data from your resume</li>
          <li>Job titles, company names, and career information you provide</li>
        </ul>

        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Interview Session Data</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>Voice recordings of your practice interview sessions</li>
          <li>Transcripts generated from your spoken responses</li>
          <li>AI-generated feedback, scores, and performance analytics</li>
          <li>Session metadata (duration, language, interview type)</li>
        </ul>

        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Usage and Device Data</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>Browser type, operating system, and device information</li>
          <li>IP address and approximate geographic location</li>
          <li>Device fingerprints for fraud prevention</li>
          <li>Platform interaction data and feature usage patterns</li>
        </ul>

        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Payment Information</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 text-sm">
          <li>Transaction records and credit purchase history</li>
          <li>Payment processor identifiers (we do not store full payment card details)</li>
        </ul>
      </section>

      {/* Section 3: How We Use Your Data */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">3. {t('legal.privacy.sections.howWeUse', 'How We Use Your Data')}</h2>
        <p className="text-zinc-600 mb-3 text-sm">We use your information for the following purposes:</p>
        
        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Service Delivery</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>Conduct AI-powered voice interview practice sessions</li>
          <li>Generate personalized feedback and performance analytics</li>
          <li>Provide interview history and progress tracking</li>
          <li>Process payments and manage your credit balance</li>
        </ul>

        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Platform Improvement</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>Improve our AI models, voice recognition, and feedback quality</li>
          <li>Analyze usage patterns to enhance user experience</li>
          <li>Develop new features based on user needs</li>
        </ul>

        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Security and Compliance</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>Prevent fraud, abuse, and unauthorized access</li>
          <li>Enforce our Terms of Use and policies</li>
          <li>Comply with legal obligations and respond to lawful requests</li>
        </ul>

        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Communications</h3>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 text-sm">
          <li>Send essential service-related notifications</li>
          <li>Provide customer support and respond to inquiries</li>
          <li>Share product updates (with your consent where required)</li>
        </ul>
      </section>

      {/* Section 4: Data Retention */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">4. Data Retention</h2>
        <p className="text-zinc-600 mb-3 text-sm">
          We retain your data according to the following schedule:
        </p>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li><strong>Account Information:</strong> Retained while your account is active and for 30 days after deletion request</li>
          <li><strong>Resume Data:</strong> Retained while your account is active; deleted upon account deletion</li>
          <li><strong>Voice Recordings:</strong> Retained for 30 days after each session, then automatically deleted</li>
          <li><strong>Interview Transcripts and Feedback:</strong> Retained while your account is active</li>
          <li><strong>Payment Records:</strong> Retained for 7 years as required by tax and financial regulations</li>
          <li><strong>Security Logs:</strong> Retained for 90 days for fraud prevention purposes</li>
        </ul>
        <p className="text-zinc-600 text-sm">
          You may request earlier deletion of your data (except where retention is legally required) by
          contacting us or using account settings.
        </p>
      </section>

      {/* Section 5: Cookies */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">5. Cookies and Tracking Technologies</h2>
        <p className="text-zinc-600 mb-3 text-sm">We use the following types of cookies and similar technologies:</p>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li><strong>Essential Cookies:</strong> Required for authentication, session management, and security</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
          <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
        </ul>
        <p className="text-zinc-600 text-sm">
          You can control non-essential cookies through your browser settings.
        </p>
      </section>

      {/* Section 6: Data Sharing */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">6. How We Share Your Data</h2>
        <p className="text-zinc-600 mb-3 text-sm">We may share your information with:</p>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li><strong>Service Providers:</strong> Third-party vendors who help us operate our Service</li>
          <li><strong>Analytics Partners:</strong> Services that help us analyze usage and improve our platform</li>
          <li><strong>Legal Authorities:</strong> When required by law, court order, or to protect our rights</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
        </ul>
        <p className="text-zinc-600 text-sm">
          We do not sell your personal information to third parties.
        </p>
      </section>

      {/* Section 7: Your Rights */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">7. {t('legal.privacy.sections.yourRights', 'Your Rights')}</h2>
        <p className="text-zinc-600 mb-3 text-sm">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data</li>
          <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
          <li><strong>Objection:</strong> Object to certain types of processing</li>
          <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
        </ul>
        <p className="text-zinc-600 text-sm">
          To exercise these rights, contact us at{' '}
          <a href="mailto:privacy@vocaid.ai" className="text-purple-600 hover:underline">
            privacy@vocaid.ai
          </a>.
        </p>
      </section>

      {/* Section 8: Data Security */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">8. {t('legal.privacy.sections.dataSecurity', 'Data Security')}</h2>
        <p className="text-zinc-600 mb-3 text-sm">
          We implement appropriate technical and organizational measures to protect your data, including
          encryption of data in transit and at rest, secure authentication, and regular security assessments.
        </p>
      </section>

      {/* Section 9-11: Brief mentions */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">9. International Data Transfers</h2>
        <p className="text-zinc-600 text-sm">
          Your data may be transferred to and processed in countries other than your country of residence.
          When we transfer data internationally, we use appropriate safeguards to protect your information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">10. Changes to This Policy</h2>
        <p className="text-zinc-600 text-sm">
          We may update this Privacy Policy from time to time. We will notify you of material changes
          by posting the updated policy on our website and updating the "Last Updated" date.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">11. {t('legal.privacy.sections.contactUs', 'Contact Us')}</h2>
        <p className="text-zinc-600 text-sm">
          If you have questions about this Privacy Policy, please contact us at{' '}
          <a href="mailto:privacy@vocaid.ai" className="text-purple-600 hover:underline">
            privacy@vocaid.ai
          </a>.
        </p>
      </section>
    </div>
  );
};

// ========================================
// TERMS OF USE CONTENT
// ========================================

const TermsOfUseContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="prose prose-zinc prose-sm max-w-none">
      <p className="text-zinc-600 mb-6">
        <em>Last Updated: January 5, 2026</em>
      </p>

      {/* Section 1: Acceptance of Terms */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">1. {t('legal.terms.sections.acceptance', 'Acceptance of Terms')}</h2>
        <p className="text-zinc-600 mb-3 text-sm">
          By accessing or using Vocaid's AI-powered voice interview practice platform ("Service"),
          you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms,
          do not use our Service.
        </p>
        <p className="text-zinc-600 text-sm">
          These Terms constitute a legally binding agreement between you and Vocaid. We may update these
          Terms from time to time, and your continued use of the Service after such updates constitutes
          acceptance of the revised Terms.
        </p>
      </section>

      {/* Section 2: Description of Services */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">2. {t('legal.terms.sections.services', 'Description of Services')}</h2>
        <p className="text-zinc-600 mb-3 text-sm">
          Vocaid provides an AI-powered voice interview practice platform designed to help users
          prepare for job interviews. Our Service includes:
        </p>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li><strong>Voice Interview Simulations:</strong> Real-time AI-driven interview practice sessions</li>
          <li><strong>Personalized Feedback:</strong> AI-generated analysis of your interview performance</li>
          <li><strong>Resume Analysis:</strong> Upload and store resumes to personalize your interview experience</li>
          <li><strong>Interview History:</strong> Access to your past interviews, scores, and progress tracking</li>
          <li><strong>Multi-language Support:</strong> Practice interviews in multiple languages</li>
        </ul>
        <p className="text-zinc-600 text-sm">
          We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
        </p>
      </section>

      {/* Section 3: User Accounts */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">3. {t('legal.terms.sections.userAccounts', 'User Accounts')}</h2>
        <p className="text-zinc-600 mb-3 text-sm">To access our Service, you must create an account. You agree to:</p>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify us immediately of any unauthorized access to your account</li>
          <li>Accept responsibility for all activities that occur under your account</li>
          <li>Not share your account with others or create multiple accounts</li>
        </ul>
      </section>

      {/* Section 4: Credits and Payments */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">4. Credits and Payments</h2>
        <p className="text-zinc-600 mb-3 text-sm">Our Service operates on a credit-based payment system:</p>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li><strong>Credit Purchases:</strong> Credits are purchased in advance through our platform</li>
          <li><strong>Credit Usage:</strong> One credit is consumed per interview session</li>
          <li><strong>Non-Refundable:</strong> Purchased credits are non-refundable except as required by law</li>
          <li><strong>No Expiration:</strong> Credits do not expire while your account remains active</li>
        </ul>
      </section>

      {/* Section 5: Acceptable Use */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">5. Acceptable Use</h2>
        <p className="text-zinc-600 mb-3 text-sm">You agree to use our Service responsibly. You may NOT:</p>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 mb-3 text-sm">
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to the Service</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>Use automated tools, bots, or scripts to access the Service</li>
          <li>Upload malicious code, viruses, or harmful content</li>
          <li>Impersonate another person or misrepresent your identity</li>
        </ul>
        <p className="text-zinc-600 text-sm">
          Violation of these rules may result in immediate account termination without refund.
        </p>
      </section>

      {/* Section 6: Intellectual Property */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">6. {t('legal.terms.sections.intellectualProperty', 'User Content and Intellectual Property')}</h2>
        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Your Content</h3>
        <p className="text-zinc-600 mb-3 text-sm">
          You retain ownership of content you upload. By using the Service, you grant Vocaid a non-exclusive,
          worldwide, royalty-free license to use, process, and store your content solely for providing the Service.
        </p>
        <h3 className="text-base font-medium text-zinc-800 mt-3 mb-2">Our Content</h3>
        <p className="text-zinc-600 text-sm">
          All content, features, and functionality of the Service are owned by Vocaid and protected by
          copyright, trademark, and other intellectual property laws.
        </p>
      </section>

      {/* Section 7: Disclaimers */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">7. Disclaimers</h2>
        <p className="text-zinc-600 mb-3 text-sm">
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. 
          TO THE FULLEST EXTENT PERMITTED BY LAW, VOCAID DISCLAIMS ALL WARRANTIES.
        </p>
        <p className="text-zinc-600 text-sm">
          <strong>Important:</strong> Vocaid is an interview practice tool only. We make no guarantees
          about job outcomes. Using our Service does not guarantee you will receive job offers.
        </p>
      </section>

      {/* Section 8: Limitation of Liability */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">8. {t('legal.terms.sections.limitation', 'Limitation of Liability')}</h2>
        <p className="text-zinc-600 text-sm">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, VOCAID SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. In no event shall our total liability exceed the
          amount you paid to Vocaid in the twelve (12) months preceding the claim.
        </p>
      </section>

      {/* Section 9: Indemnification */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">9. Indemnification</h2>
        <p className="text-zinc-600 text-sm">
          You agree to indemnify, defend, and hold harmless Vocaid and its officers, directors, employees,
          and agents from any claims, damages, losses, or expenses arising from your use of the Service
          or violation of these Terms.
        </p>
      </section>

      {/* Section 10: Changes */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">10. {t('legal.terms.sections.changes', 'Changes to Terms')}</h2>
        <p className="text-zinc-600 text-sm">
          We may modify these Terms at any time. We will notify you of material changes by posting
          the updated Terms on our website. Your continued use of the Service after changes become
          effective constitutes acceptance of the revised Terms.
        </p>
      </section>

      {/* Section 11: Governing Law */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">11. Governing Law and Disputes</h2>
        <p className="text-zinc-600 text-sm">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
          where Vocaid is established. Any disputes arising from these Terms or your use of the Service
          shall be resolved through binding arbitration or in the courts of competent jurisdiction.
        </p>
      </section>

      {/* Section 12-13: Miscellaneous and Contact */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">12. Miscellaneous</h2>
        <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-2 text-sm">
          <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Vocaid</li>
          <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
          <li><strong>Waiver:</strong> Failure to enforce any right does not constitute a waiver of that right</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">13. {t('legal.terms.sections.contactUs', 'Contact Us')}</h2>
        <p className="text-zinc-600 text-sm">
          If you have questions about these Terms of Use, please contact us at{' '}
          <a href="mailto:legal@vocaid.ai" className="text-purple-600 hover:underline">
            legal@vocaid.ai
          </a>.
        </p>
      </section>
    </div>
  );
};

export default LegalModal;
