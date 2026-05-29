export interface Venta {
  id: string
  fecha: string
  menu: string
  precio: number
  cantidad: number
  created_at: string
}

export interface Gasto {
  id: string
  fecha: string
  descripcion: string
  categoria: string
  valor: number
  created_at: string
}

export interface MenuRapido {
  nombre: string
  precio: number
}
