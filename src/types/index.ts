export type DisabilityType = {
  disability_id: number
  name: string
  category: string
  description: string | null
}

export type AccessibilityFeature = {
  feature_id: number
  name: string
  description: string | null
  category: string
  icon_code: string | null
  is_active: boolean
}

export type AppUser = {
  user_id: number
  username: string
  email: string
  role: 'attendee' | 'organiser' | 'admin'
  created_at: string
  is_verified: boolean
  profile_photo_url: string | null
}

export type Address = {
  address_id: number
  address_line1: string
  postcode: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
}

export type Venue = {
  venue_id: number
  address_id: number
  name: string
  capacity: number | null
  transport_info: string | null
  parking_info: string | null
  address?: Address
}

export type EventCategory = {
  category_id: number
  name: string
  icon_code: string | null
}

export type Event = {
  event_id: number
  organiser_id: number
  venue_id: number
  category_id: number
  title: string
  description: string | null
  start_time: string
  end_time: string
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  ticket_url: string | null
  is_free: boolean
  created_at: string
  updated_at: string
  venue?: Venue
  category?: EventCategory
  organiser?: AppUser
  accessibility_features?: EventAccessibility[]
  images?: EventImage[]
}

export type EventAccessibility = {
  event_id: number
  feature_id: number
  details: string | null
  is_confirmed: boolean
  evidence_url: string | null
  feature?: AccessibilityFeature
}

export type EventImage = {
  image_id: number
  event_id: number
  url: string
  alt_text: string | null
  is_primary: boolean
}

export type Review = {
  review_id: number
  user_id: number
  event_id: number
  overall_rating: number
  accessibility_rating: number
  comment: string | null
  is_verified_attendee: boolean
  created_at: string
  user?: AppUser
  feature_ratings?: ReviewFeatureRating[]
}

export type ReviewFeatureRating = {
  review_id: number
  feature_id: number
  rating: number
  comment: string | null
  feature?: AccessibilityFeature
}

export type SavedEvent = {
  user_id: number
  event_id: number
  saved_at: string
  event?: Event
}

export type UserPreference = {
  user_id: number
  feature_id: number
  priority_level: number
  feature?: AccessibilityFeature
}

export type UserDisability = {
  user_id: number
  disability_id: number
  is_primary: boolean
  disability?: DisabilityType
}

export type AccessibilityReport = {
  report_id: number
  user_id: number
  event_id: number
  feature_id: number
  issue_type: string
  description: string
  status_code: string
  reported_at: string
}

export type Notification = {
  notification_id: number
  user_id: number
  event_id: number | null
  type_code: string
  message: string
  is_read: boolean
  sent_at: string
}
