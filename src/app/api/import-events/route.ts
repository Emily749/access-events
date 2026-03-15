import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_API_KEY!

// Fetch events from Eventbrite
async function fetchEventbriteEvents(query: string, location: string) {
  const params = new URLSearchParams({
    'q':                    query,
    'location.address':     location,
    'location.within':      '50km',
    'expand':               'venue,category,description',
    'status':               'live',
    'sort_by':              'date',
    'page_size':            '20',
  })

  const res = await fetch(
    `https://www.eventbriteapi.com/v3/events/search/?${params}`,
    {
      headers: {
        Authorization: `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Eventbrite API error: ${error}`)
  }

  const data = await res.json()
  return data.events || []
}

// Use Claude to extract accessibility features from event description
async function extractAccessibilityFeatures(
  title: string,
  description: string,
  availableFeatures: any[]
) {
  const featureNames = availableFeatures.map(f => f.name).join(', ')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key':    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // handled by proxy
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role:    'user',
          content: `You are an accessibility information analyst. Analyse this event and identify which accessibility features are present, mentioned, or strongly implied.

Event title: ${title}

Event description:
${description}

Available accessibility features to choose from:
${featureNames}

Rules:
- Only select features that are clearly mentioned or very strongly implied by the description
- Do not guess or assume features that are not evidenced
- If the description mentions "relaxed" or "relaxed performance", include "Relaxed Performance"
- If it mentions BSL, sign language or interpreter, include "BSL Interpretation"  
- If it mentions step free, wheelchair, accessible entrance, include "Step-Free Access"
- If it mentions hearing loop, induction loop, include "Hearing Loop"
- If it mentions audio description, include "Audio Description"
- If it mentions captions, subtitles, captioning, include "Captioning"
- If it mentions quiet room, chill out space, sensory room, include "Quiet Room"
- If it mentions accessible parking or blue badge, include "Accessible Parking"
- If it mentions accessible toilet or disabled toilet, include "Accessible Toilets"
- If it mentions wheelchair space or wheelchair seating, include "Wheelchair Spaces"
- If it mentions assistance dog, guide dog, hearing dog, include "Assistance Dog Facilities"
- If it mentions large print, include "Large Print Materials"
- If it mentions braille, include "Braille Materials"
- If it mentions low sensory or sensory friendly, include "Low Sensory Environment"
- If it mentions priority seating or reserved seating for disabled, include "Priority Seating"

Respond with ONLY a valid JSON object:
{"features": ["Feature Name 1", "Feature Name 2"], "confidence": "high|medium|low", "summary": "One sentence describing the accessibility provision"}

If no features are found, return: {"features": [], "confidence": "low", "summary": "No accessibility information found in description"}`,
        },
      ],
    }),
  })

  const data = await res.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { features: [], confidence: 'low', summary: 'Could not parse accessibility data' }
  }
}

// Map Eventbrite category to your event_category table
function mapCategory(eventbriteCategory: string): string {
  const map: Record<string, string> = {
    'Music':                    'Music & Concerts',
    'Performing & Visual Arts': 'Arts & Theatre',
    'Sports & Fitness':         'Sports & Fitness',
    'Science & Technology':     'Education & Talks',
    'Education':                'Education & Talks',
    'Community & Culture':      'Community & Social',
    'Food & Drink':             'Food & Drink',
    'Film & Media':             'Film & Cinema',
    'Health & Wellness':        'Wellness & Mindfulness',
    'Charity & Causes':         'Community & Social',
    'Business & Professional':  'Education & Talks',
    'Family & Education':       'Community & Social',
  }
  return map[eventbriteCategory] || 'Community & Social'
}

