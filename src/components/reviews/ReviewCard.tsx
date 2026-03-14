import { Star } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function ReviewCard({ review }: { review: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 text-sm font-semibold">
                {review.app_user?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="font-medium text-gray-900 text-sm">
              {review.app_user?.username || 'Anonymous'}
            </span>
            {review.is_verified_attendee && (
              <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Verified attendee
              </span>
            )}
          </div>
          <span className="text-gray-400 text-xs ml-10">
            {formatDateShort(review.created_at)}
          </span>
        </div>
        <div className="text-right">
          <StarRating rating={review.overall_rating} />
          <p className="text-xs text-gray-500 mt-1">Overall</p>
        </div>
      </div>

      {/* Accessibility rating */}
      <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3 mb-4">
        <div>
          <p className="text-xs text-indigo-600 font-medium mb-0.5">Accessibility rating</p>
          <StarRating rating={review.accessibility_rating} />
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          {review.comment}
        </p>
      )}

      {/* Feature ratings */}
      {review.review_feature_rating?.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Feature ratings</p>
          {review.review_feature_rating.map((fr: any) => (
            <div key={fr.accessibility_feature?.name} className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {fr.accessibility_feature?.name}
              </span>
              <StarRating rating={fr.rating} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
