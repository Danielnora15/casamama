import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Venta, Gasto } from '../lib/types'
import { Search, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react'

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function getMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to = now.toISOString().split('T')[0]
  return { from, to }
}

interface DayGroup {
  fecha: string
  ventas: Venta[]
  gastos: Gasto[]
}

export default function Historial() {
  const [desde, setDesde] = useState(getMonthRange().from)
  const [hasta, setHasta] = useState(getMonthRange().to)
  const [search, setSearch] = useState('')
  const [groups, setGroups] = useState<DayGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'todo' | 'ventas' | 'gastos'>('todo')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: ventas }, { data: gastos }] = await Promise.all([
        supabase.from('ventas').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: false }),
        supabase.from('gastos').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: false }),
      ])

      const map = new Map<string, DayGroup>()
      const allFechas = new Set([...(ventas || []).map(v => v.fecha), ...(gastos || []).map(g => g.fecha)])
      allFechas.forEach(f => map.set(f, { fecha: f, ventas: [], gastos: [] }))
      ventas?.forEach(v => map.get(v.fecha)?.ventas.push(v))
      gastos?.forEach(g => map.get(g.fecha)?.gastos.push(g))

      const sorted = Array.from(map.values()).sort((a, b) => b.fecha.localeCompare(a.fecha))
      setGroups(sorted)
      // Expand first
      if (sorted.length > 0) setExpanded(new Set([sorted[0].fecha]))
      setLoading(false)
    }
    load()
  }, [desde, hasta])

  const toggle = (fecha: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(fecha) ? next.delete(fecha) : next.add(fecha)
      return next
    })
  }

  const filtered = groups.filter(g => {
    if (!search) return true
    const q = search.toLowerCase()
    return g.ventas.some(v => v.menu.toLowerCase().includes(q)) ||
      g.gastos.some(x => x.descripcion.toLowerCase().includes(q) || x.categoria.toLowerCase().includes(q))
  })

  const totals = filtered.reduce((acc, g) => {
    acc.ingresos += g.ventas.reduce((s, v) => s + v.precio * v.cantidad, 0)
    acc.gastos += g.gastos.reduce((s, x) => s + x.valor, 0)
    acc.almuerzos += g.ventas.reduce((s, v) => s + v.cantidad, 0)
    return acc
  }, { ingresos: 0, gastos: 0, almuerzos: 0 })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Historial</h1>
        <p className="text-gray-400 text-sm mt-0.5">Registro histórico de ventas y gastos</p>
      </div>

      {/* Filtros */}
      <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]" />
          </div>
          <div className="flex-1 min-w-48">
            <label className="text-xs text-gray-400 mb-1 block">Buscar</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                placeholder="Menú, descripción, categoría..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#241a16] border border-[#3a2e28] text-white rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600"
              />
            </div>
          </div>
          <div className="flex gap-1">
            {(['todo', 'ventas', 'gastos'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                  tab === t ? 'bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/25' : 'text-gray-400 hover:text-white bg-[#241a16]'
                }`}>
                {t === 'todo' ? 'Todo' : t === 'ventas' ? 'Ventas' : 'Gastos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen rango */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ingresos</p>
          <p className="text-lg font-bold text-green-400">{formatCOP(totals.ingresos)}</p>
        </div>
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Gastos</p>
          <p className="text-lg font-bold text-red-400">{formatCOP(totals.gastos)}</p>
        </div>
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Utilidad</p>
          <p className={`text-lg font-bold ${totals.ingresos - totals.gastos >= 0 ? 'text-[#c9a84c]' : 'text-red-400'}`}>
            {formatCOP(totals.ingresos - totals.gastos)}
          </p>
        </div>
      </div>

      {loading && <div className="text-center text-gray-500 py-8">Cargando...</div>}

      {/* Días */}
      <div className="space-y-3">
        {filtered.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            <p>No hay registros en este período</p>
          </div>
        )}
        {filtered.map(day => {
          const ingresos = day.ventas.reduce((s, v) => s + v.precio * v.cantidad, 0)
          const gastosDia = day.gastos.reduce((s, g) => s + g.valor, 0)
          const utilidad = ingresos - gastosDia
          const isOpen = expanded.has(day.fecha)

          return (
            <div key={day.fecha} className="bg-[#1c1512] border border-[#2e2018] rounded-2xl overflow-hidden">
              <button
                onClick={() => toggle(day.fecha)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-semibold text-sm">
                        {new Date(day.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      {day.ventas.length > 0 && day.gastos.length === 0 && (
                        <span title="Hay ventas pero no se registró ningún gasto este día">
                          <AlertTriangle size={13} className="text-yellow-400" />
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">{day.ventas.reduce((s, v) => s + v.cantidad, 0)} almuerzos · {day.ventas.length} platos · {day.gastos.length} gastos</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-green-400 text-sm font-medium"><TrendingUp size={13} />{formatCOP(ingresos)}</span>
                      <span className="flex items-center gap-1 text-red-400 text-sm font-medium"><TrendingDown size={13} />{formatCOP(gastosDia)}</span>
                      <span className={`text-sm font-bold ${utilidad >= 0 ? 'text-[#c9a84c]' : 'text-red-400'}`}>{formatCOP(utilidad)}</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[#2e2018] px-5 py-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {(tab === 'todo' || tab === 'ventas') && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Ventas</p>
                        {day.ventas.length === 0
                          ? <p className="text-gray-600 text-sm">Sin ventas</p>
                          : day.ventas.map(v => (
                            <div key={v.id} className="flex justify-between items-center py-1.5 border-b border-[#2e2018] last:border-0">
                              <div>
                                <p className="text-white text-sm">{v.menu}</p>
                                <p className="text-gray-500 text-xs">{v.cantidad} × {formatCOP(v.precio)}</p>
                              </div>
                              <p className="text-green-400 text-sm font-medium">{formatCOP(v.precio * v.cantidad)}</p>
                            </div>
                          ))}
                      </div>
                    )}
                    {(tab === 'todo' || tab === 'gastos') && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Gastos</p>
                        {day.gastos.length === 0
                          ? <p className="text-gray-600 text-sm">Sin gastos</p>
                          : day.gastos.map(g => (
                            <div key={g.id} className="flex justify-between items-center py-1.5 border-b border-[#2e2018] last:border-0">
                              <div>
                                <p className="text-white text-sm">{g.descripcion}</p>
                                <span className="text-xs bg-[#333] text-gray-400 px-2 py-0.5 rounded-full">{g.categoria}</span>
                              </div>
                              <p className="text-red-400 text-sm font-medium">{formatCOP(g.valor)}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
