import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, History, BarChart3, CalendarDays, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Registro diario' },
  { to: '/historial', icon: History, label: 'Historial' },
  { to: '/semana', icon: CalendarDays, label: 'Semana' },
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
                ? 'bg-[#c0392b]/15 text-[#e74c3c] border border-[#c0392b]/30'
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
      <aside className="hidden md:flex flex-col w-60 bg-[#1c1512] border-r border-[#2e2018] p-4 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8 mt-1">
          <img
            src="/logo.png"
            alt="Casa Mamá"
            className="w-10 h-10 object-contain"
          />
          <div>
            <p className="font-bold text-white text-sm leading-tight">Casa Mamá</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Restaurante</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <NavLinks />
        </nav>

        <div className="border-t border-[#2e2018] pt-4 mt-4">
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1c1512] border-b border-[#2e2018] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Casa Mamá" className="w-8 h-8 object-contain" />
          <span className="font-bold text-white text-sm">Casa Mamá</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-400 hover:text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-[57px] left-0 right-0 bg-[#1c1512] border-b border-[#2e2018] p-4 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
            <NavLinks />
            <div className="border-t border-[#2e2018] mt-2 pt-2">
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
      <main className="flex-1 overflow-y-auto bg-[#120e0d] md:pt-0 pt-[57px]">
        <Outlet />
      </main>
    </div>
  )
}
