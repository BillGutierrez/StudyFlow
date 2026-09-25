import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import XPBar from '../components/XPBar'
import * as Icon from '../components/icons'
import { tareasDeHoy, tareasUrgentes, horarioDelDia, estadisticasUsuario } from '../lib/selectors'
import { DAY_KEYS } from '../lib/dates'

export default function DashboardPage({ onOpenTask, onNavigate, onNewTask }) {
  const { db } = useAppData()
  const { user, isSuperadmin } = useAuth()

  const hoy = new Date()
  const diaKey = DAY_KEYS[hoy.getDay() === 0 ? 6 : hoy.getDay() - 1]
  const saludo = hoy.getHours() < 12 ? 'Buenos días' : hoy.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'

  const tareasHoy = tareasDeHoy(db, user.id)
  const urgentes = tareasUrgentes(db, user.id).slice(0, 4)
  const clasesHoy = horarioDelDia(db, diaKey)
  const stats = estadisticasUsuario(db, user.id)

  const proximas = Object.values(db.tareas)
    .filter((t) => !t.completadoPor[user.id])
    .sort((a, b) => (a.fechaEntrega < b.fechaEntrega ? -1 : 1))
    .slice(0, 5)

  return (
    <div className="page dashboard">
      <div className="dash-hero">
        <div>
          <p className="dash-greeting">{saludo}, {user.nombre.split(' ')[0]} {user.avatar}</p>
          <h1>
            {tareasHoy.length === 0
              ? 'No tienes nada urgente para hoy 🎉'
              : `Tienes ${tareasHoy.length} tarea${tareasHoy.length === 1 ? '' : 's'} para hoy`}
          </h1>
          <p className="dash-date">{hoy.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button type="button" className="btn-primary dash-cta" onClick={onNewTask} style={{ display: isSuperadmin ? 'inline-flex' : 'none' }}>
          <Icon.Plus /> Nueva tarea
        </button>
      </div>

      <div className="dash-grid">
        <section className="card">
          <h2>Progreso de hoy</h2>
          <div className="dash-progress-row">
            <div className="ring" style={{ '--pct': stats.porcentaje }}>
              <span>{stats.porcentaje}%</span>
            </div>
            <div>
              <p><strong>{stats.completadas.length}</strong> completadas en total</p>
              <p className="ink-soft">{stats.pendientes.length} pendientes · {stats.vencidas.length} vencidas</p>
            </div>
          </div>
          <XPBar xp={user.xp} />
          <div className="dash-streak">
            <Icon.Flame /> Racha actual: <strong>{user.racha} día{user.racha === 1 ? '' : 's'}</strong>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Clases de hoy</h2>
            <button type="button" className="link-btn" onClick={() => onNavigate('horario')}>Ver horario</button>
          </div>
          {clasesHoy.length === 0 ? (
            <p className="empty">Hoy no tienes clases programadas.</p>
          ) : (
            <ul className="dash-class-list">
              {clasesHoy.map((h) => {
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
          )}
        </section>
      </div>

      {urgentes.length > 0 && (
        <section className="dash-section">
          <div className="card-head">
            <h2>Tareas urgentes</h2>
            <button type="button" className="link-btn" onClick={() => onNavigate('todas')}>Ver todas</button>
          </div>
          <div className="task-list">
            {urgentes.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}
          </div>
        </section>
      )}

      <section className="dash-section">
        <div className="card-head">
          <h2>Próximas entregas</h2>
          <button type="button" className="link-btn" onClick={() => onNavigate('semana')}>Ver semana</button>
        </div>
        {proximas.length === 0 ? (
          <p className="empty">No tienes tareas pendientes. ¡Vas al día! 🎉</p>
        ) : (
          <div className="task-list">
            {proximas.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}
          </div>
        )}
      </section>
    </div>
  )
}
