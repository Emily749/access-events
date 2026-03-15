import Link from 'next/link'
import { Calendar, Search, Star, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main id="main-content" tabIndex={-1}>

        {/* Hero */}
        <section
          className="bg-indigo-600 text-white py-20 px-4"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl font-bold mb-6 leading-tight"
            >
              Find events that work for you
            </h1>
            <p className="text-indigo-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
              Discover events with the accessibility features you need — from BSL
              interpretation to step-free access, quiet rooms and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/events"
                className="bg-white text-indigo-600 font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
              >
                Browse events
              </Link>
              <Link
                href="/insights"
                className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-indigo-500 transition-colors text-sm"
              >
                View accessibility insights
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          className="py-20 px-4 bg-gray-50"
          aria-labelledby="features-heading"
        >
          <div className="max-w-5xl mx-auto">
            <h2
              id="features-heading"
              className="text-3xl font-bold text-center text-gray-900 mb-4"
            >
              Everything you need to find accessible events
            </h2>
            <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
              Built specifically to help people with disabilities discover events
              that meet their needs.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0">
              {[
                {
                  icon: Search,
                  title: 'Advanced search',
                  description:
                    'Filter by accessibility feature, location, date and category to find exactly what you need.',
                },
                {
                  icon: Calendar,
                  title: 'Detailed event info',
                  description:
                    'Every event lists its full accessibility provision so you know exactly what to expect.',
                },
                {
                  icon: Star,
                  title: 'Honest reviews',
                  description:
                    'Read accessibility ratings from people who have attended. Leave your own to help others.',
                },
                {
                  icon: Users,
                  title: 'Personalised for you',
                  description:
                    'Save your accessibility preferences and get recommendations matched to your needs.',
                },
              ].map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="bg-white rounded-2xl p-6 border border-gray-200"
                >
                  <div
                    className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4"
                    aria-hidden="true"
                  >
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Accessibility features strip */}
        <section
          className="py-16 px-4 bg-white"
          aria-labelledby="features-strip-heading"
        >
          <div className="max-w-5xl mx-auto">
            <h2
              id="features-strip-heading"
              className="text-2xl font-bold text-gray-900 mb-2 text-center"
            >
              Search by accessibility feature
            </h2>
            <p className="text-center text-gray-500 mb-10 text-sm">
              Find events that have exactly what you need
            </p>
            <nav aria-label="Browse by accessibility feature">
              <ul className="flex flex-wrap gap-3 justify-center list-none p-0">
                {[
                  'BSL Interpretation',
                  'Audio Description',
                  'Hearing Loop',
                  'Step-Free Access',
                  'Accessible Toilets',
                  'Wheelchair Spaces',
                  'Quiet Room',
                  'Large Print Materials',
                  'Braille Materials',
                  'Relaxed Performance',
                  'Assistance Dog Facilities',
                  'Accessible Parking',
                  'Captioning',
                  'Low Sensory Environment',
                  'Priority Seating',
                ].map(feature => (
                  <li key={feature}>
                    <Link
                      href={`/events?feature=${encodeURIComponent(feature)}`}
                      className="bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors block"
                    >
                      {feature}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>

        {/* Insights CTA */}
        <section
          className="py-16 px-4 bg-gray-50"
          aria-labelledby="insights-cta-heading"
        >
          <div className="max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
              <div className="flex-1">
                <h2
                  id="insights-cta-heading"
                  className="text-2xl font-bold text-gray-900 mb-3"
                >
                  Understand the accessibility landscape
                </h2>
                <p className="text-gray-500 leading-relaxed mb-5">
                  Our live insights dashboard shows which accessibility features are
                  most in demand, which disability communities are underserved, and
                  how events across the UK compare on accessibility. Free to access,
                  no account needed.
                </p>
                <Link
                  href="/insights"
                  className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm inline-block"
                >
                  Explore accessibility insights
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                {[
                  { value: '15',   label: 'Accessibility features tracked' },
                  { value: '8',    label: 'Disability types covered'        },
                  { value: '12',   label: 'Events with accessibility data'  },
                  { value: 'Live', label: 'Data updated in real time'       },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600 mb-1">{value}</p>
                    <p className="text-xs text-gray-500 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Organiser CTA */}
        <section
          className="py-20 px-4 bg-indigo-600 text-white"
          aria-labelledby="cta-heading"
        >
          <div className="max-w-2xl mx-auto text-center">
            <h2
              id="cta-heading"
              className="text-3xl font-bold mb-4"
            >
              Are you an event organiser?
            </h2>
            <p className="text-indigo-100 mb-8">
              List your event and reach thousands of people looking for accessible
              experiences. It only takes a few minutes.
            </p>
            <Link
              href="/auth/register"
              className="bg-white text-indigo-600 font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-sm inline-block"
            >
              List your event
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer
        className="bg-gray-900 text-gray-400 py-10 px-4"
        role="contentinfo"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center"
              aria-hidden="true"
            >
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">AccessEvents</span>
          </div>
          <p className="text-sm">© 2026 AccessEvents. Built for accessibility.</p>
          <nav aria-label="Footer navigation">
            <ul className="flex gap-6 text-sm list-none p-0">
              <li>
                <Link
                  href="/events"
                  className="hover:text-white transition-colors"
                >
                  Browse
                </Link>
              </li>
              <li>
                <Link
                  href="/insights"
                  className="hover:text-white transition-colors"
                >
                  Insights
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="hover:text-white transition-colors"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="hover:text-white transition-colors"
                >
                  Log in
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  )
}
