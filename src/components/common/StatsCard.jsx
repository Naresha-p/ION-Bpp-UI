import React from 'react'

const GRADIENTS = {
  blue:   'from-blue-500 to-blue-600',
  red:    'from-red-400 to-red-500',
  orange: 'from-orange-400 to-orange-500',
  teal:   'from-teal-500 to-teal-600',
}

export default function StatsCard({ label, value, icon: Icon, color = 'blue', sub }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS[color]} text-white p-5 flex items-center gap-4 shadow-md`}>
      {/* Decorative cart icon */}
      <div className="absolute right-3 bottom-1 opacity-20 pointer-events-none">
        <Icon size={64} strokeWidth={1.2} />
      </div>
      <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-white text-3xl font-bold leading-none mt-0.5">{value}</p>
        {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  )
}
