import { supabase } from './supabase'

export async function getEvents({
  search = '',
  category = '',
  city = '',
  feature = '',
  isFree = false,
}: {
  search?: string
  category?: string
  city?: string
  feature?: string
  isFree?: boolean
} = {}) {
  let query = supabase
    .from('event')
    .select(`
      event_id,
      title,
      start_time,
      end_time,
      is_free,
      status,
      venue (
        name,
        address (city)
      ),
      event_category (name, icon_code),
      event_accessibility (
        feature_id,
        accessibility_feature (name, category)
      ),
      event_image (url, alt_text, is_primary)
    `)
    .eq('status', 'upcoming')
    .order('start_time', { ascending: true })
    .limit(50)

  if (search) query = query.ilike('title', `%${search}%`)
  if (isFree) query = query.eq('is_free', true)

  const { data, error } = await query
  if (error) {
    console.error('getEvents error:', error)
    return []
  }

  let results = data || []

  if (city) {
    results = results.filter((e: any) =>
      e.venue?.address?.city?.toLowerCase().includes(city.toLowerCase())
    )
  }

  if (feature) {
    results = results.filter((e: any) =>
      e.event_accessibility?.some((ea: any) =>
        ea.accessibility_feature?.name?.toLowerCase().includes(feature.toLowerCase())
      )
    )
  }

  return results
}

export async function getEventById(id: number) {
  const { data, error } = await supabase
    .from('event')
    .select(`
      *,
      venue (
        *,
        address (*),
        venue_accessibility (
          is_confirmed,
          details,
          accessibility_feature (name, icon_code, category)
        )
      ),
      event_category (name, icon_code),
      app_user!organiser_id (username),
      event_accessibility (
        details,
        is_confirmed,
        evidence_url,
        accessibility_feature (name, icon_code, category, description)
      ),
      event_image (url, alt_text, is_primary),
      review (
        *,
        app_user (username),
        review_feature_rating (
          rating,
          comment,
          accessibility_feature (name)
        )
      )
    `)
    .eq('event_id', id)
    .single()

  if (error) {
    console.error('getEventById error:', error)
    return null
  }

  return data
}

export async function getAccessibilityFeatures() {
  const { data, error } = await supabase
    .from('accessibility_feature')
    .select('*')
    .eq('is_active', true)
    .order('category')

  if (error) return []
  return data
}

export async function getEventCategories() {
  const { data, error } = await supabase
    .from('event_category')
    .select('*')
    .order('name')

  if (error) return []
  return data
}

export async function getSavedEvents(userId: number) {
  const { data, error } = await supabase
    .from('saved_event')
    .select(`
      *,
      event (
        event_id,
        title,
        start_time,
        end_time,
        is_free,
        status,
        venue (name, address (city)),
        event_category (name, icon_code),
        event_accessibility (
          accessibility_feature (name, icon_code)
        ),
        event_image (url, alt_text, is_primary)
      )
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })

  if (error) return []
  return data
}

export async function toggleSaveEvent(userId: number, eventId: number) {
  const { data: existing } = await supabase
    .from('saved_event')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .single()

  if (existing) {
    await supabase
      .from('saved_event')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId)
    return false
  } else {
    await supabase
      .from('saved_event')
      .insert({ user_id: userId, event_id: eventId })
    return true
  }
}

export async function getUserPreferences(userId: number) {
  const { data, error } = await supabase
    .from('user_preference')
    .select(`
      *,
      accessibility_feature (name, icon_code, category)
    `)
    .eq('user_id', userId)

  if (error) return []
  return data
}

export async function getUserDisabilities(userId: number) {
  const { data, error } = await supabase
    .from('user_disability')
    .select(`
      *,
      disability_type (name, category)
    `)
    .eq('user_id', userId)

  if (error) return []
  return data
}

export async function logSearch({
  userId,
  queryText,
  filters,
  resultsCount,
}: {
  userId?: number
  queryText: string
  filters: Record<string, string>
  resultsCount: number
}) {
  try {
    const { data: logData, error: logError } = await supabase
      .from('search_log')
      .insert({
        user_id: userId || null,
        query_text: queryText || null,
        results_count: resultsCount,
      })
      .select('log_id')
      .single()

    if (logError || !logData) return

    const filterEntries = Object.entries(filters).filter(([_, v]) => v)
    if (filterEntries.length > 0) {
      await supabase.from('search_filter').insert(
        filterEntries.map(([key, value]) => ({
          log_id: logData.log_id,
          filter_key: key,
          filter_value: String(value),
        }))
      )
    }
  } catch (e) {
    console.error('logSearch error:', e)
  }
}

export async function getNotifications(userId: number) {
  const { data, error } = await supabase
    .from('notification')
    .select(`
      *,
      event (event_id, title)
    `)
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(20)

  if (error) return []
  return data
}

export async function getUnreadCount(userId: number) {
  const { count, error } = await supabase
    .from('notification')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) return 0
  return count || 0
}

export async function markNotificationRead(notificationId: number) {
  await supabase
    .from('notification')
    .update({ is_read: true })
    .eq('notification_id', notificationId)
}

export async function markAllNotificationsRead(userId: number) {
  await supabase
    .from('notification')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}
