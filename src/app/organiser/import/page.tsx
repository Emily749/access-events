'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import {
  ChevronLeft, Search, Download, CheckCircle, XCircle,
  Sparkles, AlertCircle, Check, X, Calendar, MapPin,
  ExternalLink, CheckCheck, XSquare,
} from 'lucide-react'
import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'

type PreviewEvent = {
  _raw:              any
  title:             string
  venueName:         string
  city:              string
  description:       string
  startDate:         string
  ticketUrl:         string | null
  category:          string
  featuresExtracted: string[]
  aiConfidence:      string
  aiSummary:         string
}

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

const confidenceColors: Record<string, string> = {
  high:   'bg-green-50 text-green-700 border-green-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
}

export default function ImportEventsPage() {
  const { appUser } = useAuth()

  const [query,    setQuery]    = useState('')
  const [location, setLocation] = useState('London, UK')
  const [step,     setStep]     = useState<'search' | 'preview' | 'done'>('search')
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const [previews,  setPreviews]  = useState<PreviewEvent[]>([])
  const [selected,  setSelected]  = useState<Set<number>>(new Set())
  const [results,   setResults]   = useState<ImportResult[]>([])
  const [errors,    setErrors]    = useState<ImportError[]>([])
  const [summary,   setSummary]   = useState<{ imported: number; failed: number } | null>(null)

  // ── Step 1: fetch previews ──────────────────────────────────────
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!appUser) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/import-events', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          query,
          location,
          organiserId: appUser.user_id,
          mode:        'preview',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch events')
      } else if (!data.previews?.length) {
        setError(data.message || 'No events found. Try different keywords.')
      } else {
        setPreviews(data.previews)
        // Select all by default
        setSelected(new Set(data.previews.map((_: any, i: number) => i)))
        setStep('preview')
      }
    } catch (err: any) {
      setError(err.message)
    }

    setLoading(false)
  }

  // ── Step 2: save approved events ───────────────────────────────
  async function handleConfirm() {
    if (!appUser || selected.size === 0) return
    setSaving(true)
    setError('')

    const approved = previews
      .filter((_, i) => selected.has(i))
      .map(p => p._raw)

    try {
      const res = await fetch('/api/import-events', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          location,
          organiserId: appUser.user_id,
          mode:        'confirm',
          approved,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Import failed')
      } else {
        setResults(data.results || [])
        setErrors(data.errors   || [])
        setSummary({ imported: data.imported, failed: data.failed })
        setStep('done')
      }
    } catch (err: any) {
      setError(err.message)
    }

    setSaving(false)
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function selectAll()   { setSelected(new Set(previews.map((_, i) => i))) }
  function deselectAll() { setSelected(new Set()) }

  function reset() {
    setStep('search')
    setPreviews([])
    setSelected(new Set())
    setResults([])
    setErrors([])
    setSummary(null)
    setError('')
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Import events from Ticketmaster
          </h1>
          <p className="text-gray-500">
            Search for UK events, review the accessibility information we detect,
            then choose which events to import.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { key: 'search',  label: '1. Search'  },
            { key: 'preview', label: '2. Review'  },
            { key: 'done',    label: '3. Import'  },
          ].map(({ key, label }, i, arr) => (
            <div key={key} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-sm font-medium ${
                step === key
                  ? 'text-indigo-600'
                  : ['search', 'preview', 'done'].indexOf(step) > i
                    ? 'text-green-600'
                    : 'text-gray-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === key
                    ? 'bg-indigo-600 text-white'
                    : ['search', 'preview', 'done'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {['search', 'preview', 'done'].indexOf(step) > i
                    ? <Check className="w-3 h-3" />
                    : i + 1
                  }
                </div>
                {label}
              </div>
              {i < arr.length - 1 && (
                <div className={`h-px w-8 ${
                  ['search', 'preview', 'done'].indexOf(step) > i ? 'bg-green-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6" role="alert">
            {error}
          </div>
        )}

        {/* ── STEP 1: Search ── */}
        {step === 'search' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Search Ticketmaster</h2>
            <form onSubmit={handleSearch} className="space-y-4">
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
                  placeholder="e.g. Hamilton, wheelchair accessible, relaxed performance"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Tip: search for show names, accessibility keywords, or general terms like "theatre"
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
                    Searching Ticketmaster...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search events
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 2: Preview & select ── */}
        {step === 'preview' && (
          <div className="space-y-5">

            {/* Toolbar */}
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {previews.length} event{previews.length !== 1 ? 's' : ''} found
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {selected.size} selected for import
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={selectAll}
                  className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Select all
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-gray-500 font-medium hover:underline flex items-center gap-1"
                >
                  <XSquare className="w-3.5 h-3.5" />
                  Deselect all
                </button>
                <button
                  onClick={reset}
                  className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                >
                  New search
                </button>
              </div>
            </div>

            {/* Preview cards */}
            <div className="space-y-3">
              {previews.map((preview, i) => {
                const isSelected = selected.has(i)
                return (
                  <div
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className={`bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 opacity-60'
                    }`}
                    role="checkbox"
                    aria-checked={isSelected}
                  >
                    <div className="flex items-start gap-4">

                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      <div className="flex-1 min-w-0">

                        {/* Title and badges */}
                        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                            {preview.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${confidenceColors[preview.aiConfidence]}`}>
                              {preview.aiConfidence} confidence
                            </span>
                            {preview.ticketUrl && (
                              <a
                                href={preview.ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-indigo-500 hover:text-indigo-700"
                                aria-label="View on Ticketmaster"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateShort(preview.startDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {preview.venueName}{preview.city && ` · ${preview.city}`}
                          </span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {preview.category}
                          </span>
                        </div>

                        {/* Description */}
                        {preview.description && (
                          <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">
                            {preview.description}
                          </p>
                        )}

                        {/* AI summary */}
                        {preview.aiSummary && (
                          <div className="flex items-start gap-1.5 mb-3">
                            <Sparkles className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-indigo-700 leading-relaxed">
                              {preview.aiSummary}
                            </p>
                          </div>
                        )}

                        {/* Features */}
                        {preview.featuresExtracted.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {preview.featuresExtracted.map(f => (
                              <span
                                key={f}
                                className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            No accessibility features detected — you can add them manually after import.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Confirm button */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  Ready to import {selected.size} event{selected.size !== 1 ? 's' : ''}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Deselected events will not be saved
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="border border-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving || selected.size === 0}
                  className="bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Import {selected.size} event{selected.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 'done' && summary && (
          <div className="space-y-6">

            {/* Summary banner */}
            <div className={`rounded-2xl p-5 border ${
              summary.imported > 0
                ? 'bg-green-50 border-green-100'
                : 'bg-amber-50 border-amber-100'
            }`}>
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
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${confidenceColors[result.aiConfidence]}`}>
                              {result.aiConfidence} confidence
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

                      {result.featuresExtracted.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {result.featuresExtracted.map(f => (
                            <span key={f} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full">
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No accessibility features detected — add them via the edit page.
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

            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="text-sm text-indigo-600 font-medium hover:underline"
              >
                Import more events
              </button>
              <Link
                href="/organiser/dashboard"
                className="text-sm text-gray-500 hover:underline"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
