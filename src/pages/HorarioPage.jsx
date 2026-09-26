import { useAppData } from '../context/AppDataContext'
import { DAY_NAMES, DAY_KEYS } from '../lib/dates'

export default function HorarioPage() {
  const { db } = useAppData()

  return (
    <div className="page">
      <header className="page-header">
        <h1>Horario de clases</h1>
        <p className="ink-soft">Este horario es fijo para el ciclo actual y no se modifica.</p>
      </header>

      <div className="schedule-list">
        {DAY_KEYS.map((dia, i) => {
          const bloques = Object.values(db.horario)
            .filter((h) => h.dia === dia)
            .sort((a, b) => (a.horaInicio < b.horaInicio ? -1 : 1))

          return (
            <section key={dia} className="card schedule-day">
              <h2>{DAY_NAMES[i]}</h2>
              {bloques.length === 0 ? (
                <p className="empty">Sin clases.</p>
              ) : (
                <ul>
                  {bloques.map((h) => {
                    const curso = db.cursos[h.cursoId]
                    return (
                      <li key={h.id}>
                        <span className="chip" style={{ '--chip-color': curso?.color }}>{curso?.nombre}</span>
                        <span>{h.horaInicio}–{h.horaFin}</span>
                        <span className="ink-soft">{h.aula}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
