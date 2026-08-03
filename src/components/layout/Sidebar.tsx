import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  LayoutDashboard, Sparkles, TrendingUp, Mic2, Shield, Disc3, Calculator, Settings2,
  ChevronDown, ChevronRight, Lock,
} from 'lucide-react'
import { APP_MENU } from '@/config/menu'

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  ai: Sparkles,
  sales: TrendingUp,
  agency: Mic2,
  ip: Shield,
  label: Disc3,
  pac: Calculator,
  sys: Settings2,
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentTab = searchParams.get('tab')

  // Expand the module containing the current screen by default; user can toggle the rest.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const mod of APP_MENU) {
      initial[mod.id] = mod.screens.some(s => s.built && s.path === location.pathname)
    }
    return initial
  })

  const toggle = (moduleId: string) => setExpanded(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))

  const isActive = (screen: { path?: string; tab?: string }) =>
    !!screen.path && location.pathname === screen.path && (!screen.tab || screen.tab === currentTab)

  const goTo = (screen: { path?: string; tab?: string }) => {
    if (!screen.path) return
    navigate(screen.tab ? `${screen.path}?tab=${screen.tab}` : screen.path)
  }

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 h-full overflow-y-auto">
      <nav className="py-3">
        {APP_MENU.map(mod => {
          const Icon = MODULE_ICONS[mod.id]
          const isOpen = !!expanded[mod.id]
          const builtCount = mod.screens.filter(s => s.built).length
          return (
            <div key={mod.id} className="px-2">
              <button
                onClick={() => toggle(mod.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="flex-1 text-left truncate">{mod.name}</span>
                {builtCount === 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">Soon</span>
                )}
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {isOpen && (
                <div className="mt-0.5 mb-1.5 space-y-0.5">
                  {mod.screens.map(screen => {
                    const active = isActive(screen)
                    if (!screen.built) {
                      return (
                        <div
                          key={screen.id}
                          title="Chưa triển khai"
                          className="flex items-center gap-2 pl-9 pr-3 py-2 text-sm text-slate-600 cursor-not-allowed"
                        >
                          <span className="flex-1 truncate">{screen.name}</span>
                          <Lock className="w-3 h-3 shrink-0" />
                        </div>
                      )
                    }
                    return (
                      <button
                        key={screen.id}
                        onClick={() => goTo(screen)}
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-2 rounded-lg text-sm text-left transition-colors
                          ${active ? 'bg-brand-600/20 text-brand-300 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                      >
                        <span className="truncate">{screen.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
