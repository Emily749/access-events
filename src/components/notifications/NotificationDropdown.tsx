'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, Calendar } from 'lucide-react'
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/queries'
import { useAuth } from '@/context/AuthContext'
import { formatDateShort } from '@/lib/utils'

const typeColors: Record<string, string> = {
  reminder:       'bg-blue-50 text-blue-600',
  update:         'bg-amber-50 text-amber-600',
  cancellation:   'bg-red-50 text-red-600',
  recommendation: 'bg-purple-50 text-purple-600',
  review_prompt:  'bg-green-50 text-green-600',
  report_update:  'bg-indigo-50 text-indigo-600',
}

const typeLabels: Record<string, string> = {
  reminder:       'Reminder',
  update:         'Update',
  cancellation:   'Cancelled',
  recommendation: 'For you',
  review_prompt:  'Review',
  report_update:  'Report',
}

export default function NotificationDropdown() {
  const { appUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    if (!appUser) return
    setLoading(true)
    const [notifs, count] = await Promise.all([
      getNotifications(appUser.user_id),
      getUnreadCount(appUser.user_id),
    ])
    setNotifications(notifs)
    setUnreadCount(count)
    setLoading(false)
  }

  useEffect(() => {
    if (appUser) fetchNotifications()
  }, [appUser])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handleOpen() {
    setOpen(prev => !prev)
    if (!open) await fetchNotifications()
  }

  async function handleMarkRead(notificationId: number) {
    await markNotificationRead(notificationId)
    setNotifications(prev =>
      prev.map(n =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function handleMarkAllRead() {
    if (!appUser) return
    await markAllNotificationsRead(appUser.user_id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  if (!appUser) return null

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative text-gray-600 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded p-1"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-10 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden"
        >

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            className="max-h-96 overflow-y-auto"
            role="list"
            aria-label="Notification list"
          >
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10" role="status">
                <Bell
                  className="w-8 h-8 text-gray-200 mx-auto mb-2"
                  aria-hidden="true"
                />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
                const colorClass = typeColors[notif.type_code] || 'bg-gray-50 text-gray-600'
                const label = typeLabels[notif.type_code] || notif.type_code

                return (
                  <div
                    key={notif.notification_id}
                    role="listitem"
                    className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                      notif.is_read ? 'bg-white' : 'bg-indigo-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">

                      {/* Type badge */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${colorClass}`}
                        aria-label={`Notification type: ${label}`}
                      >
                        {label}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug mb-1 ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatDateShort(notif.sent_at)}
                            </span>
                            {notif.event && (
                              <Link
                                href={`/events/${notif.event.event_id}`}
                                onClick={() => {
                                  handleMarkRead(notif.notification_id)
                                  setOpen(false)
                                }}
                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                                aria-label={`View event: ${notif.event.title}`}
                              >
                                <Calendar className="w-3 h-3" aria-hidden="true" />
                                View event
                              </Link>
                            )}
                          </div>

                          {!notif.is_read && (
                            <button
                              onClick={() => handleMarkRead(notif.notification_id)}
                              className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1 flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                              aria-label="Mark this notification as read"
                            >
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-indigo-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
