'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import {
  getAccessibilityFeatures,
  getUserPreferences,
  getUserDisabilities,
} from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { User, Save, Check } from 'lucide-react'

export default function ProfilePage() {
  const { appUser } = useAuth()
  const [features, setFeatures] = useState<any[]>([])
  const [disabilities, setDisabilities] = useState<any[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([])
  const [selectedDisabilities, setSelectedDisabilities] = useState<number[]>([])
  const [allDisabilities, setAllDisabilities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      if (!appUser) return

      const [feats, prefs, disabilityTypes, userDisabilities] = await Promise.all([
        getAccessibilityFeatures(),
        getUserPreferences(appUser.user_id),
        supabase.from('disability_type').select('*').order('name'),
        getUserDisabilities(appUser.user_id),
      ])

      setFeatures(feats)
      setSelectedFeatures(prefs.map((p: any) => p.feature_id))
      setAllDisabilities(disabilityTypes.data || [])
      setSelectedDisabilities(userDisabilities.map((d: any) => d.disability_id))
      setLoading(false)
    }

    load()
  }, [appUser])

  function toggleFeature(id: number) {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  function toggleDisability(id: number) {
    setSelectedDisabilities(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    if (!appUser) return
    setSaving(true)

    // Save preferences
    await supabase
      .from('user_preference')
      .delete()
      .eq('user_id', appUser.user_id)

    if (selectedFeatures.length > 0) {
      await supabase.from('user_preference').insert(
        selectedFeatures.map(feature_id => ({
          user_id: appUser.user_id,
          feature_id,
          priority_level: 1,
        }))
      )
    }

    // Save disabilities
    await supabase
      .from('user_disability')
      .delete()
      .eq('user_id', appUser.user_id)

    if (selectedDisabilities.length > 0) {
      await supabase.from('user_disability').insert(
        selectedDisabilities.map((disability_id, i) => ({
          user_id: appUser.user_id,
          disability_id,
          is_primary: i === 0,
        }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Group features by category
  const featuresByCategory = features.reduce((acc: any, f: any) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{appUser?.username}</h1>
            <p className="text-gray-500 text-sm">{appUser?.email}</p>
          </div>
        </div>

        <div className="space-y-6">

          {/* Disability types */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Your disability or access needs
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              This helps us show you the most relevant accessibility information.
            </p>
            <div className="flex flex-wrap gap-2">
              {allDisabilities.map((d: any) => (
                <button
                  key={d.disability_id}
                  onClick={() => toggleDisability(d.disability_id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                    selectedDisabilities.includes(d.disability_id)
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {selectedDisabilities.includes(d.disability_id) && (
                    <span className="mr-1">✓</span>
                  )}
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility preferences */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Accessibility preferences
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Select the features you need at events. We will use these to filter recommendations for you.
            </p>

            <div className="space-y-6">
              {Object.entries(featuresByCategory).map(([category, feats]: [string, any]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {feats.map((f: any) => (
                      <button
                        key={f.feature_id}
                        onClick={() => toggleFeature(f.feature_id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                          selectedFeatures.includes(f.feature_id)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {selectedFeatures.includes(f.feature_id) && (
                          <span className="mr-1">✓</span>
                        )}
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } disabled:opacity-50`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Preferences saved
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
