import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Venta, Gasto, MenuRapido } from '../lib/types'
import toast from 'react-hot-toast'
import { Plus, Trash2, Zap, ShoppingCart, Receipt, StickyNote, Settings, X, Check, TrendingUp, TrendingDown, DollarSign, Utensils } from 'lucide-react'

const MENUS_DEFAULT: MenuRapido[] = [
  { nombre: 'Chuleta de pescado', precio: 20000 },
  { nombre: 'Chuleta de cerdo', precio: 20000 },
  { nombre: 'Pollo plancha', precio: 20000 },
  { nombre: 'Arroz paisa', precio: 18000 },
  { nombre: 'Bandeja de frijoles', precio: 20000 },
]

const CATEGORIAS = ['Insumos', 'Personal', 'Servicios', 'Otros']

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function RegistroDiario() {
  const [fecha, setFecha] = useState(today())
  const [ventas, setVentas] = useState<Venta[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [nota, setNota] = useState('')
  const [notaGuardada, setNotaGuardada] = useState(false)
  const [loading, setLoading] = useState(false)

  // Formulario ventas
  const [menuNombre, setMenuNombre] = useState('')
  const [precio, setPrecio] = useState('20000')
  const [cantidad, setCantidad] = useState('1')

  // Formulario gastos
  const [gastDesc, setGastDesc] = useState('')
  const [gastCat, setGastCat] = useState('Insumos')
  const [gastValor, setGastValor] = useState('50000')

  // Menús rápidos configurables
  const [menusRapidos, setMenusRapidos] = useState<MenuRapido[]>(() => {
    try { return JSON.parse(localStorage.getItem('menus_rapidos') || 'null') || MENUS_DEFAULT } catch { return MENUS_DEFAULT }
  })
  const [showMenuEditor, setShowMenuEditor] = useState(false)
  const [nuevoMenu, setNuevoMenu] = useState({ nombre: '', precio: '20000' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: v }, { data: g }] = await Promise.all([
      supabase.from('ventas').select('*').eq('fecha', fecha).order('created_at', { ascending: false }),
      supabase.from('gastos').select('*').eq('fecha', fecha).order('created_at', { ascending: false }),
    ])
    setVentas(v || [])
    setGastos(g || [])
    const notaKey = `nota_${fecha}`
    setNota(localStorage.getItem(notaKey) || '')
    setLoading(false)
  }, [fecha])

  useEffect(() => { fetchData() }, [fetchData])

  const ingresos = ventas.reduce((s, v) => s + v.precio * v.cantidad, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0)
  const utilidad = ingresos - totalGastos
  const margen = ingresos > 0 ? Math.round((utilidad / ingresos) * 100) : 0
  const totalAlmuerzos = ventas.reduce((s, v) => s + v.cantidad, 0)

  const agregarVenta = async () => {
    if (!menuNombre.trim()) return toast.error('Escribe el nombre del menú')
    const p = parseInt(precio)
    const c = parseInt(cantidad)
    if (isNaN(p) || p <= 0) return toast.error('Precio inválido')
    if (isNaN(c) || c <= 0) return toast.error('Cantidad inválida')

    const { error } = await supabase.from('ventas').insert({ fecha, menu: menuNombre.trim(), precio: p, cantidad: c })
    if (error) return toast.error('Error al guardar')
    toast.success('Venta agregada')
    setMenuNombre('')
    setCantidad('1')
    fetchData()
  }

  const eliminarVenta = async (id: string) => {
    await supabase.from('ventas').delete().eq('id', id)
    setVentas(v => v.filter(x => x.id !== id))
    toast.success('Eliminado')
  }

  const agregarGasto = async () => {
    if (!gastDesc.trim()) return toast.error('Escribe la descripción')
    const v = parseInt(gastValor)
    if (isNaN(v) || v <= 0) return toast.error('Valor inválido')

    const { error } = await supabase.from('gastos').insert({ fecha, descripcion: gastDesc.trim(), categoria: gastCat, valor: v })
    if (error) return toast.error('Error al guardar')
    toast.success('Gasto agregado')
    setGastDesc('')
    setGastValor('50000')
    fetchData()
  }

  const eliminarGasto = async (id: string) => {
    await supabase.from('gastos').delete().eq('id', id)
    setGastos(g => g.filter(x => x.id !== id))
    toast.success('Eliminado')
  }

  const guardarNota = () => {
    localStorage.setItem(`nota_${fecha}`, nota)
    setNotaGuardada(true)
    setTimeout(() => setNotaGuardada(false), 2000)
  }

  const usarMenuRapido = (m: MenuRapido) => {
    setMenuNombre(m.nombre)
    setPrecio(m.precio.toString())
  }

  const guardarMenusRapidos = (nuevos: MenuRapido[]) => {
    setMenusRapidos(nuevos)
    localStorage.setItem('menus_rapidos', JSON.stringify(nuevos))
  }

  const agregarMenuRapido = () => {
    if (!nuevoMenu.nombre.trim()) return
    const nuevos = [...menusRapidos, { nombre: nuevoMenu.nombre.trim(), precio: parseInt(nuevoMenu.precio) || 20000 }]
    guardarMenusRapidos(nuevos)
    setNuevoMenu({ nombre: '', precio: '20000' })
  }

  const eliminarMenuRapido = (i: number) => {
    guardarMenusRapidos(menusRapidos.filter((_, idx) => idx !== i))
  }

  const stats = [
    { label: 'Almuerzos', value: totalAlmuerzos.toString(), icon: Utensils, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Ingresos', value: formatCOP(ingresos), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Gastos', value: formatCOP(totalGastos), icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Utilidad', value: formatCOP(utilidad), icon: DollarSign, color: utilidad >= 0 ? 'text-[#c9a84c]' : 'text-red-400', bg: utilidad >= 0 ? 'bg-[#c9a84c]/10' : 'bg-red-400/10' },
    { label: 'Margen', value: `${margen}%`, icon: null, color: margen >= 50 ? 'text-green-400' : margen >= 30 ? 'text-yellow-400' : 'text-red-400', bg: 'bg-white/5' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Registro del día</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="bg-[#1c1512] border border-[#2e2e2e] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
          />
          <button
            onClick={() => setFecha(today())}
            className="px-3 py-2 bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/25 rounded-xl text-sm font-medium hover:bg-[#c9a84c]/25 transition-all"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs uppercase tracking-wider">{s.label}</p>
              {s.icon && (
                <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon size={14} className={s.color} />
                </div>
              )}
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading && <div className="text-center text-gray-500 py-4">Cargando...</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {/* VENTAS */}
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-[#c9a84c]" />
              <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Almuerzos vendidos</h2>
            </div>
            <button
              onClick={() => setShowMenuEditor(!showMenuEditor)}
              className="text-gray-500 hover:text-[#c9a84c] transition-colors"
              title="Editar menús rápidos"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* Editor menús rápidos */}
          {showMenuEditor && (
            <div className="mb-4 p-3 bg-[#241a16] rounded-xl border border-[#3a2e28]">
              <p className="text-xs text-gray-400 mb-2 font-medium">Menús rápidos</p>
              <div className="flex flex-col gap-1.5 mb-2 max-h-36 overflow-y-auto">
                {menusRapidos.map((m, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#1c1512] px-3 py-1.5 rounded-lg">
                    <span className="text-white text-xs">{m.nombre} — {formatCOP(m.precio)}</span>
                    <button onClick={() => eliminarMenuRapido(i)} className="text-red-400 hover:text-red-300 ml-2">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Nombre del menú"
                  value={nuevoMenu.nombre}
                  onChange={e => setNuevoMenu(p => ({ ...p, nombre: e.target.value }))}
                  className="flex-1 bg-[#1a1a1a] border border-[#3a2e28] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#c9a84c]"
                />
                <input
                  placeholder="Precio"
                  value={nuevoMenu.precio}
                  onChange={e => setNuevoMenu(p => ({ ...p, precio: e.target.value }))}
                  className="w-24 bg-[#1a1a1a] border border-[#3a2e28] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#c9a84c]"
                />
                <button onClick={agregarMenuRapido} className="bg-[#c9a84c] text-black px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-[#a07830]">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Menús rápidos */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={12} className="text-[#c9a84c]" />
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Menús rápidos</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {menusRapidos.map((m, i) => (
                <button
                  key={i}
                  onClick={() => usarMenuRapido(m)}
                  className="px-3 py-1.5 bg-[#241a16] hover:bg-[#c9a84c]/15 border border-[#3a2e28] hover:border-[#c9a84c]/40 text-gray-300 hover:text-[#c9a84c] rounded-full text-xs transition-all duration-150"
                >
                  {m.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario venta */}
          <div className="space-y-2 mb-4">
            <input
              placeholder="Nombre del menú"
              value={menuNombre}
              onChange={e => setMenuNombre(e.target.value)}
              className="w-full bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600"
            />
            <div className="flex gap-2">
              <input
                placeholder="Precio"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                className="flex-1 bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
              />
              <input
                placeholder="Cantidad"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                type="number"
                min="1"
                className="w-24 bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
              />
              <button
                onClick={agregarVenta}
                className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
              >
                <Plus size={15} />
                Agregar
              </button>
            </div>
          </div>

          {/* Lista ventas */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {ventas.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">No hay ventas registradas</p>
            ) : ventas.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-[#241a16] rounded-xl px-3 py-2.5 group">
                <div>
                  <p className="text-white text-sm font-medium">{v.menu}</p>
                  <p className="text-gray-400 text-xs">{v.cantidad} × {formatCOP(v.precio)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-green-400 font-semibold text-sm">{formatCOP(v.precio * v.cantidad)}</p>
                  <button onClick={() => eliminarVenta(v.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GASTOS */}
        <div className="bg-[#1c1512] border border-[#2e2018] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={16} className="text-red-400" />
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Gastos del día</h2>
          </div>

          {/* Formulario gastos */}
          <div className="space-y-2 mb-4">
            <input
              placeholder="Descripción (ej: Compra de carnes)"
              value={gastDesc}
              onChange={e => setGastDesc(e.target.value)}
              className="w-full bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600"
            />
            <div className="flex gap-2">
              <select
                value={gastCat}
                onChange={e => setGastCat(e.target.value)}
                className="flex-1 bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
              >
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                placeholder="Valor"
                value={gastValor}
                onChange={e => setGastValor(e.target.value)}
                className="w-32 bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
              />
              <button
                onClick={agregarGasto}
                className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
              >
                <Plus size={15} />
                Agregar
              </button>
            </div>
          </div>

          {/* Lista gastos */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {gastos.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">No hay gastos registrados</p>
            ) : gastos.map(g => (
              <div key={g.id} className="flex items-center justify-between bg-[#241a16] rounded-xl px-3 py-2.5 group">
                <div>
                  <p className="text-white text-sm font-medium">{g.descripcion}</p>
                  <span className="text-xs bg-[#333] text-gray-400 px-2 py-0.5 rounded-full">{g.categoria}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-red-400 font-semibold text-sm">{formatCOP(g.valor)}</p>
                  <button onClick={() => eliminarGasto(g.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notas del día */}
      <div className="mt-4 bg-[#1c1512] border border-[#2e2018] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote size={16} className="text-yellow-400" />
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Notas del día</h2>
          </div>
          <button
            onClick={guardarNota}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              notaGuardada ? 'bg-green-500/20 text-green-400' : 'bg-[#241a16] text-gray-400 hover:text-white'
            }`}
          >
            {notaGuardada ? <><Check size={12} /> Guardado</> : 'Guardar nota'}
          </button>
        </div>
        <textarea
          value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Ej: Día lluvioso, menos clientes. Faltó arroz. Cambiar proveedor de pollo..."
          rows={3}
          className="w-full bg-[#241a16] border border-[#3a2e28] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 resize-none"
        />
      </div>
    </div>
  )
}
