'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/queries'
import { formatDate, formatTime } from '@/lib/utils'
import { Bell, CheckCheck, Calendar } from 'lucide-react'
import Link from 'next/link'

const typeColors: Record<string, string> = {
  reminder:       'bg-blue-50 text-blue-700 border-blue-100',
  update:         'bg-amber-50 text-amber-700 border-amber-100',
  cancellation:   'bg-red-50 text-red-700 border-red-100',
  recommendation: 'bg-purple-50 text-purple-700 border-purple-100',
  review_prompt:  'bg-green-50 text-green-700 border-green-100',
  report_update:  'bg-indigo-50 text-indigo-700 border-indigo-100',
}

const typeLabels: Record<string, string> = {
  reminder:       'Reminder',
  update:         'Update',
  cancellation:   'Cancelled',
  recommendation: 'For you',
  review_prompt:  'Review',
  report_update:  'Report',
}

export default function NotificationsPage() {
  const { appUser } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchNotifications() {
    if (!appUser) return
    const data = await getNotifications(appUser.user_id)
    setNotifications(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [appUser])

  async function handleMarkRead(notificationId: number) {
    await markNotificationRead(notificationId)
    setNotifications(prev =>
      prev.map(n =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      )
    )
  }

  async function handleMarkAllRead() {
    if (!appUser) return
    await markAllNotificationsRead(appUser.user_id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Notifications</h1>
            <p className="text-gray-500 text-sm">
              {loading
                ? 'Loading...'
                : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              aria-label="Mark all notifications as read"
            >
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-3"
              >
                <div className="flex gap-3">
                  <div className="h-6 bg-gray-100 rounded-full w-20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-500 text-sm">
              You will be notified about saved events, recommendations and updates here.
            </p>
          </div>
        ) : (
          <div
            className="space-y-3"
            role="list"
            aria-label="All notifications"
          >
            {notifications.map(notif => {
              const colorClass = typeColors[notif.type_code] || 'bg-gray-50 text-gray-700 border-gray-100'
              const label = typeLabels[notif.type_code] || notif.type_code

              return (
                <div
                  key={notif.notification_id}
                  role="listitem"
                  className={`bg-white rounded-2xl border p-5 transition-colors ${
                    notif.is_read
                      ? 'border-gray-200'
                      : 'border-indigo-200 bg-indigo-50/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium border ${colorClass}`}
                          aria-label={`Notification type: ${label}`}
                        >
                          {label}
                        </span>
                        {!notif.is_read && (
                          <span
                            className="w-2 h-2 bg-indigo-500 rounded-full"
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      <p className={`text-sm leading-relaxed mb-3 ${
                        notif.is_read ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-xs text-gray-400">
                          {formatDate(notif.sent_at)} at {formatTime(notif.sent_at)}
                        </span>

                        {notif.event && (
                          <Link
                            href={`/events/${notif.event.event_id}`}
                            onClick={() => handleMarkRead(notif.notification_id)}
                            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                            aria-label={`View event: ${notif.event.title}`}
                          >
                            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                            {notif.event.title}
                          </Link>
                        )}

                        {!notif.is_read && (
                          <button
                            onClick={() => handleMarkRead(notif.notification_id)}
                            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                            aria-label="Mark this notification as read"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
