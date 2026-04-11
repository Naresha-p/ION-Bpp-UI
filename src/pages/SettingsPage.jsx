import React, { useState } from 'react'
import { Settings, Save, Eye, EyeOff } from 'lucide-react'
import useBecknStore from '../store/becknStore'

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

  const save = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Provider & Beckn network configuration</p>
      </div>

      <form onSubmit={save} className="space-y-5">
        {/* Provider Info */}
        <div className="beckn-card p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings size={16} className="text-blue-500" />
            Provider Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Business Name</label>
              <input className="beckn-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Phone</label>
              <input className="beckn-input" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Address</label>
              <input className="beckn-input" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Beckn Network Config */}
        <div className="beckn-card p-5">
          <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Beckn Network Configuration
          </h2>
          <p className="text-xs text-gray-400 mb-4 font-mono">Core Specification v{form.coreVer}</p>

          <div className="grid grid-cols-2 gap-4">
            {[
              ['BAP ID',   'bapId',   'string'],
              ['BAP URI',  'bapUri',  'string'],
              ['BPP ID',   'bppId',   'string'],
              ['BPP URI',  'bppUri',  'string'],
              ['Domain',   'domain',  'string'],
              ['Country',  'country', 'string'],
              ['City',     'city',    'string'],
              ['Core Ver', 'coreVer', 'string'],
            ].map(([label, key]) => (
              <div key={key} className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{label}</label>
                <input className="beckn-input font-mono text-xs" value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Signing Key</label>
              <div className="relative">
                <input
                  className="beckn-input font-mono text-xs pr-10"
                  type={showKey ? 'text' : 'password'}
                  value={form.signingKey}
                  onChange={(e) => setForm({ ...form, signingKey: e.target.value })}
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Mode */}
        <div className="beckn-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Demo Mode</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Uses mock Beckn responses instead of hitting real BG endpoints
              </p>
            </div>
            <button type="button" onClick={() => setDemoMode(!isDemoMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isDemoMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDemoMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <button type="submit" className="beckn-btn-primary px-8 py-2.5">
          <Save size={15} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
