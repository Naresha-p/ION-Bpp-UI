const STYLES = {
  blue:   { accent: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)',  text: '#a5b4fc' },
  teal:   { accent: '#14b8a6', bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.2)',  text: '#5eead4' },
  orange: { accent: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  text: '#fdba74' },
  red:    { accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)',   text: '#fda4af' },
  green:  { accent: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   text: '#86efac' },
}

export default function StatsCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const s = STYLES[color] || STYLES.blue
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      {/* Decorative bg icon */}
      <div className="absolute right-2 bottom-0 pointer-events-none opacity-[0.07]">
        <Icon size={72} strokeWidth={1} style={{ color: s.accent }} />
      </div>

      {/* Icon circle */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${s.accent}22`, border: `1px solid ${s.border}` }}
      >
        <Icon size={18} style={{ color: s.accent }} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          {label}
        </p>
        <p className="text-3xl font-bold leading-none mt-1" style={{ color: s.text }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-3)' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}
