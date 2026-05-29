import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, History, BarChart3, LogOut, UtensilsCrossed, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Registro diario' },
  { to: '/historial', icon: History, label: 'Historial' },
  { to: '/resumen', icon: BarChart3, label: 'Resumen' },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavLinks = () => (
    <>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-[#1a1a1a] border-r border-[#2a2a2a] p-4 shrink-0">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-9 h-9 bg-[#c9a84c]/20 rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-[#c9a84c]" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Casa Mamá</p>
            <p className="text-gray-500 text-xs">Control de almuerzos</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <NavLinks />
        </nav>

        <div className="border-t border-[#2a2a2a] pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] text-sm font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{user?.email}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                <span className="text-xs text-gray-500">Conectado</span>
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-[#c9a84c]" />
          <span className="font-bold text-white text-sm">Casa Mamá</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-400 hover:text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-[57px] left-0 right-0 bg-[#1a1a1a] border-b border-[#2a2a2a] p-4 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
            <NavLinks />
            <div className="border-t border-[#2a2a2a] mt-2 pt-2">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#141414] md:pt-0 pt-[57px]">
        <Outlet />
      </main>
    </div>
  )
}
