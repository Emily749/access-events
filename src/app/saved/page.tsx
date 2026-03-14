'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import EventCard from '@/components/events/EventCard'
import { useAuth } from '@/context/AuthContext'
import { getSavedEvents } from '@/lib/queries'
import { Heart } from 'lucide-react'
import Link from 'next/link'

export default function SavedEventsPage() {
  const { appUser } = useAuth()
  const [savedEvents, setSavedEvents] = useState<any[]>([])
  const [savedEventIds, setSavedEventIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!appUser) return
      const data = await getSavedEvents(appUser.user_id)
      setSavedEvents(data)
      setSavedEventIds(data.map((s: any) => s.event_id))
      setLoading(false)
    }
    load()
  }, [appUser])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved events</h1>
          <p className="text-gray-500">
            {loading
              ? 'Loading...'
              : `${savedEvents.length} saved event${savedEvents.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : savedEvents.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved events yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Save events you are interested in and they will appear here.
            </p>
            <Link
              href="/events"
              className="bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
            >
              Browse events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedEvents.map((saved: any) => (
              <EventCard
                key={saved.event_id}
                event={saved.event}
                savedEventIds={savedEventIds}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
