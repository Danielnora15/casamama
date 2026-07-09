// Lista canónica de platos, generada a partir del historial real de ventas
// (ver diagnóstico de datos). Objetivo: que "chuleta de cerdo", "CHULETA CERDO"
// y "Chulete de cerdo" se registren y se muestren siempre igual.

export interface MenuCanon {
  nombre: string
  precio: number
}

export const MENU_CANONICO: MenuCanon[] = [
  { nombre: 'Bandeja de Frijol', precio: 20000 },
  { nombre: 'Chuleta de Pollo', precio: 20000 },
  { nombre: 'Chuleta de Cerdo', precio: 20000 },
  { nombre: 'Pollo Plancha', precio: 20000 },
  { nombre: 'Chuleta de Pescado', precio: 20000 },
  { nombre: 'Bandeja Paisa', precio: 26000 },
  { nombre: 'Res Plancha', precio: 22000 },
  { nombre: 'Fiambre', precio: 23000 },
  { nombre: 'Costilla al Horno', precio: 20000 },
  { nombre: 'Cerdo Plancha', precio: 20000 },
  { nombre: 'Arroz Paisa', precio: 18000 },
  { nombre: 'Cazuela de Mondongo', precio: 23000 },
  { nombre: 'Sudado de Albondiga', precio: 20000 },
  { nombre: 'Higado en Salsa', precio: 20000 },
  { nombre: 'Pollo al Horno', precio: 20000 },
  { nombre: 'Sudado de Pollo', precio: 20000 },
  { nombre: 'Ajiaco', precio: 22000 },
  { nombre: 'Bandeja de Lenteja', precio: 20000 },
  { nombre: 'Mojarra', precio: 24000 },
  { nombre: 'Cazuela de Lenteja', precio: 20000 },
  { nombre: 'Vegetariano', precio: 20000 },
]

// variante (mayúscula, sin tildes/espacios extra) -> nombre canónico
const ALIASES: Record<string, string> = {
  'CHULETA CERDO': 'Chuleta de Cerdo',
  'CHUELETA DE CERDO': 'Chuleta de Cerdo',
  'CHULETE DE CERDO': 'Chuleta de Cerdo',
  'BANDEJA DE FRIJOLES': 'Bandeja de Frijol',
  'FRIJOLES': 'Bandeja de Frijol',
  'FRIJOLES SOLO': 'Bandeja de Frijol',
  'BANDEJA DE LENTEJAS': 'Bandeja de Lenteja',
  'BANDEJA LENTEJA': 'Bandeja de Lenteja',
  'CALDO DE AJIACO': 'Ajiaco',
  'CALDO DE MONDONGO': 'Cazuela de Mondongo',
  'MONDONGOS': 'Cazuela de Mondongo',
  'CERDO': 'Cerdo Plancha',
  'RES': 'Res Plancha',
  'RES A LA PLANCHA': 'Res Plancha',
  'POLLO A LA PLANCHA': 'Pollo Plancha',
  'HIGADO': 'Higado en Salsa',
  'HIGADO EN SALSA CRIOLLA': 'Higado en Salsa',
  'HIGADO SOLO': 'Higado en Salsa',
  'PORCION DE HIGADO': 'Higado en Salsa',
  'SUDADO DE ALBONDIGAS': 'Sudado de Albondiga',
  'SUDADOD E POLLO': 'Sudado de Pollo',
}

function limpiar(s: string) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

const CANONICO_POR_CLAVE: Record<string, string> = {}
MENU_CANONICO.forEach(m => { CANONICO_POR_CLAVE[limpiar(m.nombre)] = m.nombre })

function tituloCase(s: string) {
  return s.toLowerCase().replace(/(^|\s)\p{L}/gu, c => c.toUpperCase())
}

/**
 * Normaliza el nombre de un plato para que variantes con typos/mayúsculas
 * distintas terminen guardándose y agrupándose igual.
 * Si no reconoce el plato, lo devuelve en Title Case (para no perder platos nuevos,
 * pero evitando al menos duplicados por mayúsculas/espacios).
 */
export function normalizarMenu(nombreInput: string): string {
  const clave = limpiar(nombreInput)
  if (CANONICO_POR_CLAVE[clave]) return CANONICO_POR_CLAVE[clave]
  if (ALIASES[clave]) return ALIASES[clave]
  return tituloCase(nombreInput.trim().replace(/\s+/g, ' '))
}
