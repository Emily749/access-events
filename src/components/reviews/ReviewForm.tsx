'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

function StarInput({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-40">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                i <= (hover || value)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-200 fill-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ReviewForm({
  eventId,
  onSubmitted,
}: {
  eventId: number
  onSubmitted: () => void
}) {
  const { appUser } = useAuth()
  const [overallRating, setOverallRating] = useState(0)
  const [accessibilityRating, setAccessibilityRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!appUser) return
    if (overallRating === 0 || accessibilityRating === 0) {
      setError('Please provide both ratings')
      return
    }

    setLoading(true)
    setError('')

    const { error: insertError } = await supabase
      .from('review')
      .insert({
        user_id: appUser.user_id,
        event_id: eventId,
        overall_rating: overallRating,
        accessibility_rating: accessibilityRating,
        comment: comment || null,
        is_verified_attendee: false,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('You have already reviewed this event')
      } else {
        setError('Failed to submit review. Please try again.')
      }
      setLoading(false)
      return
    }

    setLoading(false)
    onSubmitted()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="font-semibold text-gray-900 mb-5">Leave a review</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-5">
        <StarInput
          value={overallRating}
          onChange={setOverallRating}
          label="Overall rating"
        />
        <StarInput
          value={accessibilityRating}
          onChange={setAccessibilityRating}
          label="Accessibility rating"
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Share your experience of the accessibility provision..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  )
}
