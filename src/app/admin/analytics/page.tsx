'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { BarChart2, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const FeaturePopularityChart = dynamic(() => import('@/components/analytics/Charts').then(m => ({ default: m.FeaturePopularityChart })), { ssr: false })
const CategoryRatingsChart   = dynamic(() => import('@/components/analytics/Charts').then(m => ({ default: m.CategoryRatingsChart })),   { ssr: false })
const FreeVsPaidChart        = dynamic(() => import('@/components/analytics/Charts').then(m => ({ default: m.FreeVsPaidChart })),        { ssr: false })
const ReviewTrendChart       = dynamic(() => import('@/components/analytics/Charts').then(m => ({ default: m.ReviewTrendChart })),       { ssr: false })
const ScatterPlotChart       = dynamic(() => import('@/components/analytics/Charts').then(m => ({ default: m.ScatterPlotChart })),       { ssr: false })
const CityEventChart         = dynamic(() => import('@/components/analytics/Charts').then(m => ({ default: m.CityEventChart })),         { ssr: false })
const RadarChartComponent    = dynamic(() => import('@/components/analytics/Charts').then(m => ({ default: m.RadarChartComponent })),    { ssr: false })
const SearchTrendChart       = dynamic(() => import('@/components/analytics/Charts').then(m => ({ default: m.SearchTrendChart })),       { ssr: false })

