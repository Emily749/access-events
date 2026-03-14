'use client'

import NotificationDropdown from '@/components/notifications/NotificationDropdown'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Calendar, Heart, User, LogOut, Menu, X, Building, Flag } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { appUser, signOut, loading } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  return (
    <nav
      className="bg-white border-b border-gray-200 sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="AccessEvents home"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">
              AccessEvents
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/events"
              className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
            >
              Browse Events
            </Link>

            {!loading && appUser && (
              <>
                <Link
                  href="/saved"
                  className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                >
                  <Heart className="w-4 h-4" aria-hidden="true" />
                  Saved
                </Link>

                {(appUser.role === 'organiser' || appUser.role === 'admin') && (
                  <>
                    <Link
                      href="/organiser/dashboard"
                      className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/organiser/venues"
                      className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    >
                      <Building className="w-4 h-4" aria-hidden="true" />
                      Venues
                    </Link>
                  </>
                )}

                {appUser.role === 'admin' && (
                  <Link
                    href="/admin/reports"
                    className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                  >
                    <Flag className="w-4 h-4" aria-hidden="true" />
                    Reports
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  Profile
                </Link>

                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                  aria-label="Sign out of your account"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sign out
                </button>
              </>
            )}

            {!loading && !appUser && (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen
              ? <X className="w-6 h-6" aria-hidden="true" />
              : <Menu className="w-6 h-6" aria-hidden="true" />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gray-200 bg-white px-4 py-4 flex flex-col gap-4"
          role="menu"
          aria-label="Mobile navigation"
        >
          <Link
            href="/events"
            className="text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
            onClick={() => setMenuOpen(false)}
            role="menuitem"
          >
            Browse Events
          </Link>

          {appUser && (
            <>
              <Link
                href="/saved"
                className="text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                Saved Events
              </Link>

              <Link
                href="/notifications"
                className="text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                Notifications
                </Link>

              {/* Notifications */}
              <NotificationDropdown />

              <Link
                href="/profile"
                className="text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                Profile
              </Link>

              {(appUser.role === 'organiser' || appUser.role === 'admin') && (
                <>
                  <Link
                    href="/organiser/dashboard"
                    className="text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Organiser Dashboard
                  </Link>
                  <Link
                    href="/organiser/venues"
                    className="text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Venues
                  </Link>
                </>
              )}

              {appUser.role === 'admin' && (
                <Link
                  href="/admin/reports"
                  className="text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                >
                  Reports
                </Link>
              )}

              <button
                onClick={() => {
                  setMenuOpen(false)
                  handleSignOut()
                }}
                className="text-red-600 text-sm font-medium text-left focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                role="menuitem"
                aria-label="Sign out of your account"
              >
                Sign out
              </button>
            </>
          )}

          {!appUser && (
            <>
              <Link
                href="/auth/login"
                className="text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="text-indigo-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
