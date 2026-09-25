import { useMemo } from 'react'
import { useAppData } from '../context/AppDataContext'
import { toISODate } from '../lib/dates'

const DAY_W = 34

function diffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86_400_000)
}

export default function TimelinePage({ onOpenTask }) {
  const { db } = useAppData()
  const tareas = Object.values(db.tareas)

  const { start, totalDays, dias } = useMemo(() => {
    if (tareas.length === 0) {
      const hoy = toISODate(new Date())
      return { start: hoy, totalDays: 14, dias: [] }
    }
    const fechas = tareas.map((t) => t.fechaEntrega)
    const creaciones = tareas.map((t) => toISODate(new Date(t.creadoEn)))
    const hoy = toISODate(new Date())
    const minFecha = [...fechas, ...creaciones, hoy].sort()[0]
    const maxFecha = [...fechas, hoy].sort().slice(-1)[0]
    const s = new Date(minFecha)
    s.setDate(s.getDate() - 2)
    const e = new Date(maxFecha)
    e.setDate(e.getDate() + 2)
    const total = diffDays(s, e) + 1
    const arr = Array.from({ length: total }, (_, i) => {
      const d = new Date(s)
      d.setDate(d.getDate() + i)
      return d
    })
    return { start: toISODate(s), totalDays: total, dias: arr }
  }, [tareas])

  const hoyOffset = diffDays(start, toISODate(new Date()))
  const porCurso = useMemo(() => {
    const map = new Map()
    tareas.forEach((t) => {
      if (!map.has(t.cursoId)) map.set(t.cursoId, [])
      map.get(t.cursoId).push(t)
    })
    return map
  }, [tareas])

  if (tareas.length === 0) {
    return (
      <div className="page">
        <h1>Timeline</h1>
        <p className="empty">Aún no hay tareas para mostrar en la línea de tiempo.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Timeline del ciclo</h1>
        <p className="ink-soft">Cada barra va desde que se creó la tarea hasta su fecha de entrega.</p>
      </header>

      <div className="gantt-wrap">
        <div className="gantt" style={{ width: totalDays * DAY_W + 180 }}>
          <div className="gantt-header" style={{ marginLeft: 180 }}>
            {dias.map((d, i) => (
              <div key={i} className="gantt-day" style={{ width: DAY_W }}>
                <span>{d.getDate()}</span>
                {d.getDate() === 1 || i === 0 ? (
                  <span className="gantt-month">{d.toLocaleDateString('es-PE', { month: 'short' })}</span>
                ) : null}
              </div>
            ))}
          </div>

          {[...porCurso.entries()].map(([cursoId, ts]) => {
            const curso = db.cursos[cursoId]
            return (
              <div key={cursoId} className="gantt-group">
                <div className="gantt-group-label" style={{ color: curso?.color }}>{curso?.nombre}</div>
                {ts.map((t) => {
                  const inicio = diffDays(start, toISODate(new Date(t.creadoEn)))
                  const fin = diffDays(start, t.fechaEntrega)
                  const ancho = Math.max((fin - inicio) * DAY_W, DAY_W * 0.6)
                  return (
                    <div key={t.id} className="gantt-row">
                      <div className="gantt-row-label">{t.titulo}</div>
                      <div className="gantt-track" style={{ width: totalDays * DAY_W }}>
                        <button
                          type="button"
                          className="gantt-bar"
                          style={{ left: inicio * DAY_W, width: ancho, background: curso?.color }}
                          onClick={() => onOpenTask(t.id)}
                          title={t.titulo}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          <div className="gantt-today" style={{ left: 180 + hoyOffset * DAY_W }} />
        </div>
      </div>
    </div>
  )
}
