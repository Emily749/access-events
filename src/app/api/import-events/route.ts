import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY!

async function fetchTicketmasterEvents(query: string, location: string) {
  const city = location.split(',')[0].trim()

  const params = new URLSearchParams({
    apikey:      TICKETMASTER_KEY,
    keyword:     query,
    city:        city,
    countryCode: 'GB',
    size:        '20',
    sort:        'date,asc',
  })

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
  console.log('Fetching Ticketmaster URL:', url)

  const res = await fetch(url)
  console.log('Ticketmaster response status:', res.status)

  if (!res.ok) {
    const error = await res.text()
    console.error('Ticketmaster error:', error)
    throw new Error(`Ticketmaster API error ${res.status}: ${error}`)
  }

  const data = await res.json()
  const events = data._embedded?.events || []
  console.log('Ticketmaster events found:', events.length)
  return events
}

function extractAccessibilityFeatures(
  title: string,
  description: string,
  venueName: string,
  availableFeatures: any[]
) {
  const text = `${title} ${description} ${venueName}`.toLowerCase()
  const features: string[] = []

  const rules: Record<string, string[]> = {
    'BSL Interpretation': [
      'bsl', 'british sign language', 'sign language', 'deaf',
      'signed performance', 'sign interpreted',
    ],
    'Audio Description': [
      'audio description', 'audio described', 'visually impaired', 'blind',
    ],
    'Hearing Loop': [
      'hearing loop', 'induction loop', 'loop system', 't-loop', 'hearing aid',
    ],
    'Step-Free Access': [
      'step-free', 'step free', 'wheelchair access', 'wheelchair accessible',
      'level access', 'ramp', 'lift access', 'no steps',
    ],
    'Accessible Toilets': [
      'accessible toilet', 'disabled toilet', 'accessible bathroom',
      'disabled facilities',
    ],
    'Wheelchair Spaces': [
      'wheelchair space', 'wheelchair seating', 'wheelchair platform',
      'wheelchair user', 'accessible seating',
    ],
    'Quiet Room': [
      'quiet room', 'chill out', 'sensory room', 'relaxation room',
      'quiet space', 'low stimulus',
    ],
    'Large Print Materials': [
      'large print', 'large-print', 'large type',
    ],
    'Braille Materials': [
      'braille',
    ],
    'Relaxed Performance': [
      'relaxed performance', 'relaxed show', 'relaxed environment',
      'autism friendly', 'sensory friendly', 'relaxed screening',
    ],
    'Assistance Dog Facilities': [
      'assistance dog', 'guide dog', 'hearing dog', 'service dog',
    ],
    'Accessible Parking': [
      'accessible parking', 'disabled parking', 'blue badge', 'disabled bay',
    ],
    'Captioning': [
      'caption', 'subtitle', 'captioned performance', 'bsl captioned',
      'open captioned',
    ],
    'Low Sensory Environment': [
      'low sensory', 'sensory friendly', 'reduced noise',
      'reduced lighting', 'autism friendly',
    ],
    'Priority Seating': [
      'priority seating', 'reserved seating', 'companion seat', 'carer seat',
    ],
  }

  for (const [feature, keywords] of Object.entries(rules)) {
    if (keywords.some(k => text.includes(k))) {
      features.push(feature)
    }
  }

  const venue = venueName.toLowerCase()

  const knownMajorArenas = [
    'o2 arena', 'wembley', 'manchester arena', 'sse hydro',
    'first direct arena', 'utilita arena', 'resorts world arena',
    'co-op live', 'oak view', 'arena birmingham', 'motorpoint arena',
    'ovo hydro', 'ao arena', 'bp pulse live', 'cardiff arena',
    'metro radio arena', 'sheffield arena',
  ]

  const knownTheatreKeywords = [
    'theatre', 'theater', 'playhouse', 'opera house', 'concert hall',
    'philharmonic', 'symphony hall', 'royal festival', 'barbican',
    'lyceum', 'victoria palace', 'palace theatre', 'apollo', 'palladium',
    'coliseum', 'savoy', 'aldwych', 'garrick', 'noel coward',
    'criterion', 'adelphi', 'shaftesbury', 'dominion', 'duchess',
    'duke of york', 'fortune', 'gielgud', 'harold pinter',
    'her majesty', 'his majesty', 'phoenix', 'piccadilly',
    'prince edward', 'prince of wales', 'queens',
    'st martins', 'vaudeville', 'wyndhams',
  ]

  const isMajorArena = knownMajorArenas.some(v => venue.includes(v))
  const isTheatre    = knownTheatreKeywords.some(v => venue.includes(v))
  const isMajorVenue = isMajorArena || isTheatre

  if (isMajorVenue) {
    ['Step-Free Access', 'Accessible Toilets', 'Wheelchair Spaces'].forEach(f => {
      if (!features.includes(f)) features.push(f)
    })
  }

  if (isMajorArena) {
    ['Accessible Parking', 'Priority Seating'].forEach(f => {
      if (!features.includes(f)) features.push(f)
    })
  }

  if (isTheatre) {
    ['Hearing Loop', 'Large Print Materials'].forEach(f => {
      if (!features.includes(f)) features.push(f)
    })
  }

  const knownAccessibleShows = [
    'hamilton', 'phantom of the opera', 'phantom', 'les miserables',
    'les mis', 'wicked', 'mamma mia', 'lion king', 'chicago', 'grease',
    'cats', 'matilda', 'oliver', 'jersey boys', 'billy elliot', 'six',
    'back to the future', 'mj the musical', '&juliet', 'hadestown',
    'company', 'cabaret', 'dear evan hansen', 'come from away',
    'next to normal', 'little women',
  ]

  const isKnownShow = knownAccessibleShows.some(s =>
    title.toLowerCase().includes(s)
  )

  if (isKnownShow) {
    [
      'BSL Interpretation', 'Audio Description', 'Captioning',
      'Hearing Loop', 'Step-Free Access', 'Accessible Toilets',
      'Wheelchair Spaces', 'Large Print Materials',
    ].forEach(f => {
      if (!features.includes(f)) features.push(f)
    })
  }

  const isSport = text.includes('match') || text.includes('fixture') ||
    text.includes('vs ') || text.includes(' vs') ||
    text.includes('football') || text.includes('rugby') ||
    text.includes('tennis') || text.includes('cricket')

  if (isSport && isMajorVenue) {
    ['Accessible Parking', 'Wheelchair Spaces', 'Step-Free Access',
      'Accessible Toilets', 'Priority Seating'].forEach(f => {
      if (!features.includes(f)) features.push(f)
    })
  }

  const isConcert = text.includes('concert') || text.includes('live music') ||
    text.includes('tour') || text.includes('gig') || text.includes('festival')

  if (isConcert && isMajorVenue) {
    ['Accessible Parking', 'Wheelchair Spaces', 'Step-Free Access',
      'Accessible Toilets'].forEach(f => {
      if (!features.includes(f)) features.push(f)
    })
  }

  const availableNames   = availableFeatures.map(f => f.name)
  const filteredFeatures = features.filter(f => availableNames.includes(f))

  const hasExplicitKeywords = Object.values(rules).flat().some(k =>
    text.includes(k)
  )

  let confidence: string
  if (hasExplicitKeywords && filteredFeatures.length > 3) {
    confidence = 'medium'
  } else if (isKnownShow || (isMajorVenue && filteredFeatures.length > 0)) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  const summary = filteredFeatures.length > 0
    ? `${filteredFeatures.length} accessibility feature${filteredFeatures.length !== 1 ? 's' : ''} identified for ${venueName} based on venue type${isKnownShow ? ' and show accessibility programme' : ''}.`
    : 'No accessibility information found in event description.'

  console.log(`Features found for "${title}":`, filteredFeatures)
  return { features: filteredFeatures, confidence, summary }
}

