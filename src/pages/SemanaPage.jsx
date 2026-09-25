import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { mondayOf, weekDays, toISODate, minutesOf, DAY_KEYS } from '../lib/dates'
import { urgencyLevel } from '../lib/dates'
import { chocaConHorario } from '../lib/selectors'

const START_H = 7
const END_H = 21
const HOUR_H = 56

function fmtHour(h) {
  const suf = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${suf}`
}

export default function SemanaPage({ onOpenTask }) {
  const { db, dispatch } = useAppData()
  const { isSuperadmin } = useAuth()
  const [weekOffset, setWeekOffset] = useState(0)
  const [dragId, setDragId] = useState(null)
  const [conflictMsg, setConflictMsg] = useState('')

  const monday = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    return mondayOf(base)
  }, [weekOffset])
  const days = useMemo(() => weekDays(monday), [monday])
  const todayISOStr = toISODate(new Date())

  const hours = []
  for (let h = START_H; h <= END_H + 1; h++) hours.push(h)
  const gridStartMin = START_H * 60
  const gridHeight = (END_H + 1 - START_H) * HOUR_H

  const tareas = Object.values(db.tareas)

  function blocksForDay(iso, dayIndex) {
    const diaKey = DAY_KEYS[dayIndex]
    const clases = Object.values(db.horario).filter((h) => h.dia === diaKey)
    const entregas = tareas.filter((t) => t.fechaEntrega === iso)
    const planes = tareas.filter((t) => t.planificacion?.fecha === iso)
    return { clases, entregas, planes }
  }

  function handleDrop(e, iso, dayIndex) {
    e.preventDefault()
    if (!dragId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    let minutos = gridStartMin + Math.round(y / HOUR_H * 60 / 15) * 15
    const task = db.tareas[dragId]
    if (!task) return
    const dur = task.planificacion ? minutesOf(task.planificacion.horaFin) - minutesOf(task.planificacion.horaInicio) : 60
    const hIni = String(Math.floor(minutos / 60)).padStart(2, '0')
    const mIni = String(minutos % 60).padStart(2, '0')
    const finMin = minutos + dur
    const hFin = String(Math.floor(finMin / 60)).padStart(2, '0')
    const mFin = String(finMin % 60).padStart(2, '0')
    const horaInicio = `${hIni}:${mIni}`
    const horaFin = `${hFin}:${mFin}`

    const diaKey = DAY_KEYS[dayIndex]
    const choque = chocaConHorario(db, diaKey, horaInicio, horaFin)
    if (choque) {
      const curso = db.cursos[choque.cursoId]
      setConflictMsg(`No se puede: choca con ${curso?.nombre} (${choque.horaInicio}–${choque.horaFin}).`)
      setDragId(null)
      setTimeout(() => setConflictMsg(''), 3500)
      return
    }

    dispatch({
      type: 'UPDATE_TASK',
      id: dragId,
      userId: 'bill',
      cambios: { planificacion: { fecha: iso, horaInicio, horaFin } },
    })
    setDragId(null)
  }

  return (
    <div className="page">
      <header className="week-header">
        <div>
          <h1>Semana</h1>
          <p className="ink-soft">
            {days[0].toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} – {days[6].toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="week-nav">
          <button type="button" onClick={() => setWeekOffset((w) => w - 1)}>‹</button>
          <button type="button" className="week-nav-today" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button type="button" onClick={() => setWeekOffset((w) => w + 1)}>›</button>
        </div>
      </header>

      <div className="week-legend">
        <span><i className="dot dot-class" /> Clase (fija)</span>
        <span><i className="dot dot-entrega" /> Entrega (color = urgencia)</span>
        <span><i className="dot dot-plan" /> Bloque de trabajo{isSuperadmin ? ' — arrástralo para moverlo' : ''}</span>
      </div>
      {conflictMsg && <p className="conflict-note">⚠️ {conflictMsg}</p>}

      <div className="week-grid-wrap">
        <div className="week-grid" style={{ '--hour-h': `${HOUR_H}px` }}>
          <div className="week-col-times">
            <div className="week-col-head" />
            {hours.slice(0, -1).map((h) => (
              <div key={h} className="hour-label" style={{ height: HOUR_H }}>{fmtHour(h)}</div>
            ))}
          </div>

          {days.map((d, i) => {
            const iso = toISODate(d)
            const isToday = iso === todayISOStr
            const { clases, entregas, planes } = blocksForDay(iso, i)
            return (
              <div key={iso} className={`week-col${isToday ? ' is-today' : ''}`}>
                <div className="week-col-head">
                  <span className="week-col-day">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}</span>
                  <span className="week-col-date">{d.getDate()}</span>
                </div>
                <div
                  className="week-col-body"
                  style={{ height: gridHeight, backgroundSize: `100% ${HOUR_H}px` }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, iso, i)}
                >
                  {clases.map((h) => {
                    const curso = db.cursos[h.cursoId]
                    const top = ((minutesOf(h.horaInicio) - gridStartMin) / 60) * HOUR_H
                    const height = ((minutesOf(h.horaFin) - minutesOf(h.horaInicio)) / 60) * HOUR_H
                    return (
                      <div
                        key={h.id}
                        className="week-block week-block-class"
                        style={{ top, height, background: curso?.color, borderColor: curso?.color }}
                        title={`${curso?.nombre} · ${h.aula}`}
                      >
                        <span className="week-block-title">{curso?.nombre}</span>
                        <span className="week-block-sub">{h.aula}</span>
                      </div>
                    )
                  })}

                  {entregas.map((t) => {
                    const top = ((minutesOf(t.horaEntrega) - gridStartMin) / 60) * HOUR_H
                    const nivel = t.completadoPor && Object.keys(t.completadoPor).length ? 'verde' : urgencyLevel(t.fechaEntrega)
                    return (
                      <button
                        type="button"
                        key={`e-${t.id}`}
                        className={`week-block week-block-entrega urgency-${nivel}`}
                        style={{ top, height: 30 }}
                        onClick={() => onOpenTask(t.id)}
                        title={`Entrega: ${t.titulo}`}
                      >
                        <span className="week-block-title">🏁 {t.titulo}</span>
                      </button>
                    )
                  })}

                  {planes.map((t) => {
                    const top = ((minutesOf(t.planificacion.horaInicio) - gridStartMin) / 60) * HOUR_H
                    const height = ((minutesOf(t.planificacion.horaFin) - minutesOf(t.planificacion.horaInicio)) / 60) * HOUR_H
                    const nivel = urgencyLevel(t.fechaEntrega)
                    return (
                      <button
                        type="button"
                        key={`p-${t.id}`}
                        className={`week-block week-block-plan urgency-${nivel}`}
                        style={{ top, height: Math.max(height, 26) }}
                        draggable={isSuperadmin}
                        onDragStart={() => setDragId(t.id)}
                        onClick={() => onOpenTask(t.id)}
                        title={`Trabajar: ${t.titulo}`}
                      >
                        <span className="week-block-title">📝 {t.titulo}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
