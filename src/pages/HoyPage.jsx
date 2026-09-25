import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import { horarioDelDia } from '../lib/selectors'
import { daysUntil, DAY_KEYS, todayISO } from '../lib/dates'

export default function HoyPage({ onOpenTask }) {
  const { db } = useAppData()
  const { user } = useAuth()
  const hoy = new Date()
  const diaKey = DAY_KEYS[hoy.getDay() === 0 ? 6 : hoy.getDay() - 1]
  const iso = todayISO()

  const clases = horarioDelDia(db, diaKey)
  const todas = Object.values(db.tareas)
  const vencidas = todas.filter((t) => !t.completadoPor[user.id] && daysUntil(t.fechaEntrega) < 0)
  const urgentes = todas.filter((t) => !t.completadoPor[user.id] && t.fechaEntrega === iso)
  const planificadasHoy = todas.filter((t) => t.planificacion?.fecha === iso && !t.completadoPor[user.id])
  const completadasHoy = todas.filter((t) => {
    const ts = t.completadoPor[user.id]
    return ts && new Date(ts).toDateString() === hoy.toDateString()
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1>Hoy</h1>
        <p className="ink-soft">{hoy.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      {clases.length > 0 && (
        <section className="dash-section">
          <h2>Tus clases</h2>
          <ul className="dash-class-list">
            {clases.map((h) => {
              const curso = db.cursos[h.cursoId]
              return (
                <li key={h.id}>
                  <span className="dash-class-time">{h.horaInicio}–{h.horaFin}</span>
                  <span className="chip" style={{ '--chip-color': curso?.color }}>{curso?.nombre}</span>
                  <span className="ink-soft">{h.aula}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {vencidas.length > 0 && (
        <section className="dash-section">
          <h2 className="text-vencida">Vencidas — resuélvelas primero</h2>
          <div className="task-list">{vencidas.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}</div>
        </section>
      )}

      <section className="dash-section">
        <h2>Vencen hoy</h2>
        {urgentes.length === 0 ? <p className="empty">Nada vence hoy. Respira tranquilo 🙂</p> : (
          <div className="task-list">{urgentes.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}</div>
        )}
      </section>

      {planificadasHoy.length > 0 && (
        <section className="dash-section">
          <h2>Planeaste trabajar hoy en</h2>
          <div className="task-list">{planificadasHoy.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}</div>
        </section>
      )}

      {completadasHoy.length > 0 && (
        <section className="dash-section">
          <h2>Completadas hoy 🎉</h2>
          <div className="task-list">{completadasHoy.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}</div>
        </section>
      )}
    </div>
  )
}
