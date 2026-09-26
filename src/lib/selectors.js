import { daysUntil, minutesOf, toISODate, DAY_KEYS } from './dates.js'

export function tareasArray(db) {
  return Object.values(db.tareas)
}

export function tareaEstado(tarea, userId) {
  if (tarea.completadoPor[userId]) return 'completada'
  if (daysUntil(tarea.fechaEntrega) < 0) return 'vencida'
  return 'pendiente'
}

export function tareasDeHoy(db, userId) {
  const hoy = toISODate(new Date())
  return tareasArray(db).filter((t) => t.fechaEntrega === hoy || t.planificacion?.fecha === hoy)
    .filter((t) => !t.completadoPor[userId] || t.fechaEntrega === hoy)
}

export function tareasUrgentes(db, userId) {
  return tareasArray(db)
    .filter((t) => !t.completadoPor[userId])
    .filter((t) => daysUntil(t.fechaEntrega) <= 1)
    .sort((a, b) => (a.fechaEntrega < b.fechaEntrega ? -1 : 1))
}

export function horarioDelDia(db, diaKey) {
  return Object.values(db.horario)
    .filter((h) => h.dia === diaKey)
    .sort((a, b) => (a.horaInicio < b.horaInicio ? -1 : 1))
}

// Verifica si un bloque [inicio,fin) de un día choca con el horario fijo de clases.
export function chocaConHorario(db, diaKey, horaInicio, horaFin) {
  const ini = minutesOf(horaInicio)
  const fin = minutesOf(horaFin)
  return horarioDelDia(db, diaKey).find((h) => {
    const hIni = minutesOf(h.horaInicio)
    const hFin = minutesOf(h.horaFin)
    return ini < hFin && fin > hIni
  })
}

export function quienFalta(db, tareaId) {
  const tarea = db.tareas[tareaId]
  if (!tarea) return { faltan: [], completaron: [] }
  const usuarios = Object.values(db.users).filter((u) => u.rol === 'usuario' && u.activo)
  const faltan = usuarios.filter((u) => !tarea.completadoPor[u.id])
  const completaron = usuarios.filter((u) => tarea.completadoPor[u.id])
  return { faltan, completaron }
}

export function estadisticasUsuario(db, userId) {
  const propias = tareasArray(db)
  const completadas = propias.filter((t) => t.completadoPor[userId])
  const vencidas = propias.filter((t) => !t.completadoPor[userId] && daysUntil(t.fechaEntrega) < 0)
  const pendientes = propias.filter((t) => !t.completadoPor[userId] && daysUntil(t.fechaEntrega) >= 0)
  const total = propias.length
  const porcentaje = total ? Math.round((completadas.length / total) * 100) : 0

  const porCurso = {}
  completadas.forEach((t) => {
    porCurso[t.cursoId] = (porCurso[t.cursoId] || 0) + 1
  })
  const porEtiqueta = {}
  completadas.forEach((t) => {
    porEtiqueta[t.etiquetaId] = (porEtiqueta[t.etiquetaId] || 0) + 1
  })

  // Heatmap: cuántas tareas se completaron cada día (últimos 84 días ~ 12 semanas)
  const heatmap = {}
  completadas.forEach((t) => {
    const ts = t.completadoPor[userId]
    const dia = toISODate(new Date(ts))
    heatmap[dia] = (heatmap[dia] || 0) + 1
  })

  return { completadas, vencidas, pendientes, total, porcentaje, porCurso, porEtiqueta, heatmap }
}

export function estadisticasGlobales(db) {
  const usuarios = Object.values(db.users).filter((u) => u.rol === 'usuario')
  const tareas = tareasArray(db)
  const totalCompletadas = tareas.reduce((acc, t) => acc + Object.keys(t.completadoPor).length, 0)
  const totalPosibles = tareas.length * usuarios.length
  return {
    usuarios: usuarios.length,
    tareas: tareas.length,
    totalCompletadas,
    totalPosibles,
    porcentajeGlobal: totalPosibles ? Math.round((totalCompletadas / totalPosibles) * 100) : 0,
  }
}

// Misiones semanales fijas (definidas por app, no editables por ahora).
export function misionesSemana(db, userId, semanaISO) {
  const stats = estadisticasUsuario(db, userId)
  const completadasEstaSemana = stats.completadas.filter((t) => {
    const ts = t.completadoPor[userId]
    return isoDeSemana(new Date(ts)) === semanaISO
  })
  const anticipadas = completadasEstaSemana.filter((t) => daysUntil(t.fechaEntrega) >= 0)

  return [
    {
      id: 'completa-5',
      titulo: 'Completa 5 tareas',
      descripcion: 'Marca 5 tareas como hechas esta semana.',
      progreso: Math.min(completadasEstaSemana.length, 5),
      meta: 5,
      xp: 30,
    },
    {
      id: 'anticipa-3',
      titulo: '3 tareas antes de tiempo',
      descripcion: 'Completa 3 tareas antes de su fecha de entrega.',
      progreso: Math.min(anticipadas.length, 3),
      meta: 3,
      xp: 25,
    },
    {
      id: 'sin-atrasos',
      titulo: 'Semana sin vencidas',
      descripcion: 'Termina la semana sin ninguna tarea vencida.',
      progreso: stats.vencidas.length === 0 ? 1 : 0,
      meta: 1,
      xp: 20,
    },
  ]
}

export function isoDeSemana(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return toISODate(d)
}

export { DAY_KEYS }
