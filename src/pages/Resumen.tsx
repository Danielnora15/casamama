import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Award, Target, Calendar, Utensils } from 'lucide-react'

function formatCOP(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

function formatCOPFull(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

const COLORS = ['#c9a84c', '#4ade80', '#60a5fa', '#f87171', '#a78bfa', '#fb923c']

export default function Resumen() {
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'todo'>('mes')
  const [chartData, setChartData] = useState<any[]>([])
  const [topMenus, setTopMenus] = useState<{ menu: string; total: number; ingresos: number }[]>([])
  const [topGastos, setTopGastos] = useState<{ categoria: string; total: number }[]>([])
  const [kpis, setKpis] = useState({ ingresos: 0, gastos: 0, utilidad: 0, margen: 0, almuerzos: 0, promDiario: 0 })
  const [proyeccion, setProyeccion] = useState({ estimado: 0, diasRestantes: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const now = new Date()
      let desde: string

      if (periodo === 'semana') {
        const d = new Date(now)
        d.setDate(d.getDate() - 6)
        desde = d.toISOString().split('T')[0]
      } else if (periodo === 'mes') {
        desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      } else {
        desde = '2020-01-01'
      }
      const hasta = now.toISOString().split('T')[0]

      const [{ data: ventas }, { data: gastos }] = await Promise.all([
        supabase.from('ventas').select('*').gte('fecha', desde).lte('fecha', hasta),
        supabase.from('gastos').select('*').gte('fecha', desde).lte('fecha', hasta),
      ])

      const V = ventas || []
      const G = gastos || []

      // KPIs
      const totalIngresos = V.reduce((s, v) => s + v.precio * v.cantidad, 0)
      const totalGastos = G.reduce((s, g) => s + g.valor, 0)
      const utilidad = totalIngresos - totalGastos
      const margen = totalIngresos > 0 ? Math.round((utilidad / totalIngresos) * 100) : 0
      const almuerzos = V.reduce((s, v) => s + v.cantidad, 0)

      const fechas = new Set([...V.map(v => v.fecha), ...G.map(g => g.fecha)])
      const diasConDatos = fechas.size || 1
      const promDiario = Math.round(totalIngresos / diasConDatos)

      setKpis({ ingresos: totalIngresos, gastos: totalGastos, utilidad, margen, almuerzos, promDiario })

      // Proyección mensual
      if (periodo === 'mes') {
        const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const diaActual = now.getDate()
        const diasRestantes = diasEnMes - diaActual
        const estimado = Math.round(totalIngresos + promDiario * diasRestantes)
        setProyeccion({ estimado, diasRestantes })
      }

      // Chart data por día
      const dayMap = new Map<string, { ingresos: number; gastos: number; utilidad: number }>()
      const addDay = (f: string) => { if (!dayMap.has(f)) dayMap.set(f, { ingresos: 0, gastos: 0, utilidad: 0 }) }
      V.forEach(v => { addDay(v.fecha); dayMap.get(v.fecha)!.ingresos += v.precio * v.cantidad })
      G.forEach(g => { addDay(g.fecha); dayMap.get(g.fecha)!.gastos += g.valor })
      dayMap.forEach(v => { v.utilidad = v.ingresos - v.gastos })

      const chartArr = Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([fecha, data]) => ({
          fecha: new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
          ...data,
        }))
      setChartData(chartArr)

      // Top menús
      const menuMap = new Map<string, { total: number; ingresos: number }>()
      V.forEach(v => {
        const key = v.menu.toLowerCase().trim()
        const prev = menuMap.get(key) || { total: 0, ingresos: 0 }
        menuMap.set(key, { total: prev.total + v.cantidad, ingresos: prev.ingresos + v.precio * v.cantidad })
      })
      setTopMenus(Array.from(menuMap.entries()).map(([menu, d]) => ({ menu, ...d })).sort((a, b) => b.total - a.total).slice(0, 6))

      // Gastos por categoría
      const catMap = new Map<string, number>()
      G.forEach(g => catMap.set(g.categoria, (catMap.get(g.categoria) || 0) + g.valor))
      setTopGastos(Array.from(catMap.entries()).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total))

      setLoading(false)
    }
    load()
  }, [periodo])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1c1512] border border-[#3a2e28] rounded-xl p-3 text-xs">
        <p className="text-gray-300 mb-2 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCOPFull(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumen</h1>
          <p className="text-gray-400 text-sm mt-0.5">Análisis de rendimiento del negocio</p>
        </div>
        <div className="flex gap-1 bg-[#1c1512] border border-[#2e2018] rounded-xl p-1">
          {(['semana', 'mes', 'todo'] as const).map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                periodo === p ? 'bg-[#c9a84c] text-black' : 'text-gray-400 hover:text-white'
              }`}>
              {p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center text-gray-500 py-8">Cargando...</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Ingresos', value: formatCOPFull(kpis.ingresos), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Gastos', value: formatCOPFull(kpis.gastos), icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'Utilidad neta', value: formatCOPFull(kpis.utilidad), icon: Award, color: kpis.utilidad >= 0 ? 'text-[#c9a84c]' : 'text-red-400', bg: kpis.utilidad >= 0 ? 'bg-[#c9a84c]/10' : 'bg-red-400/10' },
          { label: 'Margen', value: `${kpis.margen}%`, icon: Target, color: kpis.margen >= 50 ? 'text-green-400' : kpis.margen >= 30 ? 'text-yellow-400' : 'text-red-400', bg: 'bg-white/5' },
          { label: 'Almuerzos', value: kpis.almuerzos.toString(), icon: Utensils, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Promedio diario', value: formatCOPFull(kpis.promDiario), icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map(k => (
          <div key={k.label} className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{k.label}</p>
              <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon size={14} className={k.color} />
              </div>
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Proyección mensual */}
      {periodo === 'mes' && proyeccion.diasRestantes > 0 && (
        <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-[#c9a84c]" />
            <p className="text-[#c9a84c] font-semibold text-sm">Proyección del mes</p>
          </div>
          <p className="text-white text-sm">
            Si el ritmo actual continúa, el mes cerrará con{' '}
            <span className="font-bold text-[#c9a84c]">{formatCOPFull(proyeccion.estimado)}</span> en ingresos
            ({proyeccion.diasRestantes} días restantes a {formatCOPFull(kpis.promDiario)}/día promedio).
          </p>
        </div>
      )}

      {/* Gráfica ingresos vs gastos */}
      {chartData.length > 0 && (
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Ingresos vs Gastos</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="fecha" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCOP} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Utilidad por día */}
      {chartData.length > 1 && (
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Utilidad diaria</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="fecha" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCOP} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="#c9a84c" strokeWidth={2} dot={{ r: 3, fill: '#c9a84c' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top menús */}
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-5">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Top platos vendidos</h2>
          {topMenus.length === 0 ? (
            <p className="text-gray-600 text-sm">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {topMenus.map((m, i) => (
                <div key={m.menu} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 w-5">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-white text-sm capitalize">{m.menu}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{m.total} uds</span>
                        <span className="text-xs text-green-400 font-medium">{formatCOPFull(m.ingresos)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#241a16] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(m.total / topMenus[0].total) * 100}%`, background: COLORS[i] }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gastos por categoría */}
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-5">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Gastos por categoría</h2>
          {topGastos.length === 0 ? (
            <p className="text-gray-600 text-sm">Sin datos</p>
          ) : (
            <div className="flex gap-4 items-center">
              <PieChart width={140} height={140}>
                <Pie data={topGastos} dataKey="total" nameKey="categoria" cx={65} cy={65} outerRadius={60} innerRadius={35}>
                  {topGastos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="flex-1 space-y-2">
                {topGastos.map((g, i) => {
                  const totalGastos = topGastos.reduce((s, x) => s + x.total, 0)
                  const pct = Math.round((g.total / totalGastos) * 100)
                  return (
                    <div key={g.categoria} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-300 text-xs">{g.categoria}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{pct}%</span>
                        <span className="text-xs text-red-400 font-medium">{formatCOPFull(g.total)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