export default function AnalyticsDashboard() {
  const { appUser } = useAuth()
  const [loading, setLoading] = useState(true)

  const [featurePopularity,    setFeaturePopularity]    = useState<any[]>([])
  const [categoryRatings,      setCategoryRatings]      = useState<any[]>([])
  const [reviewTrend,          setReviewTrend]          = useState<any[]>([])
  const [disabilityFeatureMap, setDisabilityFeatureMap] = useState<any>({})
  const [cityEventCount,       setCityEventCount]       = useState<any[]>([])
  const [freeVsPaid,           setFreeVsPaid]           = useState<any[]>([])
  const [featureReviewScatter, setFeatureReviewScatter] = useState<any[]>([])
  const [searchTrend,          setSearchTrend]          = useState<any[]>([])

  useEffect(() => {
    if (appUser?.role === 'admin') loadAll()
  }, [appUser])

  async function loadAll() {
    await Promise.all([
      loadFeaturePopularity(),
      loadCategoryRatings(),
      loadReviewTrend(),
      loadDisabilityFeatureMap(),
      loadCityEventCount(),
      loadFreeVsPaid(),
      loadFeatureReviewScatter(),
      loadSearchTrend(),
    ])
    setLoading(false)
  }

  async function loadFeaturePopularity() {
    const { data } = await supabase
      .from('event_accessibility')
      .select('accessibility_feature (name, category)')
    if (!data) return
    const counts: Record<string, number> = {}
    data.forEach((row: any) => {
      const name = row.accessibility_feature?.name
      if (name) counts[name] = (counts[name] || 0) + 1
    })
    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, fullName: name, count }))
    setFeaturePopularity(sorted)
  }

  async function loadCategoryRatings() {
    const { data } = await supabase
      .from('review')
      .select('accessibility_rating, overall_rating, event (event_category (name))')
    if (!data) return
    const grouped: Record<string, { acc: number[]; overall: number[] }> = {}
    data.forEach((r: any) => {
      const cat = r.event?.event_category?.name
      if (!cat) return
      if (!grouped[cat]) grouped[cat] = { acc: [], overall: [] }
      grouped[cat].acc.push(r.accessibility_rating)
      grouped[cat].overall.push(r.overall_rating)
    })
    const result = Object.entries(grouped).map(([category, vals]) => ({
      category,
      fullCategory: category,
      accessibility: parseFloat((vals.acc.reduce((a, b) => a + b, 0) / vals.acc.length).toFixed(2)),
      overall:       parseFloat((vals.overall.reduce((a, b) => a + b, 0) / vals.overall.length).toFixed(2)),
      reviews:       vals.acc.length,
    }))
    setCategoryRatings(result)
  }

  async function loadReviewTrend() {
    const { data } = await supabase
      .from('review')
      .select('created_at, accessibility_rating, overall_rating')
      .order('created_at', { ascending: true })
    if (!data) return
    const monthly: Record<string, { month: string; reviews: number; avgAcc: number[]; avgOverall: number[] }> = {}
    data.forEach((r: any) => {
      const date  = new Date(r.created_at)
      const key   = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      if (!monthly[key]) monthly[key] = { month: label, reviews: 0, avgAcc: [], avgOverall: [] }
      monthly[key].reviews++
      monthly[key].avgAcc.push(r.accessibility_rating)
      monthly[key].avgOverall.push(r.overall_rating)
    })
    const result = Object.values(monthly).map(m => ({
      month:      m.month,
      reviews:    m.reviews,
      avgAcc:     parseFloat((m.avgAcc.reduce((a, b) => a + b, 0) / m.avgAcc.length).toFixed(2)),
      avgOverall: parseFloat((m.avgOverall.reduce((a, b) => a + b, 0) / m.avgOverall.length).toFixed(2)),
    }))
    setReviewTrend(result)
  }

  async function loadDisabilityFeatureMap() {
    const { data } = await supabase
      .from('feature_disability_relevance')
      .select('relevance_score, accessibility_feature (name, category), disability_type (name, category)')
    if (!data) return
    const grouped: Record<string, Record<string, number[]>> = {}
    data.forEach((row: any) => {
      const disability = row.disability_type?.name
      const category   = row.accessibility_feature?.category
      if (!disability || !category) return
      if (!grouped[disability]) grouped[disability] = {}
      if (!grouped[disability][category]) grouped[disability][category] = []
      grouped[disability][category].push(row.relevance_score)
    })
    const categories = [...new Set(data.map((r: any) => r.accessibility_feature?.category).filter(Boolean))] as string[]
    const result = Object.entries(grouped).map(([disability, cats]) => {
      const row: any = { disability: disability.split(' ')[0] }
      categories.forEach(cat => {
        const scores = cats[cat] || []
        row[cat] = scores.length
          ? parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1))
          : 0
      })
      return row
    })
    setDisabilityFeatureMap({ categories, data: result })
  }

  async function loadCityEventCount() {
    const { data } = await supabase
      .from('event')
      .select('venue (address (city))')
    if (!data) return
    const counts: Record<string, number> = {}
    data.forEach((e: any) => {
      const city = e.venue?.address?.city
      if (city) counts[city] = (counts[city] || 0) + 1
    })
    const result = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([city, count]) => ({ city, count }))
    setCityEventCount(result)
  }

  async function loadFreeVsPaid() {
    const { data } = await supabase
      .from('event')
      .select('is_free, event_category (name)')
    if (!data) return
    const grouped: Record<string, { free: number; paid: number }> = {}
    data.forEach((e: any) => {
      const cat = e.event_category?.name
      if (!cat) return
      if (!grouped[cat]) grouped[cat] = { free: 0, paid: 0 }
      if (e.is_free) grouped[cat].free++
      else grouped[cat].paid++
    })
    const result = Object.entries(grouped).map(([category, vals]) => ({
      category,
      fullCategory: category,
      ...vals,
    }))
    setFreeVsPaid(result)
  }

  async function loadFeatureReviewScatter() {
    const { data: events } = await supabase
      .from('event')
      .select('event_id, title, event_accessibility (feature_id), review (accessibility_rating)')
    if (!events) return
    const result = events
      .filter((e: any) => e.review?.length > 0)
      .map((e: any) => ({
        features: e.event_accessibility?.length || 0,
        rating:   parseFloat(
          (e.review.reduce((s: number, r: any) => s + r.accessibility_rating, 0) / e.review.length).toFixed(2)
        ),
        reviews:  e.review.length,
        name:     e.title,
      }))
    setFeatureReviewScatter(result)
  }

  async function loadSearchTrend() {
    const { data } = await supabase
      .from('search_log')
      .select('searched_at, results_count')
      .order('searched_at', { ascending: true })
    if (!data || data.length === 0) return
    const daily: Record<string, { date: string; searches: number; avgResults: number[] }> = {}
    data.forEach((log: any) => {
      const date  = new Date(log.searched_at)
      const key   = date.toISOString().split('T')[0]
      const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      if (!daily[key]) daily[key] = { date: label, searches: 0, avgResults: [] }
      daily[key].searches++
      daily[key].avgResults.push(log.results_count)
    })
    const result = Object.values(daily).map(d => ({
      date:       d.date,
      searches:   d.searches,
      avgResults: parseFloat((d.avgResults.reduce((a, b) => a + b, 0) / d.avgResults.length).toFixed(1)),
    }))
    setSearchTrend(result)
  }

  if (appUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
          <p className="text-gray-500 text-sm">This page is only accessible to admins.</p>
        </div>
      </div>
    )
  }

  const radarData = disabilityFeatureMap?.data      || []
  const radarCats = disabilityFeatureMap?.categories || []

  const ChartPlaceholder = () => (
    <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics dashboard</h1>
          </div>
          <p className="text-gray-500">
            Data-driven insights to support accessibility decision making
          </p>
          <div className="flex gap-3 mt-4">
            <Link href="/admin/reports" className="text-sm text-indigo-600 font-medium hover:underline">
              ← Back to admin panel
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-1/3 mb-6" />
                <div className="h-64 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">

            {/* Chart 1 — Feature popularity */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6" aria-labelledby="chart1-heading">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <h2 id="chart1-heading" className="font-semibold text-gray-900">Most provided accessibility features</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                How frequently each accessibility feature appears across all events —
                reveals which features organisers prioritise and which are underserved.
              </p>
              <FeaturePopularityChart data={featurePopularity} />
            </section>

            {/* Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white border border-gray-200 rounded-2xl p-6" aria-labelledby="chart2-heading">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart2-heading" className="font-semibold text-gray-900">Ratings by event category</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Average overall and accessibility ratings per category —
                  identifies which event types deliver the best accessible experiences.
                </p>
                <CategoryRatingsChart data={categoryRatings} />
              </section>

              <section className="bg-white border border-gray-200 rounded-2xl p-6" aria-labelledby="chart3-heading">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart3-heading" className="font-semibold text-gray-900">Free vs paid events by category</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Breakdown of free and ticketed events across categories —
                  helps identify where financial barriers to access may exist.
                </p>
                <FreeVsPaidChart data={freeVsPaid} />
              </section>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white border border-gray-200 rounded-2xl p-6" aria-labelledby="chart4-heading">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart4-heading" className="font-semibold text-gray-900">Review and rating trends over time</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Monthly review volume and average ratings — tracks whether
                  accessibility standards are improving over time.
                </p>
                <ReviewTrendChart data={reviewTrend} />
              </section>

              <section className="bg-white border border-gray-200 rounded-2xl p-6" aria-labelledby="chart5-heading">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart5-heading" className="font-semibold text-gray-900">Accessibility features vs rating</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Each dot is an event — x axis is number of accessibility features listed,
                  y axis is average accessibility rating. Tests whether more features
                  correlates with higher ratings.
                </p>
                <ScatterPlotChart data={featureReviewScatter} />
              </section>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white border border-gray-200 rounded-2xl p-6" aria-labelledby="chart6-heading">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart6-heading" className="font-semibold text-gray-900">Accessible events by city</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Number of events per city — highlights geographic gaps in
                  accessible event provision across the UK.
                </p>
                <CityEventChart data={cityEventCount} />
              </section>

              <section className="bg-white border border-gray-200 rounded-2xl p-6" aria-labelledby="chart7-heading">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart7-heading" className="font-semibold text-gray-900">Feature relevance by disability type</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Radar chart showing average feature relevance score across
                  accessibility categories for each disability type — supports
                  targeted event recommendations.
                </p>
                <RadarChartComponent radarData={radarData} radarCats={radarCats} />
              </section>
            </div>

            {/* Chart 8 — Search trend */}
            {searchTrend.length > 0 && (
              <section className="bg-white border border-gray-200 rounded-2xl p-6" aria-labelledby="chart8-heading">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart8-heading" className="font-semibold text-gray-900">Search activity over time</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Daily search volume and average results returned —
                  tracks platform usage growth and identifies periods of high demand.
                </p>
                <SearchTrendChart data={searchTrend} />
              </section>
            )}

            {/* Key insights */}
            <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6" aria-labelledby="insights-heading">
              <h2 id="insights-heading" className="font-semibold text-indigo-900 mb-4 text-lg">
                Key insights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Most provided feature',
                    value: featurePopularity[0]?.fullName || '—',
                    desc:  'The accessibility feature most commonly listed by event organisers',
                  },
                  {
                    title: 'Highest rated category',
                    value: [...categoryRatings].sort((a, b) => b.accessibility - a.accessibility)[0]?.fullCategory || '—',
                    desc:  'Event category with the highest average accessibility rating from attendees',
                  },
                  {
                    title: 'Most active city',
                    value: cityEventCount[0]?.city || '—',
                    desc:  'City with the most accessible events listed on the platform',
                  },
                  {
                    title: 'Total reviews analysed',
                    value: reviewTrend.reduce((s, r) => s + r.reviews, 0),
                    desc:  'Number of accessibility reviews contributing to the rating data',
                  },
                  {
                    title: 'Avg features per event',
                    value: featureReviewScatter.length
                      ? (featureReviewScatter.reduce((s, e) => s + e.features, 0) / featureReviewScatter.length).toFixed(1)
                      : '—',
                    desc:  'Average number of accessibility features listed across all reviewed events',
                  },
                  {
                    title: 'Platform searches logged',
                    value: searchTrend.reduce((s, d) => s + d.searches, 0) || '—',
                    desc:  'Total search queries recorded since search logging was enabled',
                  },
                ].map(({ title, value, desc }) => (
                  <div key={title} className="bg-white rounded-xl p-4 border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-medium mb-1">{title}</p>
                    <p className="text-xl font-bold text-gray-900 mb-1">{value}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  )
}
