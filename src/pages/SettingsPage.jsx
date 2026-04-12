import { useState } from 'react'
import { Save, Eye, EyeOff, CheckCircle2, Store, Wifi, FlaskConical } from 'lucide-react'
import useBecknStore from '../store/becknStore'

export default function SettingsPage() {
  const { provider, isDemoMode, setDemoMode } = useBecknStore()

  const [form, setForm] = useState({
    name:       provider?.name    || '',
    phone:      provider?.phone   || '',
    address:    provider?.address || '',
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
    <div className="max-w-2xl space-y-6 animate-fade-in">

      {/* ── Page heading ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
          Manage your provider profile and Beckn network configuration
        </p>
      </div>

      <form onSubmit={save} className="space-y-4">

        {/* ── Provider Information ── */}
        <div className="beckn-card">
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Store size={15} style={{ color: '#a5b4fc' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Provider Information</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Your store identity on the Beckn network</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-3)' }}>Business Name</label>
              <input className="beckn-input" value={form.name}
                onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>Phone</label>
                <input className="beckn-input" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>Country</label>
                <input className="beckn-input" value={form.country}
                  onChange={(e) => set('country', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-3)' }}>Address</label>
              <input className="beckn-input" value={form.address}
                onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Beckn Network Configuration ── */}
        <div className="beckn-card">
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <Wifi size={15} style={{ color: '#86efac' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Beckn Network</p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
                Core Spec v{form.coreVer} · {form.domain} · {form.city}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>BAP ID</label>
                <input className="beckn-input font-mono text-xs" value={form.bapId}
                  onChange={(e) => set('bapId', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>BAP URI</label>
                <input className="beckn-input font-mono text-xs" value={form.bapUri}
                  onChange={(e) => set('bapUri', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>BPP ID</label>
                <input className="beckn-input font-mono text-xs" value={form.bppId}
                  onChange={(e) => set('bppId', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>BPP URI</label>
                <input className="beckn-input font-mono text-xs" value={form.bppUri}
                  onChange={(e) => set('bppUri', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>Domain</label>
                <input className="beckn-input font-mono text-xs" value={form.domain}
                  onChange={(e) => set('domain', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>City Code</label>
                <input className="beckn-input font-mono text-xs" value={form.city}
                  onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--text-3)' }}>Core Version</label>
                <input className="beckn-input font-mono text-xs" value={form.coreVer}
                  onChange={(e) => set('coreVer', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-3)' }}>Signing Key</label>
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
        <div className="beckn-card">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <FlaskConical size={15} style={{ color: '#fcd34d' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Demo Mode</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {isDemoMode ? 'Using simulated API responses' : 'Connected to live endpoints'}
                </p>
              </div>
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
          <button type="submit" className="beckn-btn-primary px-8 py-2.5">
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
