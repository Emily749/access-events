'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'

type Filters = {
  search: string
  category: string
  city: string
  feature: string
  isFree: boolean
}

export default function FilterBar({
  filters,
  onChange,
  categories,
  features,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
  categories: any[]
  features: any[]
}) {
  function update(key: keyof Filters, value: any) {
    onChange({ ...filters, [key]: value })
  }

  function clearAll() {
    onChange({ search: '', category: '', city: '', feature: '', isFree: false })
  }

  const hasFilters = filters.search || filters.category || filters.city || filters.feature || filters.isFree

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={filters.search}
          onChange={e => update('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Category */}
        <select
          value={filters.category}
          onChange={e => update('category', e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c: any) => (
            <option key={c.category_id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* City */}
        <select
          value={filters.city}
          onChange={e => update('city', e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All cities</option>
          {['London', 'Birmingham', 'Manchester', 'Edinburgh', 'Bristol', 'Leeds', 'Glasgow'].map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        {/* Accessibility feature */}
        <select
          value={filters.feature}
          onChange={e => update('feature', e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All accessibility features</option>
          {features.map((f: any) => (
            <option key={f.feature_id} value={f.name}>{f.name}</option>
          ))}
        </select>

        {/* Free only toggle */}
        <button
          onClick={() => update('isFree', !filters.isFree)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            filters.isFree
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {filters.isFree ? '✓ Free events only' : 'Free events only'}
        </button>
      </div>

      {/* Active filters / clear */}
      {hasFilters && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                Search: {filters.search}
                <button onClick={() => update('search', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.category && (
              <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {filters.category}
                <button onClick={() => update('category', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.city && (
              <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {filters.city}
                <button onClick={() => update('city', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.feature && (
              <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {filters.feature}
                <button onClick={() => update('feature', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        </div>
      )}
    </div>
  )
}
