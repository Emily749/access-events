'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import EventCard from '@/components/events/EventCard'
import FilterBar from '@/components/events/FilterBar'
import {
  getEvents,
  getEventCategories,
  getAccessibilityFeatures,
  getSavedEvents,
  logSearch,
} from '@/lib/queries'
import { useAuth } from '@/context/AuthContext'
import { Calendar } from 'lucide-react'

function EventsContent() {
  const searchParams = useSearchParams()
  const { appUser } = useAuth()

  const [events, setEvents] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [features, setFeatures] = useState<any[]>([])
  const [savedEventIds, setSavedEventIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    city: '',
    feature: searchParams.get('feature') || '',
    isFree: false,
  })

  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const data = await getEvents(filters)
    setEvents(data)
    setLoading(false)

    if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)
    logTimeoutRef.current = setTimeout(async () => {
      const hasActivity =
        filters.search ||
        filters.category ||
        filters.city ||
        filters.feature ||
        filters.isFree

      if (!hasActivity) return

      const filterRecord: Record<string, string> = {}
      if (filters.category) filterRecord['category'] = filters.category
      if (filters.city)     filterRecord['city']     = filters.city
      if (filters.feature)  filterRecord['feature']  = filters.feature
      if (filters.isFree)   filterRecord['is_free']  = 'true'

      await logSearch({
        userId:       appUser?.user_id,
        queryText:    filters.search,
        filters:      filterRecord,
        resultsCount: data.length,
      })
    }, 1500)
  }, [filters, appUser])

  useEffect(() => {
    fetchEvents()
    return () => {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current)
    }
  }, [fetchEvents])

  useEffect(() => {
    async function fetchMeta() {
      const [cats, feats] = await Promise.all([
        getEventCategories(),
        getAccessibilityFeatures(),
      ])
      setCategories(cats)
      setFeatures(feats)
    }
    fetchMeta()
  }, [])

  useEffect(() => {
    async function fetchSaved() {
      if (appUser) {
        const saved = await getSavedEvents(appUser.user_id)
        setSavedEventIds(saved.map((s: any) => s.event_id))
      }
    }
    fetchSaved()
  }, [appUser])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse events</h1>
        <p
          className="text-gray-500"
          aria-live="polite"
          aria-atomic="true"
        >
          {loading
            ? 'Loading...'
            : `${events.length} event${events.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      <div className="mb-8">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          categories={categories}
          features={features}
        />
      </div>

      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-label="Loading events"
          aria-busy="true"
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="h-44 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-100 rounded-full w-20" />
                  <div className="h-6 bg-gray-100 rounded-full w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20" role="status">
          <Calendar
            className="w-12 h-12 text-gray-300 mx-auto mb-4"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No events found
          </h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your filters to find more events.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-label={`${events.length} events found`}
        >
          {events.map(event => (
            <EventCard
              key={event.event_id}
              event={event}
              savedEventIds={savedEventIds}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse"
                >
                  <div className="h-44 bg-gray-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <EventsContent />
      </Suspense>
    </div>
  )
}
