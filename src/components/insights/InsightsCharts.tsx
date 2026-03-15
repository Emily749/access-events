'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

const INDIGO = '#4f46e5'
const TEAL   = '#0d9488'
const AMBER  = '#d97706'
const CORAL  = '#e11d48'
const GREEN  = '#16a34a'
const PURPLE = '#7c3aed'
const SLATE  = '#475569'
const PALETTE = [INDIGO, TEAL, AMBER, CORAL, GREEN, PURPLE, SLATE, '#0284c7', '#9333ea', '#b45309']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm max-w-xs">
      <p className="font-semibold text-gray-900 mb-1 text-xs">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function GapChart({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Demand vs supply bar chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
          User demand vs event supply by feature
        </h3>
        <p className="text-gray-400 text-xs mb-4">
          Orange = users who want this feature. Indigo = events that provide it.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="feature" tick={{ fontSize: 10, fill: '#64748b' }} angle={-40} textAnchor="end" interval={0} height={110} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="usersWanting"    name="Users wanting"    fill={AMBER}  radius={[4, 4, 0, 0]} />
            <Bar dataKey="eventsProviding" name="Events providing" fill={INDIGO} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gap size chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
          Provision gap size
        </h3>
        <p className="text-gray-400 text-xs mb-4">
          How many more users want each feature than events currently provide it.
          Larger bars = bigger unmet need.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 100 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <YAxis dataKey="feature" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={130} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="gap" name="Unmet demand" radius={[0, 6, 6, 0]}>
              {data.map((_: any, i: number) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function UnderserviceChart({ data }: { data: any[] }) {
  const radarData = data.slice(0, 8).map(d => ({
    disability:    d.disability.split(' ')[0],
    matchingEvents: d.matchingEvents,
    users:         d.users,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Horizontal bar — events per user */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
          Events available per user by disability type
        </h3>
        <p className="text-gray-400 text-xs mb-4">
          Lower bars indicate communities with fewer suitable events relative to their population on the platform.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis dataKey="disability" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={140} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="matchingEvents" name="Matching events" radius={[0, 6, 6, 0]}>
              {data.map((d: any, i: number) => (
                <Cell key={i} fill={d.underserved ? CORAL : GREEN} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
            Underserved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            Well served
          </span>
        </div>
      </div>

      {/* Radar — matching events vs users */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
          Community coverage radar
        </h3>
        <p className="text-gray-400 text-xs mb-4">
          Comparing registered users against matching event availability per disability group.
          Ideal coverage would show both values balanced.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="disability" tick={{ fontSize: 11, fill: '#64748b' }} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Radar name="Matching events" dataKey="matchingEvents" stroke={INDIGO} fill={INDIGO} fillOpacity={0.2} strokeWidth={2} />
            <Radar name="Registered users" dataKey="users" stroke={AMBER} fill={AMBER} fillOpacity={0.1} strokeWidth={2} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function OverviewCharts({ data }: { data: any }) {
  const { cityData = [], categoryData = [], featureData = [] } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* City comparison */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-1 text-sm">
            Accessible events and avg features by city
          </h3>
          <p className="text-gray-400 text-xs mb-4">
            Comparing event volume against average number of accessibility features per event across UK cities.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="city" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar yAxisId="left"  dataKey="events"      name="Events"            fill={INDIGO} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgFeatures" name="Avg features/event" fill={TEAL}   radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-1 text-sm">
            Free vs paid events by category
          </h3>
          <p className="text-gray-400 text-xs mb-4">
            Understanding financial accessibility barriers — which event types are more likely to be free.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} angle={-35} textAnchor="end" interval={0} height={100} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="free" name="Free" fill={GREEN} radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Paid" fill={AMBER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature provision full width */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
          Accessibility features — provision vs user demand
        </h3>
        <p className="text-gray-400 text-xs mb-4">
          Number of events providing each feature (indigo) versus number of users who have listed it as a preference (amber).
          Gaps between the two bars highlight unmet need.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={featureData} margin={{ top: 5, right: 20, left: 0, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-35} textAnchor="end" interval={0} height={110} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="eventsCount" name="Events providing" fill={INDIGO} radius={[4, 4, 0, 0]} />
            <Bar dataKey="usersWant"   name="Users wanting"   fill={AMBER}  radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function InsightsCharts({ type, data }: { type: string; data: any }) {
  if (type === 'gap')          return <GapChart data={data} />
  if (type === 'underservice') return <UnderserviceChart data={data} />
  if (type === 'overview')     return <OverviewCharts data={data} />
  return null
}
