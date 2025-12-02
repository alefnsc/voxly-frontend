'use client'

import { useNavigate, Link } from 'react-router-dom'
import { DefaultLayout } from 'components/default-layout'
import ContactButton from 'components/contact-button'
import { FileText, Shield, MessageSquare, BarChart3, Clock, Target, Briefcase, Coins, Sparkles, Info } from 'lucide-react'

export default function About() {
  const navigate = useNavigate()

  const features = [
    { icon: MessageSquare, title: "Realistic AI Interviews", desc: "Natural conversation flow" },
    { icon: BarChart3, title: "Performance Analytics", desc: "Track your progress" },
    { icon: Clock, title: "Practice 24/7", desc: "No scheduling needed" },
    { icon: Target, title: "Personalized Feedback", desc: "Actionable insights" },
    { icon: Briefcase, title: "Role-Specific", desc: "Tailored questions" },
    { icon: Coins, title: "Pay Per Use", desc: "No subscriptions" },
  ]
  
  return (
    <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50">
      <div className="page-container py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              About <span className="text-voxly-purple">Voxly</span>
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered interview preparation platform
            </p>
          </div>
        </div>

        {/* Hero Section - Logo + Mission */}
        <div className="voxly-card mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <img 
              src="/Main.png" 
              alt="Voxly" 
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain flex-shrink-0"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Ace Every Interview
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Practice with our AI interviewer, get instant feedback, and build confidence. 
                Upload your resume, enter job details, and start improving today.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Sparkles className="w-5 h-5 text-voxly-purple" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Why Voxly?</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {features.map((feature, index) => (
              <div key={index} className="voxly-card p-3 sm:p-4 text-center">
                <div className="inline-flex p-2 bg-purple-100 rounded-lg mb-2">
                  <feature.icon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 text-xs sm:text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Links Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Info className="w-5 h-5 text-voxly-purple" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Legal</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link
              to="/privacy-policy"
              className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:border-purple-300 transition-colors"
            >
              <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">Privacy Policy</h3>
                <p className="text-xs sm:text-sm text-gray-500">How we protect your data</p>
              </div>
            </Link>
            <Link
              to="/terms-of-use"
              className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:border-purple-300 transition-colors"
            >
              <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">Terms of Use</h3>
                <p className="text-xs sm:text-sm text-gray-500">Terms and conditions</p>
              </div>
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="voxly-card bg-voxly-gradient text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold">Ready to Start?</h3>
              <p className="text-purple-100 mt-1">Join thousands improving their interview skills</p>
            </div>
            <a
              href="/"
              className="inline-block px-5 py-2.5 bg-white text-voxly-purple font-semibold rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              Start Practicing
            </a>
          </div>
        </div>
      </div>
      
      <ContactButton />
    </DefaultLayout>
  )
}
