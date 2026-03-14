'use client'

import Link from 'next/link'
import { Calendar, MapPin, Heart, Tag } from 'lucide-react'
import { formatDateShort, formatTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { toggleSaveEvent } from '@/lib/queries'
import { useState } from 'react'

export default function EventCard({ event, savedEventIds = [] }: {
  event: any
  savedEventIds?: number[]
}) {
  const { appUser } = useAuth()
  const [isSaved, setIsSaved] = useState(savedEventIds.includes(event.event_id))
  const [savingLoading, setSavingLoading] = useState(false)

  const primaryImage = event.event_image?.find((i: any) => i.is_primary)
  const features = event.event_accessibility?.slice(0, 3) || []
  const extraFeatures = (event.event_accessibility?.length || 0) - 3

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (!appUser) {
      window.location.href = '/auth/login'
      return
    }
    setSavingLoading(true)
    const saved = await toggleSaveEvent(appUser.user_id, event.event_id)
    setIsSaved(saved)
    setSavingLoading(false)
  }

  return (
    <Link href={`/events/${event.event_id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all">

        {/* Image */}
        <div className="relative h-44 bg-indigo-50 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt_text || event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-indigo-200" />
            </div>
          )}

          {/* Free badge */}
          {event.is_free && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Free
            </span>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={savingLoading}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isSaved
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-400 hover:text-red-500'
            }`}
            aria-label={isSaved ? 'Unsave event' : 'Save event'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">

          {/* Category */}
          {event.event_category && (
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3 h-3 text-indigo-400" />
              <span className="text-indigo-600 text-xs font-medium">
                {event.event_category.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Date and location */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDateShort(event.start_time)} · {formatTime(event.start_time)}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {event.venue.name}
                  {event.venue.address?.city && ` · ${event.venue.address.city}`}
                </span>
              </div>
            )}
          </div>

          {/* Accessibility features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {features.map((ea: any) => (
                <span
                  key={ea.accessibility_feature?.name}
                  className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full"
                >
                  {ea.accessibility_feature?.name}
                </span>
              ))}
              {extraFeatures > 0 && (
                <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">
                  +{extraFeatures} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
