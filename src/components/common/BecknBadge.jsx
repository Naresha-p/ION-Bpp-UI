import React from 'react'

const COLORS = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
}

export default function BecknBadge({ label, color = 'gray', dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${COLORS[color]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${color === 'green' ? 'bg-emerald-500' : color === 'yellow' ? 'bg-amber-500' : color === 'blue' ? 'bg-blue-500' : color === 'red' ? 'bg-red-500' : 'bg-gray-400'}`} />}
      {label}
    </span>
  )
}
