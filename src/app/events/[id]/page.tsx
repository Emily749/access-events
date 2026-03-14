'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import FeatureBadge from '@/components/accessibility/FeatureBadge'
import ReviewCard from '@/components/reviews/ReviewCard'
import ReviewForm from '@/components/reviews/ReviewForm'
import ReportForm from '@/components/reports/ReportForm'
import { getEventById, toggleSaveEvent } from '@/lib/queries'
import { useAuth } from '@/context/AuthContext'
import { formatDate, formatTime } from '@/lib/utils'
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Heart,
  ChevronLeft,
  Star,
  Bus,
  ParkingCircle,
  Flag,
} from 'lucide-react'
import Link from 'next/link'

export default function EventDetailPage() {
  const { id } = useParams()
  const { appUser } = useAuth()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)

  async function fetchEvent() {
    const data = await getEventById(Number(id))
    setEvent(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchEvent()
  }, [id])

  async function handleSave() {
    if (!appUser) {
      window.location.href = '/auth/login'
      return
    }
    setSaveLoading(true)
    const saved = await toggleSaveEvent(appUser.user_id, event.event_id)
    setIsSaved(saved)
    setSaveLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
          <Link href="/events" className="text-indigo-600 hover:underline text-sm">
            Back to events
          </Link>
        </div>
      </div>
    )
  }

  const primaryImage = event.event_image?.find((i: any) => i.is_primary)
  const featuresByCategory = event.event_accessibility?.reduce((acc: any, ea: any) => {
    const cat = ea.accessibility_feature?.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ea)
    return acc
  }, {})

  const avgAccessibility = event.review?.length
    ? (event.review.reduce((sum: number, r: any) => sum + r.accessibility_rating, 0) / event.review.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to events
        </Link>

        {/* Hero image */}
        {primaryImage && (
          <div className="h-64 sm:h-80 rounded-2xl overflow-hidden mb-8 bg-indigo-50">
            <img
              src={primaryImage.url}
              alt={primaryImage.alt_text || event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title and meta */}
            <div>
              {event.event_category && (
                <span className="text-indigo-600 text-sm font-medium">
                  {event.event_category.name}
                </span>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-4">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  {formatDate(event.start_time)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  {formatTime(event.start_time)} – {formatTime(event.end_time)}
                </div>
                {event.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    {event.venue.name}
                    {event.venue.address?.city && `, ${event.venue.address.city}`}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  About this event
                </h2>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Accessibility features */}
            {featuresByCategory && Object.keys(featuresByCategory).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Accessibility provision
                </h2>
                <div className="space-y-5">
                  {Object.entries(featuresByCategory).map(([category, features]: [string, any]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{category}</h3>
                      <div className="space-y-2">
                        {features.map((ea: any) => (
                          <div
                            key={ea.accessibility_feature?.name}
                            className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FeatureBadge
                                  name={ea.accessibility_feature?.name}
                                  category={ea.accessibility_feature?.category}
                                />
                                {ea.is_confirmed && (
                                  <span className="text-xs text-green-600 font-medium">
                                    ✓ Confirmed
                                  </span>
                                )}
                              </div>
                              {ea.details && (
                                <p className="text-sm text-gray-600 mt-1">{ea.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venue accessibility */}
            {event.venue?.venue_accessibility?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Venue accessibility
                </h2>
                <div className="flex flex-wrap gap-2">
                  {event.venue.venue_accessibility.map((va: any) => (
                    <FeatureBadge
                      key={va.accessibility_feature?.name}
                      name={va.accessibility_feature?.name}
                      category={va.accessibility_feature?.category}
                    />
                  ))}
                </div>
                {event.venue.transport_info && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                    <Bus className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p>{event.venue.transport_info}</p>
                  </div>
                )}
                {event.venue.parking_info && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                    <ParkingCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p>{event.venue.parking_info}</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Reviews {event.review?.length > 0 && `(${event.review.length})`}
                </h2>
                {appUser && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                    aria-label="Write a review for this event"
                  >
                    Write a review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-6">
                  <ReviewForm
                    eventId={event.event_id}
                    onSubmitted={() => {
                      setShowReviewForm(false)
                      fetchEvent()
                    }}
                  />
                </div>
              )}

              {event.review?.length > 0 ? (
                <div className="space-y-4">
                  {event.review.map((review: any) => (
                    <ReviewCard key={review.review_id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl">
                  <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No reviews yet. Be the first to review this event.
                  </p>
                </div>
              )}
            </div>

            {/* Report accessibility issue */}
            {appUser && event.event_accessibility?.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <button
                  onClick={() => setShowReportForm(true)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Report an accessibility issue with this event"
                >
                  <Flag className="w-4 h-4" />
                  Report an accessibility issue
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Ticket / save card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24">
              <div className="mb-4">
                {event.is_free ? (
                  <span className="text-2xl font-bold text-green-600">Free</span>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">Ticketed event</span>
                )}
              </div>

              {avgAccessibility && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 rounded-xl">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-indigo-700">
                    {avgAccessibility} accessibility rating
                  </span>
                  <span className="text-xs text-indigo-500">
                    ({event.review.length} review{event.review.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2 mb-3"
                  aria-label={`Get tickets for ${event.title} (opens in new tab)`}
                >
                  Get tickets
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={handleSave}
                disabled={saveLoading}
                className={`w-full font-medium py-3 rounded-xl border-2 transition-all text-sm flex items-center justify-center gap-2 ${
                  isSaved
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
                aria-label={isSaved ? 'Remove event from saved' : 'Save this event'}
                aria-pressed={isSaved}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save event'}
              </button>

              {!appUser && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  <Link href="/auth/login" className="text-indigo-600 hover:underline">
                    Log in
                  </Link>{' '}
                  to save events
                </p>
              )}
            </div>

            {/* Organiser */}
            {event.app_user && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Organised by</h3>
                <p className="font-medium text-gray-900">{event.app_user.username}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report form modal */}
      {showReportForm && (
        <ReportForm
          eventId={event.event_id}
          features={event.event_accessibility || []}
          onClose={() => setShowReportForm(false)}
          onSubmitted={() => {
            setShowReportForm(false)
          }}
        />
      )}
    </div>
  )
}