export async function POST(req: NextRequest) {
  try {
    const { query, location, organiserId } = await req.json()

    if (!query || !location || !organiserId) {
      return NextResponse.json(
        { error: 'query, location and organiserId are required' },
        { status: 400 }
      )
    }

    // Fetch accessibility features from DB
    const { data: features } = await supabase
      .from('accessibility_feature')
      .select('feature_id, name, category')
      .eq('is_active', true)

    if (!features?.length) {
      return NextResponse.json({ error: 'No accessibility features found in database' }, { status: 500 })
    }

    // Fetch events from Eventbrite
    const eventbriteEvents = await fetchEventbriteEvents(query, location)

    if (!eventbriteEvents.length) {
      return NextResponse.json({ imported: 0, message: 'No events found on Eventbrite for this search' })
    }

    const results = []
    const errors  = []

    for (const eb of eventbriteEvents) {
      try {
        // Get or create address
        const venue    = eb.venue
        const city     = venue?.address?.city || location
        const postcode = venue?.address?.postal_code || ''
        const address1 = venue?.address?.address_1 || venue?.name || 'See event page'

        const { data: addressData, error: addressError } = await supabase
          .from('address')
          .insert({
            address_line1: address1,
            city,
            postcode,
            country:   'United Kingdom',
            latitude:  venue?.latitude  ? parseFloat(venue.latitude)  : null,
            longitude: venue?.longitude ? parseFloat(venue.longitude) : null,
          })
          .select('address_id')
          .single()

        if (addressError || !addressData) {
          errors.push({ title: eb.name?.text, error: 'Failed to create address' })
          continue
        }

        // Get or create venue
        const { data: venueData, error: venueError } = await supabase
          .from('venue')
          .insert({
            address_id: addressData.address_id,
            name:       venue?.name || 'Venue TBC',
            capacity:   venue?.capacity || null,
          })
          .select('venue_id')
          .single()

        if (venueError || !venueData) {
          errors.push({ title: eb.name?.text, error: 'Failed to create venue' })
          continue
        }

        // Get category id
        const categoryName = mapCategory(eb.category?.name || '')
        const { data: categoryData } = await supabase
          .from('event_category')
          .select('category_id')
          .eq('name', categoryName)
          .single()

        if (!categoryData) {
          errors.push({ title: eb.name?.text, error: `Category not found: ${categoryName}` })
          continue
        }

        // Build description from Eventbrite
        const description = eb.description?.text || eb.summary || ''
        const title       = eb.name?.text || 'Untitled Event'

        // Use Claude to extract accessibility features
        const aiResult = await extractAccessibilityFeatures(title, description, features)

        // Insert event
        const { data: eventData, error: eventError } = await supabase
          .from('event')
          .insert({
            organiser_id: organiserId,
            venue_id:     venueData.venue_id,
            category_id:  categoryData.category_id,
            title,
            description:  description.slice(0, 2000) || null,
            start_time:   eb.start?.utc || new Date().toISOString(),
            end_time:     eb.end?.utc   || new Date().toISOString(),
            status:       'upcoming',
            ticket_url:   eb.url || null,
            is_free:      eb.is_free || false,
          })
          .select('event_id')
          .single()

        if (eventError || !eventData) {
          errors.push({ title, error: eventError?.message || 'Failed to create event' })
          continue
        }

        // Match AI-extracted features to DB features and insert
        const matchedFeatures = features.filter(f =>
          aiResult.features.includes(f.name)
        )

        if (matchedFeatures.length > 0) {
          await supabase
            .from('event_accessibility')
            .insert(
              matchedFeatures.map(f => ({
                event_id:    eventData.event_id,
                feature_id:  f.feature_id,
                is_confirmed: false,
                details:     aiResult.summary || null,
              }))
            )
        }

        results.push({
          title,
          eventId:            eventData.event_id,
          featuresExtracted:  matchedFeatures.map(f => f.name),
          aiConfidence:       aiResult.confidence,
          aiSummary:          aiResult.summary,
        })

      } catch (err: any) {
        errors.push({ title: eb.name?.text || 'Unknown', error: err.message })
      }
    }

    return NextResponse.json({
      imported: results.length,
      failed:   errors.length,
      results,
      errors,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

**Step 3 — Add the service role key to environment variables**

The API route needs elevated Supabase permissions to insert data. Go to Supabase → **Project Settings** → **API** and copy the **service_role** key.

Add to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Also add it to Vercel — go to your Vercel project → **Settings** → **Environment Variables** and add:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
