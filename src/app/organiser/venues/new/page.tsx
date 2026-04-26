'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { getAccessibilityFeatures } from '@/lib/queries'
import { useEffect } from 'react'
import { ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'

export default function NewVenuePage() {
  const { appUser } = useAuth()
  const [features, setFeatures] = useState<any[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    address_line1: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    capacity: '',
    transport_info: '',
    parking_info: '',
    latitude: '',
    longitude: '',
  })

  useEffect(() => {
    async function load() {
      const feats = await getAccessibilityFeatures()
      setFeatures(feats)
    }
    load()
  }, [])

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleFeature(id: number) {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!appUser) return
    setError('')

    if (!form.name.trim()) { setError('Venue name is required'); return }
    if (!form.address_line1.trim()) { setError('Address is required'); return }
    if (!form.city.trim()) { setError('City is required'); return }
    if (!form.postcode.trim()) { setError('Postcode is required'); return }

    setLoading(true)

    const { data: addressData, error: addressError } = await supabase
      .from('address')
      .insert({
        address_line1: form.address_line1.trim(),
        city: form.city.trim(),
        postcode: form.postcode.trim(),
        country: form.country.trim(),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      })
      .select('address_id')
      .single()

    if (addressError || !addressData) {
      setError('Failed to save address. Please try again.')
      setLoading(false)
      return
    }

    const { data: venueData, error: venueError } = await supabase
      .from('venue')
      .insert({
        address_id: addressData.address_id,
        name: form.name.trim(),
        capacity: form.capacity ? parseInt(form.capacity) : null,
        transport_info: form.transport_info.trim() || null,
        parking_info: form.parking_info.trim() || null,
      })
      .select('venue_id')
      .single()

    if (venueError || !venueData) {
      setError('Failed to create venue. Please try again.')
      setLoading(false)
      return
    }

    if (selectedFeatures.length > 0) {
      await supabase.from('venue_accessibility').insert(
        selectedFeatures.map(feature_id => ({
          venue_id: venueData.venue_id,
          feature_id,
          is_confirmed: true,
        }))
      )
    }

    window.location.href = '/organiser/venues'
  }

  const featuresByCategory = features.reduce((acc: any, f: any) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link
          href="/organiser/venues"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to venues
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add new venue</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Venue details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Venue details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Venue name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Manchester Central"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Capacity <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={e => update('capacity', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 500"
                min="1"
              />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Address</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address line 1
              </label>
              <input
                type="text"
                required
                value={form.address_line1}
                onChange={e => update('address_line1', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 123 High Street"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Manchester"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Postcode
                </label>
                <input
                  type="text"
                  required
                  value={form.postcode}
                  onChange={e => update('postcode', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. M2 3GX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={form.country}
                onChange={e => update('country', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Latitude <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={e => update('latitude', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 53.4808"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Longitude <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={e => update('longitude', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. -2.2426"
                />
              </div>
            </div>
          </div>

          {/* Travel info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Travel information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Transport info <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.transport_info}
                onChange={e => update('transport_info', e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="e.g. Nearest station: Manchester Piccadilly, 5 min walk. Buses 42, 43 stop outside."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parking info <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.parking_info}
                onChange={e => update('parking_info', e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="e.g. NCP car park 2 min walk. Blue badge spaces available on street."
              />
            </div>
          </div>

          {/* Venue accessibility features */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-1">
              Venue accessibility features
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Select the permanent accessibility features available at this venue. These will appear on all events held here.
            </p>

            <div className="space-y-6">
              {Object.entries(featuresByCategory).map(([category, feats]: [string, any]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {feats.map((f: any) => (
                      <button
                        key={f.feature_id}
                        type="button"
                        onClick={() => toggleFeature(f.feature_id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                          selectedFeatures.includes(f.feature_id)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {selectedFeatures.includes(f.feature_id) && (
                          <span className="mr-1">✓</span>
                        )}
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedFeatures.length > 0 && (
              <p className="text-sm text-indigo-600 mt-4 font-medium">
                {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Adding venue...' : 'Add venue'}
          </button>
        </form>
      </div>
    </div>
  )
}
