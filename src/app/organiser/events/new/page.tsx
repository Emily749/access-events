'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { getAccessibilityFeatures, getEventCategories } from '@/lib/queries'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'

export default function NewEventPage() {
  const { appUser } = useAuth()
  const router = useRouter()

  const [categories, setCategories] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [features, setFeatures] = useState<any[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    venue_id: '',
    start_time: '',
    end_time: '',
    ticket_url: '',
    is_free: false,
    status: 'upcoming',
  })

  useEffect(() => {
    async function load() {
      const [cats, feats, venueData] = await Promise.all([
        getEventCategories(),
        getAccessibilityFeatures(),
        supabase.from('venue').select('venue_id, name, address(city)').order('name'),
      ])
      setCategories(cats)
      setFeatures(feats)
      setVenues(venueData.data || [])
    }
    load()
  }, [])

  function toggleFeature(id: number) {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  function update(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!appUser) return
    setError('')

    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.category_id) { setError('Please select a category'); return }
    if (!form.venue_id) { setError('Please select a venue'); return }
    if (!form.start_time) { setError('Start time is required'); return }
    if (!form.end_time) { setError('End time is required'); return }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError('End time must be after start time')
      return
    }

    setLoading(true)

    const { data: eventData, error: eventError } = await supabase
      .from('event')
      .insert({
        organiser_id: appUser.user_id,
        venue_id: Number(form.venue_id),
        category_id: Number(form.category_id),
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_time: form.start_time,
        end_time: form.end_time,
        status: form.status,
        ticket_url: form.ticket_url.trim() || null,
        is_free: form.is_free,
      })
      .select('event_id')
      .single()

    if (eventError || !eventData) {
      setError('Failed to create event. Please try again.')
      setLoading(false)
      return
    }

    if (selectedFeatures.length > 0) {
      await supabase.from('event_accessibility').insert(
        selectedFeatures.map(feature_id => ({
          event_id: eventData.event_id,
          feature_id,
          is_confirmed: true,
        }))
      )
    }

    window.location.href = '/organiser/dashboard'
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
          href="/organiser/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create new event</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Event details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Event title
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => update('title', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Relaxed Concert: Beethoven Evening"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Describe your event and its accessibility provision..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  required
                  value={form.category_id}
                  onChange={e => update('category_id', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Venue
                </label>
                <select
                  required
                  value={form.venue_id}
                  onChange={e => update('venue_id', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select venue</option>
                  {venues.map((v: any) => (
                    <option key={v.venue_id} value={v.venue_id}>
                      {v.name}{v.address?.city ? ` — ${v.address.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start date and time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.start_time}
                  onChange={e => update('start_time', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End date and time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.end_time}
                  onChange={e => update('end_time', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ticket URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.ticket_url}
                  onChange={e => update('ticket_url', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://tickets.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={e => update('status', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => update('is_free', !form.is_free)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.is_free
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {form.is_free && <Check className="w-4 h-4" />}
                {form.is_free ? 'Free event' : 'Mark as free event'}
              </button>
            </div>
          </div>

          {/* Accessibility features */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Accessibility features</h2>
            <p className="text-gray-500 text-sm mb-5">
              Select all accessibility features that will be available at your event.
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Creating event...' : 'Create event'}
          </button>
        </form>
      </div>
    </div>
  )
}
