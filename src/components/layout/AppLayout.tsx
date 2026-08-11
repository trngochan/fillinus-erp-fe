import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut, User, TrendingUp, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  // GitHub-style drawer: hidden by default, opened on demand via the hamburger button.
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">FILLINUS ERP</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-lg">
              <User className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-slate-300 font-medium">{user?.fullName}</span>
              <span className="text-xs text-brand-400 bg-brand-500/20 px-1.5 py-0.5 rounded">{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar (overlay drawer) + content */}
      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <div
            className="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
