'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'
import { BarChart2, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react'
import Link from 'next/link'

const INDIGO  = '#4f46e5'
const PURPLE  = '#7c3aed'
const TEAL    = '#0d9488'
const AMBER   = '#d97706'
const CORAL   = '#e11d48'
const GREEN   = '#16a34a'
const SLATE   = '#475569'

const PALETTE = [INDIGO, TEAL, AMBER, CORAL, GREEN, PURPLE, SLATE, '#0284c7', '#9333ea', '#b45309']

export default function AnalyticsDashboard() {
  const { appUser } = useAuth()
  const [loading, setLoading] = useState(true)

  // Chart data states
  const [featurePopularity,   setFeaturePopularity]   = useState<any[]>([])
  const [categoryRatings,     setCategoryRatings]     = useState<any[]>([])
  const [reviewTrend,         setReviewTrend]         = useState<any[]>([])
  const [disabilityFeatureMap,setDisabilityFeatureMap]= useState<any[]>([])
  const [cityEventCount,      setCityEventCount]      = useState<any[]>([])
  const [freeVsPaid,          setFreeVsPaid]          = useState<any[]>([])
  const [featureReviewScatter,setFeatureReviewScatter]= useState<any[]>([])
  const [searchTrend,         setSearchTrend]         = useState<any[]>([])

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

  // 1. Most common accessibility features across events
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
      .map(([name, count]) => ({ name: name.replace(' ', '\n'), fullName: name, count }))
    setFeaturePopularity(sorted)
  }

  // 2. Average accessibility rating by event category
  async function loadCategoryRatings() {
    const { data } = await supabase
      .from('review')
      .select(`
        accessibility_rating,
        overall_rating,
        event (event_category (name))
      `)

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
      category: category.replace(' & ', '\n& '),
      fullCategory: category,
      accessibility: parseFloat((vals.acc.reduce((a, b) => a + b, 0) / vals.acc.length).toFixed(2)),
      overall: parseFloat((vals.overall.reduce((a, b) => a + b, 0) / vals.overall.length).toFixed(2)),
      reviews: vals.acc.length,
    }))
    setCategoryRatings(result)
  }

  // 3. Reviews submitted over time (monthly)
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
      month:       m.month,
      reviews:     m.reviews,
      avgAcc:      parseFloat((m.avgAcc.reduce((a, b) => a + b, 0) / m.avgAcc.length).toFixed(2)),
      avgOverall:  parseFloat((m.avgOverall.reduce((a, b) => a + b, 0) / m.avgOverall.length).toFixed(2)),
    }))
    setReviewTrend(result)
  }

  // 4. Radar: disability type vs feature relevance scores
  async function loadDisabilityFeatureMap() {
    const { data } = await supabase
      .from('feature_disability_relevance')
      .select(`
        relevance_score,
        accessibility_feature (name, category),
        disability_type (name, category)
      `)

    if (!data) return
    // Group by disability, average relevance per feature category
    const grouped: Record<string, Record<string, number[]>> = {}
    data.forEach((row: any) => {
      const disability = row.disability_type?.name
      const category   = row.accessibility_feature?.category
      if (!disability || !category) return
      if (!grouped[disability]) grouped[disability] = {}
      if (!grouped[disability][category]) grouped[disability][category] = []
      grouped[disability][category].push(row.relevance_score)
    })

    // Get unique categories
    const categories = [...new Set(data.map((r: any) => r.accessibility_feature?.category).filter(Boolean))]

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
    setDisabilityFeatureMap({ categories, data: result } as any)
  }

  // 5. Events per city
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

  // 6. Free vs paid event breakdown by category
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
      category: category.replace(' & ', '\n& '),
      fullCategory: category,
      ...vals,
    }))
    setFreeVsPaid(result)
  }

  // 7. Scatter: number of accessibility features vs avg accessibility rating
  async function loadFeatureReviewScatter() {
    const { data: events } = await supabase
      .from('event')
      .select(`
        event_id,
        title,
        event_accessibility (feature_id),
        review (accessibility_rating)
      `)

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

  // 8. Search volume trend over time
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="text-xs">
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }

  const ScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    if (!d) return null
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm max-w-xs">
        <p className="font-semibold text-gray-900 mb-1 text-xs leading-tight">{d.name}</p>
        <p className="text-xs text-gray-600">Features: <span className="font-medium">{d.features}</span></p>
        <p className="text-xs text-gray-600">Avg accessibility: <span className="font-medium">{d.rating}</span></p>
        <p className="text-xs text-gray-600">Reviews: <span className="font-medium">{d.reviews}</span></p>
      </div>
    )
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

  const radarData  = (disabilityFeatureMap as any)?.data     || []
  const radarCats  = (disabilityFeatureMap as any)?.categories || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics dashboard</h1>
          </div>
          <p className="text-gray-500 ml-13">
            Data-driven insights to support accessibility decision making
          </p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/admin/reports"
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
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

            {/* Row 1 — full width: feature popularity bar chart */}
            <section
              className="bg-white border border-gray-200 rounded-2xl p-6"
              aria-labelledby="chart1-heading"
            >
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <h2 id="chart1-heading" className="font-semibold text-gray-900">
                  Most provided accessibility features
                </h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                How frequently each accessibility feature appears across all events —
                reveals which features organisers prioritise and which are underserved.
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={featurePopularity}
                  margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="fullName"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Events" radius={[6, 6, 0, 0]}>
                    {featurePopularity.map((_: any, i: number) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Row 2 — two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Grouped bar: avg ratings by event category */}
              <section
                className="bg-white border border-gray-200 rounded-2xl p-6"
                aria-labelledby="chart2-heading"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart2-heading" className="font-semibold text-gray-900">
                    Ratings by event category
                  </h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Average overall and accessibility ratings per category —
                  identifies which event types deliver the best accessible experiences.
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={categoryRatings}
                    margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="fullCategory"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      height={80}
                    />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    />
                    <Bar dataKey="accessibility" name="Accessibility" fill={INDIGO} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overall"       name="Overall"       fill={TEAL}   radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>

              {/* Pie: free vs paid */}
              <section
                className="bg-white border border-gray-200 rounded-2xl p-6"
                aria-labelledby="chart3-heading"
              >
                <div className="flex items-center gap-2 mb-1">
                  <PieIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart3-heading" className="font-semibold text-gray-900">
                    Free vs paid events by category
                  </h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Breakdown of free and ticketed events across categories —
                  helps identify where financial barriers to access may exist.
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={freeVsPaid}
                    margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="fullCategory"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar dataKey="free" name="Free"   fill={GREEN} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" name="Paid"   fill={AMBER} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            </div>

            {/* Row 3 — two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Line: review trend over time */}
              <section
                className="bg-white border border-gray-200 rounded-2xl p-6"
                aria-labelledby="chart4-heading"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart4-heading" className="font-semibold text-gray-900">
                    Review and rating trends over time
                  </h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Monthly review volume and average ratings — tracks whether
                  accessibility standards are improving over time.
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={reviewTrend}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="reviews"
                      name="Reviews"
                      stroke={INDIGO}
                      strokeWidth={2}
                      dot={{ r: 4, fill: INDIGO }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgAcc"
                      name="Avg accessibility"
                      stroke={TEAL}
                      strokeWidth={2}
                      dot={{ r: 4, fill: TEAL }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgOverall"
                      name="Avg overall"
                      stroke={AMBER}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: AMBER }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              {/* Scatter: features vs rating */}
              <section
                className="bg-white border border-gray-200 rounded-2xl p-6"
                aria-labelledby="chart5-heading"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart5-heading" className="font-semibold text-gray-900">
                    Accessibility features vs rating
                  </h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Each dot is an event — x axis is number of accessibility features listed,
                  y axis is average accessibility rating. Tests whether more features
                  correlates with higher ratings.
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="features"
                      name="Features"
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{ value: 'No. of features', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }}
                      height={40}
                    />
                    <YAxis
                      dataKey="rating"
                      name="Rating"
                      domain={[0, 5]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      label={{ value: 'Avg rating', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
                    />
                    <ZAxis dataKey="reviews" range={[40, 200]} />
                    <Tooltip content={<ScatterTooltip />} />
                    <Scatter
                      data={featureReviewScatter}
                      fill={INDIGO}
                      fillOpacity={0.7}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </section>
            </div>

            {/* Row 4 — two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Bar: events per city */}
              <section
                className="bg-white border border-gray-200 rounded-2xl p-6"
                aria-labelledby="chart6-heading"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart6-heading" className="font-semibold text-gray-900">
                    Accessible events by city
                  </h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Number of events per city — highlights geographic gaps in
                  accessible event provision across the UK.
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={cityEventCount}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis
                      dataKey="city"
                      type="category"
                      tick={{ fontSize: 12, fill: '#475569' }}
                      width={56}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Events" radius={[0, 6, 6, 0]}>
                      {cityEventCount.map((_: any, i: number) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </section>

              {/* Radar: disability vs feature category relevance */}
              <section
                className="bg-white border border-gray-200 rounded-2xl p-6"
                aria-labelledby="chart7-heading"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart7-heading" className="font-semibold text-gray-900">
                    Feature relevance by disability type
                  </h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Radar chart showing average feature relevance score across
                  accessibility categories for each disability type — supports
                  targeted event recommendations.
                </p>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarCats.map((cat: string) => {
                      const point: any = { category: cat }
                      radarData.forEach((d: any) => {
                        point[d.disability] = d[cat] || 0
                      })
                      return point
                    })}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 10]}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                      />
                      {radarData.slice(0, 6).map((d: any, i: number) => (
                        <Radar
                          key={d.disability}
                          name={d.disability}
                          dataKey={d.disability}
                          stroke={PALETTE[i]}
                          fill={PALETTE[i]}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    No relevance data available
                  </div>
                )}
              </section>
            </div>

            {/* Row 5 — full width: search trend */}
            {searchTrend.length > 0 && (
              <section
                className="bg-white border border-gray-200 rounded-2xl p-6"
                aria-labelledby="chart8-heading"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <h2 id="chart8-heading" className="font-semibold text-gray-900">
                    Search activity over time
                  </h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Daily search volume and average results returned —
                  tracks platform usage growth and identifies periods of high demand.
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={searchTrend}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="searches"
                      name="Searches"
                      stroke={INDIGO}
                      strokeWidth={2}
                      dot={{ r: 4, fill: INDIGO }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgResults"
                      name="Avg results"
                      stroke={CORAL}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: CORAL }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Key insights summary */}
            <section
              className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6"
              aria-labelledby="insights-heading"
            >
              <h2
                id="insights-heading"
                className="font-semibold text-indigo-900 mb-4 text-lg"
              >
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
                    value: categoryRatings.sort((a, b) => b.accessibility - a.accessibility)[0]?.fullCategory || '—',
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