function mapCategory(tmCategory: string): string {
  const map: Record<string, string> = {
    'Music':             'Music & Concerts',
    'Arts & Theatre':    'Arts & Theatre',
    'Arts':              'Arts & Theatre',
    'Theatre':           'Arts & Theatre',
    'Sports':            'Sports & Fitness',
    'Film':              'Film & Cinema',
    'Miscellaneous':     'Community & Social',
    'Family':            'Community & Social',
    'Comedy':            'Arts & Theatre',
    'Dance':             'Arts & Theatre',
    'Education':         'Education & Talks',
    'Food & Drink':      'Food & Drink',
    'Health & Wellness': 'Wellness & Mindfulness',
    'Charity & Causes':  'Community & Social',
  }
  return map[tmCategory] || 'Community & Social'
}

// Normalise a show title by stripping dates, times, suffixes
// so "Matilda - 18 Mar" and "Matilda - 19 Mar" both become "Matilda"
function normaliseTitle(title: string): string {
  return title
    .replace(/[-–—|:]\s*(mon|tue|wed|thu|fri|sat|sun).*/gi, '')
    .replace(/\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/g, '')
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{0,4}/gi, '')
    .replace(/\b\d{4}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getOrCreateVenue(
  venueName: string,
  address1: string,
  city: string,
  postcode: string,
  latitude: number | null,
  longitude: number | null
): Promise<number> {
  // Check if venue already exists by name
  const { data: existing } = await supabase
    .from('venue')
    .select('venue_id')
    .ilike('name', venueName)
    .limit(1)
    .maybeSingle()

  if (existing) {
    console.log('Reusing existing venue:', venueName)
    return existing.venue_id
  }

  // Create address
  const { data: addressData, error: addressError } = await supabase
    .from('address')
    .insert({
      address_line1: address1,
      city,
      postcode,
      country:  'United Kingdom',
      latitude,
      longitude,
    })
    .select('address_id')
    .single()

  if (addressError || !addressData) throw new Error('Failed to create address')

  // Create venue
  const { data: venueData, error: venueError } = await supabase
    .from('venue')
    .insert({
      address_id: addressData.address_id,
      name:       venueName,
      capacity:   null,
    })
    .select('venue_id')
    .single()

  if (venueError || !venueData) throw new Error('Failed to create venue')
  return venueData.venue_id
}

async function saveEvent(
  tm: any,
  organiserId: number,
  features: any[],
  location: string,
  selectedDate: string
) {
  const tmVenue   = tm._embedded?.venues?.[0]
  const venueName = tmVenue?.name || 'Venue TBC'
  const city      = tmVenue?.city?.name || location.split(',')[0].trim()
  const postcode  = tmVenue?.postalCode || ''
  const address1  = tmVenue?.address?.line1 || venueName
  const latitude  = tmVenue?.location?.latitude  ? parseFloat(tmVenue.location.latitude)  : null
  const longitude = tmVenue?.location?.longitude ? parseFloat(tmVenue.location.longitude) : null

  const venueId = await getOrCreateVenue(
    venueName, address1, city, postcode, latitude, longitude
  )

  const tmCategoryName = tm.classifications?.[0]?.segment?.name || ''
  const categoryName   = mapCategory(tmCategoryName)

  const { data: categoryData } = await supabase
    .from('event_category')
    .select('category_id')
    .eq('name', categoryName)
    .single()

  if (!categoryData) throw new Error(`Category not found: ${categoryName}`)

  const description = [tm.info, tm.pleaseNote, tm.accessibility?.info]
    .filter(Boolean).join(' ') || ''

  const title = normaliseTitle(tm.name || 'Untitled Event')

  // Use the selected date from the dropdown
  const startDate = selectedDate
  const startMs   = new Date(startDate).getTime()
  const endDate   = new Date(startMs + 3 * 60 * 60 * 1000).toISOString()

  const result = extractAccessibilityFeatures(title, description, venueName, features)

  const { data: eventData, error: eventError } = await supabase
    .from('event')
    .insert({
      organiser_id: organiserId,
      venue_id:     venueId,
      category_id:  categoryData.category_id,
      title,
      description:  description.slice(0, 2000) || null,
      start_time:   startDate,
      end_time:     endDate,
      status:       'upcoming',
      ticket_url:   tm.url || null,
      is_free:      false,
    })
    .select('event_id')
    .single()

  if (eventError || !eventData) {
    throw new Error(eventError?.message || 'Failed to create event')
  }

  const matchedFeatures = features.filter(f => result.features?.includes(f.name))

  if (matchedFeatures.length > 0) {
    await supabase.from('event_accessibility').insert(
      matchedFeatures.map(f => ({
        event_id:     eventData.event_id,
        feature_id:   f.feature_id,
        is_confirmed: false,
        details:      result.summary || null,
      }))
    )
  }

  return {
    title,
    eventId:           eventData.event_id,
    featuresExtracted: matchedFeatures.map(f => f.name),
    aiConfidence:      result.confidence,
    aiSummary:         result.summary,
  }
}

// Group Ticketmaster events by normalised show name + venue
function groupEventsByShow(tmEvents: any[]): Record<string, any> {
  const groups: Record<string, any> = {}

  for (const tm of tmEvents) {
    const rawTitle  = tm.name || 'Untitled'
    const normTitle = normaliseTitle(rawTitle)
    const venueName = tm._embedded?.venues?.[0]?.name || 'Venue TBC'
    const key       = `${normTitle}__${venueName}`.toLowerCase()

    if (!groups[key]) {
      groups[key] = {
        normTitle,
        venueName,
        representative: tm,
        dates: [],
      }
    }

    const startDate = tm.dates?.start?.dateTime
      || (tm.dates?.start?.localDate
        ? `${tm.dates.start.localDate}T${tm.dates.start.localTime || '19:00:00'}`
        : new Date().toISOString())

    groups[key].dates.push({
      startDate,
      rawEvent: tm,
    })
  }

  return groups
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, location, organiserId, mode, approved } = body

    console.log('Import route called, mode:', mode)

    if (!location || !organiserId) {
      return NextResponse.json(
        { error: 'location and organiserId are required' },
        { status: 400 }
      )
    }

    if (!TICKETMASTER_KEY) {
      return NextResponse.json(
        { error: 'Ticketmaster API key not configured.' },
        { status: 500 }
      )
    }

    const { data: features } = await supabase
      .from('accessibility_feature')
      .select('feature_id, name, category')
      .eq('is_active', true)

    if (!features?.length) {
      return NextResponse.json(
        { error: 'No accessibility features found in database' },
        { status: 500 }
      )
    }

    // ── CONFIRM MODE ─────────────────────────────────────────────
    if (mode === 'confirm' && approved) {
      const results = []
      const errors  = []

      for (const item of approved) {
        try {
          const saved = await saveEvent(
            item.rawEvent,
            organiserId,
            features,
            location,
            item.selectedDate
          )
          results.push(saved)
        } catch (err: any) {
          console.error('Save error:', err)
          errors.push({ title: item.rawEvent?.name || 'Unknown', error: err.message })
        }
      }

      return NextResponse.json({
        imported: results.length,
        failed:   errors.length,
        results,
        errors,
      })
    }

    // ── PREVIEW MODE ─────────────────────────────────────────────
    if (!query) {
      return NextResponse.json(
        { error: 'query is required for preview mode' },
        { status: 400 }
      )
    }

    console.log('Fetching Ticketmaster events for preview...')
    const tmEvents = await fetchTicketmasterEvents(query, location)

    if (!tmEvents.length) {
      return NextResponse.json({
        previews: [],
        message:  'No events found. Try different keywords or location.',
      })
    }

    // Group by show name + venue
    const groups = groupEventsByShow(tmEvents)

    const previews = Object.values(groups).map((group: any) => {
      const tm          = group.representative
      const venueName   = group.venueName
      const city        = tm._embedded?.venues?.[0]?.city?.name || location.split(',')[0].trim()
      const description = [tm.info, tm.pleaseNote, tm.accessibility?.info]
        .filter(Boolean).join(' ') || ''
      const title       = group.normTitle
      const result      = extractAccessibilityFeatures(title, description, venueName, features)

      // Sort dates ascending
      const sortedDates = group.dates.sort(
        (a: any, b: any) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )

      return {
        title,
        venueName,
        city,
        description:       description.slice(0, 300),
        dates:             sortedDates,
        selectedDate:      sortedDates[0].startDate,
        ticketUrl:         tm.url || null,
        category:          mapCategory(tm.classifications?.[0]?.segment?.name || ''),
        featuresExtracted: result.features,
        aiConfidence:      result.confidence,
        aiSummary:         result.summary,
        // Store all raw events for this group so user can pick date
        rawEvents:         sortedDates,
      }
    })

    return NextResponse.json({ previews })

  } catch (err: any) {
    console.error('Route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
