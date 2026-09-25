import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { estadisticasUsuario } from '../lib/selectors'
import { toISODate } from '../lib/dates'

function heatmapWeeks() {
  const hoy = new Date()
  const dias = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() - (83 - i))
    return d
  })
  const semanas = []
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7))
  return semanas
}

export default function EstadisticasPage() {
  const { db } = useAppData()
  const { user } = useAuth()
  const stats = estadisticasUsuario(db, user.id)
  const semanas = heatmapWeeks(stats.heatmap)

  const cursosOrdenados = Object.entries(stats.porCurso).sort((a, b) => b[1] - a[1])
  const maxCurso = Math.max(1, ...cursosOrdenados.map(([, n]) => n))

  return (
    <div className="page">
      <header className="page-header">
        <h1>Estadísticas</h1>
      </header>

      <div className="dash-grid">
        <section className="card">
          <h2>Resumen</h2>
          <div className="stat-row"><span>Completadas</span><strong>{stats.completadas.length}</strong></div>
          <div className="stat-row"><span>Pendientes</span><strong>{stats.pendientes.length}</strong></div>
          <div className="stat-row"><span>Vencidas</span><strong className="text-vencida">{stats.vencidas.length}</strong></div>
          <div className="stat-row"><span>% de cumplimiento</span><strong>{stats.porcentaje}%</strong></div>
        </section>
        <section className="card">
          <h2>Racha</h2>
          <div className="stat-row"><span>Actual</span><strong>🔥 {user.racha} días</strong></div>
          <div className="stat-row"><span>Mejor racha</span><strong>{user.mejorRacha} días</strong></div>
          <div className="stat-row"><span>XP total</span><strong>{user.xp}</strong></div>
        </section>
      </div>

      <section className="dash-section">
        <h2>Constancia (últimas 12 semanas)</h2>
        <div className="heatmap">
          {semanas.map((semana, i) => (
            <div key={i} className="heatmap-col">
              {semana.map((d) => {
                const iso = toISODate(d)
                const n = stats.heatmap[iso] || 0
                const nivel = n === 0 ? 0 : n === 1 ? 1 : n >= 3 ? 3 : 2
                return <div key={iso} className={`heatmap-cell lvl-${nivel}`} title={`${iso}: ${n} tarea${n === 1 ? '' : 's'}`} />
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="dash-section">
        <h2>Por curso</h2>
        {cursosOrdenados.length === 0 ? <p className="empty">Aún no completas tareas.</p> : (
          <div className="bar-chart">
            {cursosOrdenados.map(([cursoId, n]) => {
              const curso = db.cursos[cursoId]
              return (
                <div key={cursoId} className="bar-row">
                  <span className="bar-label">{curso?.nombre}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / maxCurso) * 100}%`, background: curso?.color }} /></div>
                  <span>{n}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
