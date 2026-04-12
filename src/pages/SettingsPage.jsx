import { useState } from 'react'
import { Settings, Save, Eye, EyeOff, User, Network, FlaskConical, CheckCircle2 } from 'lucide-react'
import useBecknStore from '../store/becknStore'

function Label({ children }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
      style={{ color: 'var(--text-3)' }}>
      {children}
    </label>
  )
}

function CardHeader({ icon: Icon, color, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color.bg, border: `1px solid ${color.border}` }}>
        <Icon size={15} style={{ color: color.icon }} />
      </div>
      <div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{subtitle}</p>}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { provider, isDemoMode, setDemoMode } = useBecknStore()
  const [form, setForm] = useState({
    name:       provider.name,
    phone:      provider.phone,
    address:    provider.address,
    bapId:      import.meta.env.VITE_BAP_ID  || 'ion-bap.example.id',
    bapUri:     import.meta.env.VITE_BAP_URI || 'https://ion-bap.example.id/beckn',
    bppId:      import.meta.env.VITE_BPP_ID  || 'ion-bpp.example.id',
    bppUri:     import.meta.env.VITE_BPP_URI || 'https://ion-bpp.example.id/beckn',
    domain:     'retail',
    country:    'IDN',
    city:       'std:022',
    coreVer:    '1.1.0',
    signingKey: '••••••••••••••••',
  })
  const [showKey, setShowKey] = useState(false)
  const [saved,   setSaved]   = useState(false)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const save = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
          Provider &amp; Beckn network configuration
        </p>
      </div>

      <form onSubmit={save} className="space-y-4">

        {/* ── Provider Info ── */}
        <div className="beckn-card p-5">
          <CardHeader
            icon={User}
            color={{ bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', icon: '#a5b4fc' }}
            title="Provider Information"
            subtitle="Your store profile visible on the Beckn network"
          />
          <div className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <input className="beckn-input" value={form.name}
                onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <input className="beckn-input" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <Label>Country</Label>
                <input className="beckn-input" value={form.country}
                  onChange={(e) => set('country', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <input className="beckn-input" value={form.address}
                onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Beckn Network Config ── */}
        <div className="beckn-card p-5">
          <CardHeader
            icon={Network}
            color={{ bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', icon: '#86efac' }}
            title="Beckn Network Configuration"
            subtitle={`Core Specification v${form.coreVer}`}
          />
          <div className="grid grid-cols-2 gap-4">
            {[
              ['BAP ID',   'bapId'],
              ['BAP URI',  'bapUri'],
              ['BPP ID',   'bppId'],
              ['BPP URI',  'bppUri'],
              ['Domain',   'domain'],
              ['City',     'city'],
              ['Core Ver', 'coreVer'],
            ].map(([label, key]) => (
              <div key={key} className={key.endsWith('Uri') || key.endsWith('Id') ? 'col-span-2 sm:col-span-1' : ''}>
                <Label>{label}</Label>
                <input className="beckn-input font-mono text-xs" value={form[key]}
                  onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}

            {/* Signing Key — full width */}
            <div className="col-span-2">
              <Label>Signing Key</Label>
              <div className="relative">
                <input
                  className="beckn-input font-mono text-xs pr-10"
                  type={showKey ? 'text' : 'password'}
                  value={form.signingKey}
                  onChange={(e) => set('signingKey', e.target.value)}
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-3)' }}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Demo Mode ── */}
        <div className="beckn-card p-5">
          <CardHeader
            icon={FlaskConical}
            color={{ bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', icon: '#fcd34d' }}
            title="Demo Mode"
            subtitle="Uses mock Beckn responses instead of hitting real BG endpoints"
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                {isDemoMode ? 'Demo mode is active' : 'Demo mode is off'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                {isDemoMode
                  ? 'API calls return simulated responses'
                  : 'All requests go to live Beckn endpoints'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDemoMode(!isDemoMode)}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: isDemoMode ? '#6366f1' : 'var(--surface-o)' }}>
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: isDemoMode ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        </div>

        {/* ── Save ── */}
        <div className="flex items-center gap-3">
          <button type="submit"
            className="beckn-btn-primary px-8 py-2.5">
            {saved
              ? <><CheckCircle2 size={15} /> Saved!</>
              : <><Save size={15} /> Save Settings</>}
          </button>
          {saved && (
            <p className="text-xs font-medium" style={{ color: '#86efac' }}>
              Changes saved successfully
            </p>
          )}
        </div>

      </form>
    </div>
  )
}
