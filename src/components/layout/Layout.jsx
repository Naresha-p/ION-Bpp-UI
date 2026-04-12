import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'
import useBecknStore from '../../store/becknStore'

export default function Layout() {
  const { isDemoMode } = useBecknStore()

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Header />

      <div className="flex flex-1 overflow-hidden pt-14">
        <Sidebar />

        <main className="flex-1 ml-56 overflow-y-auto">
          {isDemoMode && (
            <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              <span className="text-base leading-none">✦</span>
              <span className="font-semibold">Demo Mode</span>
              <span style={{ color: 'var(--text-2)' }} className="ml-1">
                Live data is simulated — connect your BPP backend to go live.
              </span>
            </div>
          )}
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
