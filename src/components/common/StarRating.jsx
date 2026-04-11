import React from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, max = 5, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= Math.floor(value)
        const half   = !filled && i < value
        return (
          <Star
            key={i}
            size={size}
            className={filled ? 'text-amber-400 fill-amber-400' : half ? 'text-amber-400 fill-amber-200' : 'text-gray-300 fill-gray-100'}
          />
        )
      })}
    </div>
  )
}
