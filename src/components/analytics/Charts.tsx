'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts'

const INDIGO = '#4f46e5'
const PURPLE = '#7c3aed'
const TEAL   = '#0d9488'
const AMBER  = '#d97706'
const CORAL  = '#e11d48'
const GREEN  = '#16a34a'
const SLATE  = '#475569'

export const PALETTE = [INDIGO, TEAL, AMBER, CORAL, GREEN, PURPLE, SLATE, '#0284c7', '#9333ea', '#b45309']

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

export function FeaturePopularityChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="fullName" tick={{ fontSize: 11, fill: '#64748b' }} angle={-35} textAnchor="end" interval={0} height={100} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Events" radius={[6, 6, 0, 0]}>
          {data.map((_: any, i: number) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryRatingsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="fullCategory" tick={{ fontSize: 10, fill: '#64748b' }} angle={-35} textAnchor="end" interval={0} height={100} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#64748b' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
        <Bar dataKey="accessibility" name="Accessibility" fill={INDIGO} radius={[4, 4, 0, 0]} />
        <Bar dataKey="overall"       name="Overall"       fill={TEAL}   radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function FreeVsPaidChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="fullCategory" tick={{ fontSize: 10, fill: '#64748b' }} angle={-35} textAnchor="end" interval={0} height={100} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
        <Bar dataKey="free" name="Free" fill={GREEN} radius={[4, 4, 0, 0]} />
        <Bar dataKey="paid" name="Paid" fill={AMBER} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ReviewTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: '#64748b' }}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fill: '#64748b' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line yAxisId="left"  type="monotone" dataKey="reviews"    name="Reviews"           stroke={INDIGO} strokeWidth={2} dot={{ r: 4, fill: INDIGO }} activeDot={{ r: 6 }} />
        <Line yAxisId="right" type="monotone" dataKey="avgAcc"     name="Avg accessibility" stroke={TEAL}   strokeWidth={2} dot={{ r: 4, fill: TEAL }}   activeDot={{ r: 6 }} />
        <Line yAxisId="right" type="monotone" dataKey="avgOverall" name="Avg overall"       stroke={AMBER}  strokeWidth={2} dot={{ r: 4, fill: AMBER }}  activeDot={{ r: 6 }} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ScatterPlotChart({ data }: { data: any[] }) {
  return (
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
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fill: '#64748b' }}
          label={{ value: 'Avg rating', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
        />
        <ZAxis dataKey="reviews" range={[40, 200]} />
        <Tooltip content={<ScatterTooltip />} />
        <Scatter data={data} fill={INDIGO} fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export function CityEventChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
        <YAxis dataKey="city" type="category" tick={{ fontSize: 12, fill: '#475569' }} width={56} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Events" radius={[0, 6, 6, 0]}>
          {data.map((_: any, i: number) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RadarChartComponent({ radarData, radarCats }: { radarData: any[]; radarCats: string[] }) {
  if (!radarData.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        No relevance data available
      </div>
    )
  }

  const chartData = radarCats.map((cat: string) => {
    const point: any = { category: cat }
    radarData.forEach((d: any) => { point[d.disability] = d[cat] || 0 })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
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
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function SearchTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line yAxisId="left"  type="monotone" dataKey="searches"   name="Searches"   stroke={INDIGO} strokeWidth={2} dot={{ r: 4, fill: INDIGO }} />
        <Line yAxisId="right" type="monotone" dataKey="avgResults" name="Avg results" stroke={CORAL}  strokeWidth={2} dot={{ r: 4, fill: CORAL  }} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  )
}
