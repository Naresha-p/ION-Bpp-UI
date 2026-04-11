import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'
import useBecknStore from '../../store/becknStore'

export default function Layout() {
  const { isDemoMode } = useBecknStore()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Full-width top navbar */}
      <Header />

      {/* Body: sidebar + main content, sits below the 64px navbar */}
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar />

        <main className="flex-1 ml-56 overflow-y-auto">
          {isDemoMode && (
            <div className="flex items-center gap-2 mx-6 mt-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-blue-500 text-sm">✦</span>
              <span className="text-blue-700 text-sm font-semibold">Demo Mode</span>
              <span className="text-blue-600 text-sm ml-1">
                This is a demo display for ION Indonesia
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
