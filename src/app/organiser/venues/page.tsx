'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { MapPin, Plus, Building } from 'lucide-react'
import Link from 'next/link'

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('venue')
        .select(`
          venue_id,
          name,
          capacity,
          address (address_line1, city, postcode),
          venue_accessibility (
            accessibility_feature (name, category)
          )
        `)
        .order('name')

      setVenues(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Venues</h1>
            <p className="text-gray-500 mt-1">
              {loading ? 'Loading...' : `${venues.length} venue${venues.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/organiser/venues/new"
            className="bg-indigo-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add venue
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse space-y-3">
                <div className="h-5 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-100 rounded-full w-20" />
                  <div className="h-6 bg-gray-100 rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-20">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No venues yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Add a venue before creating your first event.
            </p>
            <Link
              href="/organiser/venues/new"
              className="bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add venue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {venues.map((venue: any) => (
              <div
                key={venue.venue_id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-200 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{venue.name}</h3>

                {venue.address && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {venue.address.address_line1}, {venue.address.city}, {venue.address.postcode}
                    </span>
                  </div>
                )}

                {venue.capacity && (
                  <p className="text-xs text-gray-400 mb-3">
                    Capacity: {venue.capacity.toLocaleString()}
                  </p>
                )}

                {venue.venue_accessibility?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {venue.venue_accessibility.slice(0, 4).map((va: any) => (
                      <span
                        key={va.accessibility_feature?.name}
                        className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full"
                      >
                        {va.accessibility_feature?.name}
                      </span>
                    ))}
                    {venue.venue_accessibility.length > 4 && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">
                        +{venue.venue_accessibility.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
