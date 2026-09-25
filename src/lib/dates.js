// Utilidades de fecha compartidas por toda la app.

export function toISODate(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function todayISO() {
  return toISODate(new Date())
}

// Días de diferencia entre hoy (00:00) y una fecha (00:00). Negativo = pasado.
export function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  const diffMs = due.getTime() - today.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

// Semáforo de urgencia. 'vencida' es su propio estado (no un matiz de rojo).
export function urgencyLevel(dateStr) {
  const d = daysUntil(dateStr)
  if (d < 0) return 'vencida'
  if (d <= 1) return 'rojo'
  if (d <= 3) return 'amarillo'
  return 'verde'
}

export const URGENCY_LABEL = {
  verde: 'Con tiempo',
  amarillo: 'Se acerca',
  rojo: 'Urgente',
  vencida: 'Vencida',
}

export function formatDate(dateStr, opts) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-PE', opts ?? { weekday: 'short', day: 'numeric', month: 'short' })
}

export function diasTexto(dateStr) {
  const d = daysUntil(dateStr)
  if (d < 0) return `${Math.abs(d)} día${Math.abs(d) === 1 ? '' : 's'} de retraso`
  if (d === 0) return 'Hoy'
  if (d === 1) return 'Mañana'
  return `En ${d} días`
}

export function mondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function weekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function minutesOf(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const DAY_KEYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']

export function slug(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}
