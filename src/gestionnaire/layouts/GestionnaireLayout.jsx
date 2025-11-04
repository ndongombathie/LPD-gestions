import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItemClass = ({ isActive }) => `
  flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 font-medium
  ${isActive
    ? 'bg-primary-600 text-white shadow-md'
    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-gray-700'}
`

const GestionnaireLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={`
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          hidden md:flex md:flex-col fixed md:static inset-y-0 z-30
          ${isMobileMenuOpen ? 'flex' : 'hidden'}
        `}>
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-700">
            <h1 className="text-xl font-bold text-white">LPD Gestion</h1>
            <p className="text-xs text-primary-100 mt-1">Interface Responsable</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavLink to="/gestionnaire/dashboard" className={navItemClass} onClick={() => setIsMobileMenuOpen(false)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Tableau de bord
            </NavLink>

            <NavLink to="/gestionnaire/decaissements" className={navItemClass} onClick={() => setIsMobileMenuOpen(false)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Décaissements
            </NavLink>
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} LPD Gestions
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-md border-b-2 border-primary-600">
            <div className="flex items-center justify-between px-4 py-4 md:px-6">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex-1 md:ml-0 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary-600 to-accent-500 rounded-full"></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Interface Responsable
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestion des décaissements</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800">
                  <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-accent-700 dark:text-accent-300">Responsable</span>
                </div>
                
                <button className="p-2 rounded-md text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors">
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

export default GestionnaireLayout

