'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDateShort } from '@/lib/utils'
import { Flag, CheckCircle, XCircle, Clock, Search, BarChart2 } from 'lucide-react'
import Link from 'next/link'

type Tab = 'reports' | 'searches'

export default function AdminPage() {
  const { appUser } = useAuth()
  const [tab, setTab] = useState<Tab>('reports')
  const [reports, setReports] = useState<any[]>([])
  const [searches, setSearches] = useState<any[]>([])
  const [topFeatures, setTopFeatures] = useState<any[]>([])
  const [topCities, setTopCities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')

  async function fetchReports() {
    let query = supabase
      .from('accessibility_report')
      .select(`
        *,
        app_user (username, email),
        event (title, event_id),
        accessibility_feature (name),
        issue_type (label)
      `)
      .order('reported_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status_code', filter)

    const { data } = await query
    setReports(data || [])
  }

  async function fetchSearchInsights() {
    const { data: logs } = await supabase
      .from('search_log')
      .select(`
        *,
        search_filter (filter_key, filter_value)
      `)
      .order('searched_at', { ascending: false })
      .limit(50)

    setSearches(logs || [])

    // Aggregate top features searched
    const featureCounts: Record<string, number> = {}
    const cityCounts: Record<string, number> = {};
    (logs || []).forEach((log: any) => {
      (log.search_filter || []).forEach((f: any) => {
        if (f.filter_key === 'feature') {
          featureCounts[f.filter_value] = (featureCounts[f.filter_value] || 0) + 1
        }
        if (f.filter_key === 'city') {
          cityCounts[f.filter_value] = (cityCounts[f.filter_value] || 0) + 1
        }
      })
    })

    setTopFeatures(
      Object.entries(featureCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }))
    )

    setTopCities(
      Object.entries(cityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, count]) => ({ name, count }))
    )
  }

  useEffect(() => {
    if (appUser?.role !== 'admin') return
    async function load() {
      await Promise.all([fetchReports(), fetchSearchInsights()])
      setLoading(false)
    }
    load()
  }, [appUser, filter])

  async function updateStatus(reportId: number, status: string) {
    await supabase
      .from('accessibility_report')
      .update({ status_code: status })
      .eq('report_id', reportId)
    fetchReports()
  }

  if (appUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
          <p className="text-gray-500 text-sm">
            This page is only accessible to admins.
          </p>
        </div>
      </div>
    )
  }

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    open:         { icon: Clock,       color: 'text-amber-600 bg-amber-50', label: 'Open'         },
    under_review: { icon: Flag,        color: 'text-blue-600 bg-blue-50',   label: 'Under review' },
    resolved:     { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Resolved'     },
    rejected:     { icon: XCircle,     color: 'text-red-600 bg-red-50',     label: 'Rejected'     },
    closed:       { icon: XCircle,     color: 'text-gray-600 bg-gray-100',  label: 'Closed'       },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin panel</h1>
          <p className="text-gray-500">
            Manage reports and view search analytics
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-2 mb-8 border-b border-gray-200"
          role="tablist"
          aria-label="Admin panel sections"
        >
          {([
            { key: 'reports',  label: 'Accessibility reports', icon: Flag      },
            { key: 'searches', label: 'Search insights',       icon: BarChart2 },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse space-y-3"
              >
                <div className="h-5 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : tab === 'reports' ? (

          // ── Reports tab ──────────────────────────────────────────
          <div role="tabpanel" aria-label="Accessibility reports">

            {/* Status filter */}
            <div className="flex gap-2 mb-6 flex-wrap" role="group" aria-label="Filter reports by status">
              {['open', 'under_review', 'resolved', 'rejected', 'all'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  aria-pressed={filter === status}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                    filter === status
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {status === 'all' ? 'All' : statusConfig[status]?.label}
                </button>
              ))}
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-20" role="status">
                <Flag className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-500 text-sm">No reports match the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report: any) => {
                  const status = statusConfig[report.status_code]
                  const StatusIcon = status?.icon || Flag

                  return (
                    <div
                      key={report.report_id}
                      className="bg-white border border-gray-200 rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Link
                              href={`/events/${report.event?.event_id}`}
                              className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                            >
                              {report.event?.title}
                            </Link>
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${status?.color}`}
                            >
                              <StatusIcon className="w-3 h-3" aria-hidden="true" />
                              {status?.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            <span>Reported by {report.app_user?.username}</span>
                            <span>·</span>
                            <span>{formatDateShort(report.reported_at)}</span>
                            <span>·</span>
                            <span className="text-indigo-600">
                              {report.accessibility_feature?.name}
                            </span>
                            <span>·</span>
                            <span>{report.issue_type?.label}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 mb-4">
                        {report.description}
                      </p>

                      <div
                        className="flex gap-2 flex-wrap"
                        role="group"
                        aria-label={`Actions for report on ${report.event?.title}`}
                      >
                        {report.status_code === 'open' && (
                          <button
                            onClick={() => updateStatus(report.report_id, 'under_review')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                          >
                            Mark under review
                          </button>
                        )}
                        {['open', 'under_review'].includes(report.status_code) && (
                          <>
                            <button
                              onClick={() => updateStatus(report.report_id, 'resolved')}
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors"
                            >
                              Mark resolved
                            </button>
                            <button
                              onClick={() => updateStatus(report.report_id, 'rejected')}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {['resolved', 'rejected'].includes(report.status_code) && (
                          <button
                            onClick={() => updateStatus(report.report_id, 'closed')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        ) : (

          // ── Search insights tab ───────────────────────────────────
          <div role="tabpanel" aria-label="Search insights">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

              {/* Top features searched */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  Most searched features
                </h2>
                {topFeatures.length === 0 ? (
                  <p className="text-gray-400 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topFeatures.map(({ name, count }, i) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{name}</span>
                            <span className="text-xs text-gray-500">{count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{
                                width: `${(count / topFeatures[0].count) * 100}%`,
                              }}
                              role="progressbar"
                              aria-valuenow={count}
                              aria-valuemax={topFeatures[0].count}
                              aria-label={`${name}: ${count} searches`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top cities searched */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  Most searched cities
                </h2>
                {topCities.length === 0 ? (
                  <p className="text-gray-400 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topCities.map(({ name, count }, i) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{name}</span>
                            <span className="text-xs text-gray-500">{count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{
                                width: `${(count / topCities[0].count) * 100}%`,
                              }}
                              role="progressbar"
                              aria-valuenow={count}
                              aria-valuemax={topCities[0].count}
                              aria-label={`${name}: ${count} searches`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent searches */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Recent searches</h2>
              </div>
              {searches.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-gray-400 text-sm">No searches logged yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searches.map((log: any) => (
                    <div key={log.log_id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium mb-1">
                            {log.query_text || (
                              <span className="text-gray-400 font-normal italic">
                                No search text
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {log.search_filter?.map((f: any) => (
                              <span
                                key={`${f.filter_key}-${f.filter_value}`}
                                className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full"
                              >
                                {f.filter_key}: {f.filter_value}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400">
                            {log.results_count} result{log.results_count !== 1 ? 's' : ''}
                            {log.user_id ? ' · logged in user' : ' · guest'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatDateShort(log.searched_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
