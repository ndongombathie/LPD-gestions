import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItemClass = ({ isActive }) => `
  flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 font-medium
  ${isActive
    ? 'bg-primary-500 text-white shadow-md'
    : 'text-white hover:bg-primary-600/80'}
`

const CaissierLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-light dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={`
          w-64 bg-primary-700 dark:bg-primary-800 border-r border-primary-800 
          hidden md:flex md:flex-col fixed md:static inset-y-0 z-30
          ${isMobileMenuOpen ? 'flex' : 'hidden'}
        `}>
          <div className="px-6 py-5 border-b border-primary-600/30">
            <h1 className="text-xl font-bold text-white">LPD Caisse</h1>
            <p className="text-xs text-white/80 mt-1">Interface Caissier</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto bg-primary-700">
            <NavLink to="/caissier/dashboard" className={navItemClass} onClick={() => setIsMobileMenuOpen(false)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Tableau de bord
            </NavLink>

            <NavLink to="/caissier/caisse" className={navItemClass} onClick={() => setIsMobileMenuOpen(false)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Caisse
            </NavLink>

            <NavLink to="/caissier/decaissements" className={navItemClass} onClick={() => setIsMobileMenuOpen(false)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Décaissements
            </NavLink>

            <NavLink to="/caissier/historique" className={navItemClass} onClick={() => setIsMobileMenuOpen(false)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historique
            </NavLink>

            <NavLink to="/caissier/rapport" className={navItemClass} onClick={() => setIsMobileMenuOpen(false)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Rapport
            </NavLink>
          </nav>

          <div className="p-4 border-t border-primary-600/30 text-xs text-white/60">
            © {new Date().getFullYear()} LPD Gestions
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
          {/* Header */}
          <header className="bg-background-light dark:bg-gray-800 shadow-sm border-b border-gray-300">
            <div className="flex items-center justify-between px-4 py-4 md:px-6">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-primary-600 hover:bg-primary-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex-1 md:ml-0 flex items-center gap-3">
                <div className="w-1 h-8 bg-accent-500 rounded-full"></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Interface Caissier
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestion de caisse quotidienne</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-400 to-accent-500 rounded-lg border-2 border-accent-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-white drop-shadow-sm">Caissier</span>
                </div>
                
                <button className="p-2 rounded-md text-primary-600 hover:bg-primary-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 hover:shadow-md">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default CaissierLayout

