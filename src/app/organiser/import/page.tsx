'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeft, Search, Download, CheckCircle, XCircle, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type ImportResult = {
  title:             string
  eventId:           number
  featuresExtracted: string[]
  aiConfidence:      string
  aiSummary:         string
}

type ImportError = {
  title: string
  error: string
}

export default function ImportEventsPage() {
  const { appUser } = useAuth()
  const [query,    setQuery]    = useState('')
  const [location, setLocation] = useState('London, UK')
  const [loading,  setLoading]  = useState(false)
  const [results,  setResults]  = useState<ImportResult[]>([])
  const [errors,   setErrors]   = useState<ImportError[]>([])
  const [done,     setDone]     = useState(false)
  const [summary,  setSummary]  = useState<{ imported: number; failed: number } | null>(null)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!appUser) return

    setLoading(true)
    setDone(false)
    setResults([])
    setErrors([])
    setSummary(null)

    try {
      const res = await fetch('/api/import-events', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          query,
          location,
          organiserId: appUser.user_id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors([{ title: 'Request failed', error: data.error || 'Unknown error' }])
      } else {
        setResults(data.results || [])
        setErrors(data.errors   || [])
        setSummary({ imported: data.imported, failed: data.failed })
      }
    } catch (err: any) {
      setErrors([{ title: 'Network error', error: err.message }])
    }

    setLoading(false)
    setDone(true)
  }

  const confidenceColors: Record<string, string> = {
    high:   'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    low:    'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link
          href="/organiser/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Import events from Eventbrite
          </h1>
          <p className="text-gray-500">
            Search Eventbrite for UK events and let AI automatically extract
            accessibility information from each event description.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <h2 className="font-semibold text-indigo-900 text-sm">How it works</h2>
          </div>
          <ol className="space-y-1.5 text-sm text-indigo-800">
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">1.</span>
              Enter a search term and UK location to find events on Eventbrite
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">2.</span>
              Each event description is sent to Claude AI for accessibility analysis
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">3.</span>
              Matched accessibility features are automatically saved to each event
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">4.</span>
              You can then edit any event to add or correct the accessibility info
            </li>
          </ol>
        </div>

        {/* Search form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-5">Search Eventbrite</h2>
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1.5">
                Search term
              </label>
              <input
                id="query"
                type="text"
                required
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. accessible theatre, BSL, relaxed performance"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tip: search for accessibility keywords to find events more likely to have accessibility info
              </p>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
                Location
              </label>
              <select
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {[
                  'London, UK',
                  'Birmingham, UK',
                  'Manchester, UK',
                  'Edinburgh, UK',
                  'Bristol, UK',
                  'Leeds, UK',
                  'Glasgow, UK',
                  'Liverpool, UK',
                  'Cardiff, UK',
                  'Newcastle, UK',
                ].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching and analysing with AI...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search and import events
                </>
              )}
            </button>
          </form>

          {loading && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 font-medium mb-2">This may take 30–60 seconds</p>
              <div className="space-y-1.5 text-xs text-gray-500">
                <p>⏳ Fetching events from Eventbrite...</p>
                <p>🤖 Sending each description to Claude AI for analysis...</p>
                <p>💾 Saving matched accessibility features to database...</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {done && summary && (
          <div className="space-y-6">

            {/* Summary */}
            <div className={`rounded-2xl p-5 border ${summary.imported > 0 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                {summary.imported > 0
                  ? <CheckCircle className="w-5 h-5 text-green-600" />
                  : <AlertCircle className="w-5 h-5 text-amber-600" />
                }
                <h3 className={`font-semibold ${summary.imported > 0 ? 'text-green-900' : 'text-amber-900'}`}>
                  Import complete
                </h3>
              </div>
              <p className={`text-sm ${summary.imported > 0 ? 'text-green-700' : 'text-amber-700'}`}>
                {summary.imported} event{summary.imported !== 1 ? 's' : ''} imported successfully
                {summary.failed > 0 && `, ${summary.failed} failed`}.
              </p>
            </div>

            {/* Successful imports */}
            {results.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Imported events ({results.length})
                  </h3>
                  <Link
                    href="/organiser/dashboard"
                    className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    View in dashboard
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {results.map((result, i) => (
                    <div key={i} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/events/${result.eventId}`}
                            className="font-medium text-gray-900 hover:text-indigo-600 transition-colors text-sm"
                          >
                            {result.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColors[result.aiConfidence]}`}>
                              AI confidence: {result.aiConfidence}
                            </span>
                            <span className="text-xs text-gray-400">
                              {result.featuresExtracted.length} feature{result.featuresExtracted.length !== 1 ? 's' : ''} extracted
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            href={`/events/${result.eventId}`}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            View
                          </Link>
                          <Link
                            href={`/organiser/events/${result.eventId}/edit`}
                            className="text-xs text-gray-400 hover:text-indigo-600 hover:underline"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>

                      {result.aiSummary && (
                        <p className="text-xs text-gray-500 mb-2 flex items-start gap-1.5">
                          <Sparkles className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                          {result.aiSummary}
                        </p>
                      )}

                      {result.featuresExtracted.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {result.featuresExtracted.map(f => (
                            <span
                              key={f}
                              className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {result.featuresExtracted.length === 0 && (
                        <p className="text-xs text-gray-400 italic">
                          No accessibility features detected in description — you can add them manually via the edit page.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Failed imports ({errors.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {errors.map((error, i) => (
                    <div key={i} className="px-6 py-3">
                      <p className="text-sm font-medium text-gray-700">{error.title}</p>
                      <p className="text-xs text-red-500 mt-0.5">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Try again */}
            <button
              onClick={() => { setDone(false); setResults([]); setErrors([]); setSummary(null) }}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              Run another import
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
