'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDateShort, formatTime } from '@/lib/utils'
import Link from 'next/link'
import {
  Plus,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Trash2,
  BarChart2,
  Star,
  Users,
  Building,
} from 'lucide-react'

export default function OrganiserDashboard() {
  const { appUser } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    totalReviews: 0,
    avgAccessibility: 0,
  })

  async function fetchEvents() {
    if (!appUser) return

    const { data, error } = await supabase
      .from('event')
      .select(`
        event_id,
        title,
        start_time,
        end_time,
        status,
        is_free,
        venue (name, address (city)),
        event_category (name),
        event_accessibility (feature_id),
        review (accessibility_rating)
      `)
      .eq('organiser_id', appUser.user_id)
      .order('start_time', { ascending: false })

    if (!error && data) {
      setEvents(data)

      const upcoming = data.filter(e => e.status === 'upcoming').length
      const allReviews = data.flatMap(e => e.review || [])
      const avgAcc = allReviews.length
        ? allReviews.reduce((sum: number, r: any) => sum + r.accessibility_rating, 0) / allReviews.length
        : 0

      setStats({
        total: data.length,
        upcoming,
        totalReviews: allReviews.length,
        avgAccessibility: Math.round(avgAcc * 10) / 10,
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [appUser])

  async function handleDelete(eventId: number) {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return
    setDeleting(eventId)
    await supabase.from('event').delete().eq('event_id', eventId)
    await fetchEvents()
    setDeleting(null)
  }

  const statusColors: Record<string, string> = {
    upcoming:  'bg-green-50 text-green-700',
    draft:     'bg-gray-100 text-gray-600',
    ongoing:   'bg-blue-50 text-blue-700',
    completed: 'bg-purple-50 text-purple-700',
    cancelled: 'bg-red-50 text-red-700',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organiser dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your events and accessibility information</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/organiser/venues"
              className="border border-gray-200 bg-white text-gray-700 font-medium px-5 py-2.5 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-colors text-sm flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              Venues
            </Link>
            <Link
              href="/organiser/events/new"
              className="bg-indigo-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New event
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total events',       value: stats.total,           icon: Calendar  },
            { label: 'Upcoming',           value: stats.upcoming,        icon: BarChart2 },
            { label: 'Total reviews',      value: stats.totalReviews,    icon: Users     },
            { label: 'Avg accessibility',  value: stats.avgAccessibility || '—', icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Events table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your events</h2>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-500 text-sm mb-6">
                Create your first event to get started.
              </p>
              <Link
                href="/organiser/events/new"
                className="bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create event
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map(event => {
                const avgAcc = event.review?.length
                  ? (event.review.reduce((s: number, r: any) => s + r.accessibility_rating, 0) / event.review.length).toFixed(1)
                  : null

                return (
                  <div key={event.event_id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {event.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[event.status]}`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateShort(event.start_time)} · {formatTime(event.start_time)}
                        </span>
                        {event.venue && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            {event.venue.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-indigo-600">
                          {event.event_accessibility?.length || 0} accessibility features
                        </span>
                        {avgAcc && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {avgAcc} accessibility
                          </span>
                        )}
                        {event.review?.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {event.review.length} review{event.review.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/events/${event.event_id}`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View event"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/organiser/events/${event.event_id}/edit`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(event.event_id)}
                        disabled={deleting === event.event_id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
