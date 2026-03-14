'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { X, Flag } from 'lucide-react'

export default function ReportForm({
  eventId,
  features,
  onClose,
  onSubmitted,
}: {
  eventId: number
  features: any[]
  onClose: () => void
  onSubmitted: () => void
}) {
  const { appUser } = useAuth()
  const [issueTypes, setIssueTypes] = useState<any[]>([])
  const [form, setForm] = useState({
    feature_id: '',
    issue_type: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('issue_type')
        .select('*')
        .order('label')
      setIssueTypes(data || [])
    }
    load()
  }, [])

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!appUser) return
    setError('')

    if (!form.feature_id) { setError('Please select a feature'); return }
    if (!form.issue_type) { setError('Please select an issue type'); return }
    if (!form.description.trim()) { setError('Please describe the issue'); return }

    setLoading(true)

    const { error: insertError } = await supabase
      .from('accessibility_report')
      .insert({
        user_id: appUser.user_id,
        event_id: eventId,
        feature_id: Number(form.feature_id),
        issue_type: form.issue_type,
        description: form.description.trim(),
        status_code: 'open',
      })

    if (insertError) {
      setError('Failed to submit report. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    onSubmitted()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2
              id="report-dialog-title"
              className="text-lg font-semibold text-gray-900"
            >
              Report accessibility issue
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close report form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          Help us keep accessibility information accurate. Reports are reviewed by our team.
        </p>

        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="report-feature"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Which accessibility feature has an issue?
            </label>
            <select
              id="report-feature"
              required
              value={form.feature_id}
              onChange={e => update('feature_id', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a feature</option>
              {features.map((ea: any) => (
                <option
                  key={ea.accessibility_feature?.feature_id || ea.feature_id}
                  value={ea.accessibility_feature?.feature_id || ea.feature_id}
                >
                  {ea.accessibility_feature?.name || ea.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="report-issue-type"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Type of issue
            </label>
            <select
              id="report-issue-type"
              required
              value={form.issue_type}
              onChange={e => update('issue_type', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select issue type</option>
              {issueTypes.map((it: any) => (
                <option key={it.issue_type} value={it.issue_type}>
                  {it.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="report-description"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Describe the issue
            </label>
            <textarea
              id="report-description"
              required
              value={form.description}
              onChange={e => update('description', e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Please describe what was inaccurate, missing or poorly implemented..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-500 text-white font-medium py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
