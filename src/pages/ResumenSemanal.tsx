import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Award, Utensils, ChevronLeft, ChevronRight, Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react'

function formatCOP(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}
function formatCOPFull(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function getWeekBounds(offsetWeeks = 0) {
  const now = new Date()
  const day = now.getDay() // 0=dom, 1=lun...
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + offsetWeeks * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    desde: monday.toISOString().split('T')[0],
    hasta: sunday.toISOString().split('T')[0],
    monday,
    sunday,
  }
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface DayStat {
  label: string
  fecha: string
  ingresos: number
  gastos: number
  utilidad: number
  almuerzos: number
}

interface TopMenu {
  menu: string
  cantidad: number
  ingresos: number
}

export default function ResumenSemanal() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [days, setDays] = useState<DayStat[]>([])
  const [topMenus, setTopMenus] = useState<TopMenu[]>([])
  const [totals, setTotals] = useState({ ingresos: 0, gastos: 0, utilidad: 0, almuerzos: 0, diasTrabajados: 0 })
  const [prevTotals, setPrevTotals] = useState({ ingresos: 0, utilidad: 0 })
  const [loading, setLoading] = useState(false)

  const { desde, hasta, monday, sunday } = getWeekBounds(weekOffset)
  const { desde: prevDesde, hasta: prevHasta } = getWeekBounds(weekOffset - 1)

  const isCurrentWeek = weekOffset === 0

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const [{ data: ventas }, { data: gastos }, { data: prevVentas }, { data: prevGastos }] = await Promise.all([
        supabase.from('ventas').select('*').gte('fecha', desde).lte('fecha', hasta),
        supabase.from('gastos').select('*').gte('fecha', desde).lte('fecha', hasta),
        supabase.from('ventas').select('*').gte('fecha', prevDesde).lte('fecha', prevHasta),
        supabase.from('gastos').select('*').gte('fecha', prevDesde).lte('fecha', prevHasta),
      ])

      const V = ventas || []
      const G = gastos || []

      // Construir los 7 días de la semana
      const dayStats: DayStat[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const fecha = d.toISOString().split('T')[0]
        const ventasDia = V.filter(v => v.fecha === fecha)
        const gastosDia = G.filter(g => g.fecha === fecha)
        const ingresos = ventasDia.reduce((s, v) => s + v.precio * v.cantidad, 0)
        const gastosTotal = gastosDia.reduce((s, g) => s + g.valor, 0)
        return {
          label: DIAS[i],
          fecha,
          ingresos,
          gastos: gastosTotal,
          utilidad: ingresos - gastosTotal,
          almuerzos: ventasDia.reduce((s, v) => s + v.cantidad, 0),
        }
      })
      setDays(dayStats)

      // Totales
      const totalIngresos = V.reduce((s, v) => s + v.precio * v.cantidad, 0)
      const totalGastos = G.reduce((s, g) => s + g.valor, 0)
      const diasTrabajados = new Set(V.map(v => v.fecha)).size
      setTotals({
        ingresos: totalIngresos,
        gastos: totalGastos,
        utilidad: totalIngresos - totalGastos,
        almuerzos: V.reduce((s, v) => s + v.cantidad, 0),
        diasTrabajados,
      })

      // Semana anterior para comparativa
      const pV = prevVentas || []
      const pG = prevGastos || []
      const prevIng = pV.reduce((s, v) => s + v.precio * v.cantidad, 0)
      const prevGast = pG.reduce((s, g) => s + g.valor, 0)
      setPrevTotals({ ingresos: prevIng, utilidad: prevIng - prevGast })

      // Top menús
      const menuMap = new Map<string, { cantidad: number; ingresos: number }>()
      V.forEach(v => {
        const key = v.menu.toLowerCase().trim()
        const prev = menuMap.get(key) || { cantidad: 0, ingresos: 0 }
        menuMap.set(key, { cantidad: prev.cantidad + v.cantidad, ingresos: prev.ingresos + v.precio * v.cantidad })
      })
      setTopMenus(
        Array.from(menuMap.entries())
          .map(([menu, d]) => ({ menu, ...d }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5)
      )

      setLoading(false)
    }
    load()
  }, [desde, hasta, prevDesde, prevHasta, monday])

  const mejorDia = days.reduce((best, d) => d.ingresos > best.ingresos ? d : best, days[0] || { label: '', ingresos: 0 })

  const diffIngresos = prevTotals.ingresos > 0
    ? Math.round(((totals.ingresos - prevTotals.ingresos) / prevTotals.ingresos) * 100)
    : null

  const DiffBadge = ({ pct }: { pct: number | null }) => {
    if (pct === null) return null
    if (pct > 0) return (
      <span className="flex items-center gap-0.5 text-green-400 text-xs font-medium bg-green-400/10 px-2 py-0.5 rounded-full">
        <ArrowUp size={11} />{pct}% vs semana ant.
      </span>
    )
    if (pct < 0) return (
      <span className="flex items-center gap-0.5 text-red-400 text-xs font-medium bg-red-400/10 px-2 py-0.5 rounded-full">
        <ArrowDown size={11} />{Math.abs(pct)}% vs semana ant.
      </span>
    )
    return (
      <span className="flex items-center gap-0.5 text-gray-400 text-xs font-medium bg-white/5 px-2 py-0.5 rounded-full">
        <Minus size={11} /> igual que semana ant.
      </span>
    )
  }

  const formatWeekLabel = () => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    const from = monday.toLocaleDateString('es-CO', opts)
    const to = sunday.toLocaleDateString('es-CO', opts)
    if (isCurrentWeek) return `Esta semana (${from} – ${to})`
    if (weekOffset === -1) return `Semana pasada (${from} – ${to})`
    return `${from} – ${to}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1e1e1e] border border-[#333] rounded-xl p-3 text-xs">
        <p className="text-gray-300 mb-2 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCOPFull(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumen semanal</h1>
          <p className="text-gray-400 text-sm mt-0.5">{formatWeekLabel()}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-9 h-9 flex items-center justify-center bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-white hover:border-[#3a3a3a] transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            disabled={isCurrentWeek}
            className="px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all"
          >
            Hoy
          </button>
          <button
            onClick={() => setWeekOffset(w => Math.min(w + 1, 0))}
            disabled={isCurrentWeek}
            className="w-9 h-9 flex items-center justify-center bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-white disabled:opacity-30 hover:border-[#3a3a3a] transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading && <div className="text-center text-gray-500 py-8">Cargando...</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Ingresos</p>
            <div className="w-7 h-7 rounded-lg bg-green-400/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-green-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCOPFull(totals.ingresos)}</p>
          <div className="mt-1.5"><DiffBadge pct={diffIngresos} /></div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Gastos</p>
            <div className="w-7 h-7 rounded-lg bg-red-400/10 flex items-center justify-center">
              <TrendingDown size={14} className="text-red-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-400">{formatCOPFull(totals.gastos)}</p>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Utilidad</p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${totals.utilidad >= 0 ? 'bg-[#c9a84c]/10' : 'bg-red-400/10'}`}>
              <Award size={14} className={totals.utilidad >= 0 ? 'text-[#c9a84c]' : 'text-red-400'} />
            </div>
          </div>
          <p className={`text-xl font-bold ${totals.utilidad >= 0 ? 'text-[#c9a84c]' : 'text-red-400'}`}>{formatCOPFull(totals.utilidad)}</p>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Almuerzos</p>
            <div className="w-7 h-7 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <Utensils size={14} className="text-blue-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-blue-400">{totals.almuerzos}</p>
          <p className="text-xs text-gray-500 mt-1">{totals.diasTrabajados} días trabajados</p>
        </div>
      </div>

      {/* Gráfica días de la semana */}
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Ingresos y gastos por día</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={days} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCOP} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ingresos" name="Ingresos" fill="#4ade80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Detalle por día */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Detalle por día</h2>
            {mejorDia.ingresos > 0 && (
              <span className="flex items-center gap-1 text-[#c9a84c] text-xs bg-[#c9a84c]/10 px-2 py-1 rounded-full">
                <Trophy size={11} /> Mejor: {mejorDia.label}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {days.map(d => {
              const isEmpty = d.ingresos === 0 && d.gastos === 0
              return (
                <div key={d.fecha} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${isEmpty ? 'opacity-30' : 'bg-[#252525]'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white w-8">{d.label}</span>
                    <span className="text-xs text-gray-500">{d.almuerzos > 0 ? `${d.almuerzos} alm.` : 'Sin datos'}</span>
                  </div>
                  {!isEmpty && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-400">{formatCOP(d.ingresos)}</span>
                      <span className="text-red-400">{formatCOP(d.gastos)}</span>
                      <span className={`font-semibold ${d.utilidad >= 0 ? 'text-[#c9a84c]' : 'text-red-400'}`}>{formatCOP(d.utilidad)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Top platos de la semana */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-5">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Top platos de la semana</h2>
          {topMenus.length === 0 ? (
            <p className="text-gray-600 text-sm">Sin ventas esta semana</p>
          ) : (
            <div className="space-y-3">
              {topMenus.map((m, i) => (
                <div key={m.menu} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-[#c9a84c]/20 text-[#c9a84c]' : 'bg-white/5 text-gray-500'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-white text-sm capitalize">{m.menu}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{m.cantidad} uds</span>
                        <span className="text-xs text-green-400 font-medium">{formatCOPFull(m.ingresos)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(m.cantidad / topMenus[0].cantidad) * 100}%`,
                          background: i === 0 ? '#c9a84c' : '#3a3a3a'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Promedio diario */}
          {totals.diasTrabajados > 0 && (
            <div className="mt-5 pt-4 border-t border-[#2a2a2a]">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Promedio diario</span>
                <span className="text-sm font-semibold text-white">{formatCOPFull(Math.round(totals.ingresos / totals.diasTrabajados))}</span>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-xs text-gray-400">Promedio almuerzos/día</span>
                <span className="text-sm font-semibold text-white">{Math.round(totals.almuerzos / totals.diasTrabajados)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
