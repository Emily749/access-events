import { cn } from '@/lib/utils'

const categoryColors: Record<string, string> = {
  Communication: 'bg-blue-50 text-blue-700',
  Sensory: 'bg-purple-50 text-purple-700',
  Mobility: 'bg-green-50 text-green-700',
  Visual: 'bg-amber-50 text-amber-700',
}

export default function FeatureBadge({
  name,
  category,
  size = 'md',
}: {
  name: string
  category?: string
  size?: 'sm' | 'md'
}) {
  const colour = category ? categoryColors[category] ?? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-50 text-indigo-700'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1',
        colour
      )}
    >
      {name}
    </span>
  )
}
