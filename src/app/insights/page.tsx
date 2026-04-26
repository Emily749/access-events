'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { BarChart2, TrendingUp, Users, AlertCircle } from 'lucide-react'

const InsightsCharts = dynamic(
  () => import('@/components/insights/InsightsCharts'),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-1/3 mb-6" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalFeatures: 0,
    totalReviews: 0,
    avgAccessibility: 0,
  })
  const [gapData, setGapData] = useState<any[]>([])
  const [scorecardData, setScorecardData] = useState<any[]>([])
  const [underserviceData, setUnderserviceData] = useState<any[]>([])
  const [cityData, setCityData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [featureData, setFeatureData] = useState<any[]>([])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    await Promise.all([
      loadStats(),
      loadGapAnalysis(),
      loadScorecard(),
      loadUnderservice(),
      loadCityData(),
      loadCategoryData(),
      loadFeatureData(),
    ])
    setLoading(false)
  }

  async function loadStats() {
    const [events, features, reviews] = await Promise.all([
      supabase.from('event').select('event_id', { count: 'exact', head: true }).eq('status', 'upcoming'),
      supabase.from('accessibility_feature').select('feature_id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('review').select('accessibility_rating'),
    ])

    const avgAcc = reviews.data?.length
      ? reviews.data.reduce((s: number, r: any) => s + r.accessibility_rating, 0) / reviews.data.length
      : 0

    setStats({
      totalEvents:      events.count || 0,
      totalFeatures:    features.count || 0,
      totalReviews:     reviews.data?.length || 0,
      avgAccessibility: Math.round(avgAcc * 10) / 10,
    })
  }

  async function loadGapAnalysis() {
    const { data: features } = await supabase
      .from('accessibility_feature')
      .select('feature_id, name, category')
      .eq('is_active', true)

    const { data: eventFeatures } = await supabase
      .from('event_accessibility')
      .select('feature_id, event_id')

    const { data: userPrefs } = await supabase
      .from('user_preference')
      .select('feature_id, user_id')

    if (!features) return

    const result = features.map(f => {
      const eventsProviding = new Set(eventFeatures?.filter(e => e.feature_id === f.feature_id).map(e => e.event_id)).size
      const usersWanting    = new Set(userPrefs?.filter(p => p.feature_id === f.feature_id).map(p => p.user_id)).size
      const ratio           = eventsProviding > 0 ? Math.round((usersWanting / eventsProviding) * 100) / 100 : usersWanting

      return {
        feature:        f.name,
        category:       f.category,
        eventsProviding,
        usersWanting,
        ratio,
        gap:            Math.max(0, usersWanting - eventsProviding),
      }
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 10)

    setGapData(result)
  }

  async function loadScorecard() {
    const { data } = await supabase
      .from('event')
      .select(`
        event_id, title, is_free,
        event_category (name),
        venue (name, address (city)),
        event_accessibility (feature_id),
        review (accessibility_rating, overall_rating),
        accessibility_report (report_id, status_code)
      `)
      .eq('status', 'upcoming')

    if (!data) return

    const result = data.map((e: any) => {
      const featureCount  = e.event_accessibility?.length || 0
      const reviews       = e.review || []
      const avgAcc        = reviews.length ? reviews.reduce((s: number, r: any) => s + r.accessibility_rating, 0) / reviews.length : 0
      const avgOverall    = reviews.length ? reviews.reduce((s: number, r: any) => s + r.overall_rating, 0) / reviews.length : 0
      const openReports   = e.accessibility_report?.filter((r: any) => r.status_code === 'open').length || 0

      let tier = 'Unrated'
      if (featureCount >= 5 && avgAcc >= 4)      tier = 'Excellent'
      else if (featureCount >= 3 && avgAcc >= 3)  tier = 'Good'
      else if (featureCount >= 1)                 tier = 'Basic'

      return {
        title:        e.title,
        category:     e.event_category?.name,
        city:         e.venue?.address?.city,
        featureCount,
        reviews:      reviews.length,
        avgAcc:       Math.round(avgAcc * 10) / 10,
        avgOverall:   Math.round(avgOverall * 10) / 10,
        openReports,
        tier,
        isFree:       e.is_free,
      }
    }).sort((a, b) => b.avgAcc - a.avgAcc)

    setScorecardData(result)
  }

  async function loadUnderservice() {
    const { data: disabilities } = await supabase
      .from('disability_type')
      .select('disability_id, name, category')

    const { data: userDisabilities } = await supabase
      .from('user_disability')
      .select('disability_id, user_id')

    const { data: relevance } = await supabase
      .from('feature_disability_relevance')
      .select('disability_id, feature_id, relevance_score')
      .gte('relevance_score', 8)

    const { data: eventFeatures } = await supabase
      .from('event_accessibility')
      .select('feature_id, event_id')

    if (!disabilities) return

    const result = disabilities.map(d => {
      const usersCount      = new Set(userDisabilities?.filter(ud => ud.disability_id === d.disability_id).map(ud => ud.user_id)).size
      const relevantFeatures= relevance?.filter(r => r.disability_id === d.disability_id).map(r => r.feature_id) || []
      const matchingEvents  = new Set(eventFeatures?.filter(ef => relevantFeatures.includes(ef.feature_id)).map(ef => ef.event_id)).size
      const eventsPerUser   = usersCount > 0 ? Math.round((matchingEvents / usersCount) * 10) / 10 : matchingEvents

      return {
        disability:    d.name,
        category:      d.category,
        users:         usersCount,
        matchingEvents,
        eventsPerUser,
        underserved:   eventsPerUser < 3,
      }
    }).sort((a, b) => a.eventsPerUser - b.eventsPerUser)

    setUnderserviceData(result)
  }

  async function loadCityData() {
    const { data } = await supabase
      .from('event')
      .select('venue (address (city)), event_accessibility (feature_id), review (accessibility_rating)')
      .eq('status', 'upcoming')

    if (!data) return
    const cities: Record<string, { events: number; features: number; ratings: number[] }> = {}
    data.forEach((e: any) => {
      const city = e.venue?.address?.city
      if (!city) return
      if (!cities[city]) cities[city] = { events: 0, features: 0, ratings: [] }
      cities[city].events++
      cities[city].features += e.event_accessibility?.length || 0
      e.review?.forEach((r: any) => cities[city].ratings.push(r.accessibility_rating))
    })
    const result = Object.entries(cities).map(([city, d]) => ({
      city,
      events:      d.events,
      avgFeatures: d.events > 0 ? Math.round((d.features / d.events) * 10) / 10 : 0,
      avgRating:   d.ratings.length > 0 ? Math.round((d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length) * 10) / 10 : 0,
    })).sort((a, b) => b.events - a.events)
    setCityData(result)
  }

  async function loadCategoryData() {
    const { data } = await supabase
      .from('event')
      .select('is_free, event_category (name), event_accessibility (feature_id), review (accessibility_rating)')

    if (!data) return
    const cats: Record<string, { free: number; paid: number; features: number[]; ratings: number[] }> = {}
    data.forEach((e: any) => {
      const cat = e.event_category?.name
      if (!cat) return
      if (!cats[cat]) cats[cat] = { free: 0, paid: 0, features: [], ratings: [] }
      if (e.is_free) cats[cat].free++
      else cats[cat].paid++
      cats[cat].features.push(e.event_accessibility?.length || 0)
      e.review?.forEach((r: any) => cats[cat].ratings.push(r.accessibility_rating))
    })
    const result = Object.entries(cats).map(([category, d]) => ({
      category,
      free:        d.free,
      paid:        d.paid,
      total:       d.free + d.paid,
      avgFeatures: Math.round((d.features.reduce((a, b) => a + b, 0) / d.features.length) * 10) / 10,
      avgRating:   d.ratings.length > 0 ? Math.round((d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length) * 10) / 10 : 0,
    })).sort((a, b) => b.total - a.total)
    setCategoryData(result)
  }

  async function loadFeatureData() {
    const { data } = await supabase
      .from('accessibility_feature')
      .select('feature_id, name, category')
      .eq('is_active', true)

    const { data: eventFeatures } = await supabase
      .from('event_accessibility')
      .select('feature_id, event_id')

    const { data: userPrefs } = await supabase
      .from('user_preference')
      .select('feature_id')

    if (!data) return

    const result = data.map(f => ({
      name:           f.name,
      category:       f.category,
      eventsCount:    eventFeatures?.filter(e => e.feature_id === f.feature_id).length || 0,
      usersWant:      userPrefs?.filter(p => p.feature_id === f.feature_id).length || 0,
    })).sort((a, b) => b.eventsCount - a.eventsCount).slice(0, 12)

    setFeatureData(result)
  }

  const tierColors: Record<string, string> = {
    Excellent: 'bg-green-50 text-green-700',
    Good:      'bg-blue-50 text-blue-700',
    Basic:     'bg-amber-50 text-amber-700',
    Unrated:   'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accessibility insights
          </h1>
          <p className="text-gray-500 max-w-2xl">
            Live data on accessible event provision across the UK. Use these insights
            to find the most accessible events, understand where gaps exist, and
            see which disability communities are best and least served.
          </p>
        </div>

        {/* Headline stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Upcoming events',       value: stats.totalEvents,                        icon: BarChart2,   color: 'text-indigo-600 bg-indigo-50'  },
            { label: 'Accessibility features', value: stats.totalFeatures,                      icon: TrendingUp,  color: 'text-teal-600 bg-teal-50'      },
            { label: 'Reviews submitted',      value: stats.totalReviews,                       icon: Users,       color: 'text-amber-600 bg-amber-50'    },
            { label: 'Avg accessibility rating', value: stats.avgAccessibility ? `${stats.avgAccessibility}/5` : '—', icon: AlertCircle, color: 'text-green-600 bg-green-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="space-y-10">

            {/* Section 1 — Gap analysis */}
            <section aria-labelledby="gap-heading">
              <div className="mb-4">
                <h2 id="gap-heading" className="text-xl font-bold text-gray-900 mb-1">
                  Accessibility gap analysis
                </h2>
                <p className="text-gray-500 text-sm">
                  Which accessibility features are most in demand relative to how many events provide them.
                  A high demand/supply ratio means this feature is urgently needed by users but rarely offered.
                  <strong className="text-gray-700"> This data supports decision-making for event organisers.</strong>
                </p>
              </div>
              <InsightsCharts type="gap" data={gapData} />
            </section>

            {/* Section 2 — Event scorecard table */}
            <section aria-labelledby="scorecard-heading">
              <div className="mb-4">
                <h2 id="scorecard-heading" className="text-xl font-bold text-gray-900 mb-1">
                  Event accessibility scorecard
                </h2>
                <p className="text-gray-500 text-sm">
                  Every upcoming event ranked by accessibility tier — combining number of features
                  listed with verified user ratings. Use this to instantly find the most accessible
                  events for your needs.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" role="table" aria-label="Event accessibility scorecard">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {['Event', 'Category', 'City', 'Features', 'Avg rating', 'Reviews', 'Tier'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {scorecardData.map((event, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                            {event.title}
                            {event.isFree && <span className="ml-2 text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">Free</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{event.category}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{event.city}</td>
                          <td className="px-4 py-3 text-center font-medium text-indigo-600">{event.featureCount}</td>
                          <td className="px-4 py-3 text-center">
                            {event.avgAcc > 0 ? (
                              <span className="font-medium text-gray-900">{event.avgAcc}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">{event.reviews}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tierColors[event.tier]}`}>
                              {event.tier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 3 — Underservice report */}
            <section aria-labelledby="underservice-heading">
              <div className="mb-4">
                <h2 id="underservice-heading" className="text-xl font-bold text-gray-900 mb-1">
                  Disability community coverage report
                </h2>
                <p className="text-gray-500 text-sm">
                  How well each disability community is served by current events —
                  measured by the number of events with relevant accessibility features
                  per registered user. Lower scores indicate underserved communities.
                </p>
              </div>
              <InsightsCharts type="underservice" data={underserviceData} />
            </section>

            {/* Section 4 — Charts grid */}
            <section aria-labelledby="charts-heading">
              <div className="mb-4">
                <h2 id="charts-heading" className="text-xl font-bold text-gray-900 mb-1">
                  Platform overview
                </h2>
                <p className="text-gray-500 text-sm">
                  Breakdown of event provision by city, category and accessibility feature —
                  showing where accessible events are concentrated and where provision is weakest.
                </p>
              </div>
              <InsightsCharts type="overview" data={{ cityData, categoryData, featureData }} />
            </section>

          </div>
        )}
      </main>
    </div>
  )
}
