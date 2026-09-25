import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import { toISODate, urgencyLevel } from '../lib/dates'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = first.getDay() === 0 ? 6 : first.getDay() - 1 // lunes = 0
  const start = new Date(first)
  start.setDate(start.getDate() - startOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default function MesPage({ onOpenTask }) {
  const { db } = useAppData()
  const { user } = useAuth()
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => toISODate(new Date()))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month])
  const todayISOStr = toISODate(new Date())

  const porDia = useMemo(() => {
    const map = new Map()
    Object.values(db.tareas).forEach((t) => {
      if (!map.has(t.fechaEntrega)) map.set(t.fechaEntrega, [])
      map.get(t.fechaEntrega).push(t)
    })
    return map
  }, [db.tareas])

  const tareasDelDia = (porDia.get(selected) || []).sort((a, b) => (a.horaEntrega < b.horaEntrega ? -1 : 1))

  return (
    <div className="page">
      <header className="week-header">
        <h1>{MESES[month]} {year}</h1>
        <div className="week-nav">
          <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
          <button type="button" className="week-nav-today" onClick={() => { setCursor(new Date()); setSelected(todayISOStr) }}>Hoy</button>
          <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
        </div>
      </header>

      <div className="month-grid">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="month-dow">{d}</div>
        ))}
        {grid.map((d) => {
          const iso = toISODate(d)
          const inMonth = d.getMonth() === month
          const tareasDia = porDia.get(iso) || []
          const pendientesDia = tareasDia.filter((t) => !t.completadoPor[user.id])
          const peorNivel = pendientesDia.reduce((peor, t) => {
            const orden = { vencida: 0, rojo: 1, amarillo: 2, verde: 3 }
            const n = urgencyLevel(t.fechaEntrega)
            return orden[n] < orden[peor] ? n : peor
          }, 'verde')
          return (
            <button
              type="button"
              key={iso}
              className={`month-cell${inMonth ? '' : ' outside'}${iso === todayISOStr ? ' is-today' : ''}${iso === selected ? ' selected' : ''}`}
              onClick={() => setSelected(iso)}
            >
              <span className="month-cell-num">{d.getDate()}</span>
              {tareasDia.length > 0 && (
                <span className={`month-cell-dot urgency-${pendientesDia.length ? peorNivel : 'completada'}`}>
                  {tareasDia.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <section className="dash-section">
        <h2>
          {new Date(selected + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        {tareasDelDia.length === 0 ? (
          <p className="empty">No hay tareas ese día.</p>
        ) : (
          <div className="task-list">{tareasDelDia.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}</div>
        )}
      </section>
    </div>
  )
}
