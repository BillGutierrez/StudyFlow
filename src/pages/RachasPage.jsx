import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { estadisticasUsuario } from '../lib/selectors'
import { toISODate } from '../lib/dates'

export default function RachasPage() {
  const { db } = useAppData()
  const { user } = useAuth()
  const stats = estadisticasUsuario(db, user.id)

  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return toISODate(d)
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1>Rachas</h1>
      </header>

      <div className="dash-grid">
        <section className="card streak-hero">
          <span className="streak-flame">🔥</span>
          <div>
            <p className="streak-number">{user.racha}</p>
            <p className="ink-soft">días seguidos activo</p>
          </div>
        </section>
        <section className="card">
          <h2>Mejor racha</h2>
          <p className="streak-number small">{user.mejorRacha} días</p>
          <p className="ink-soft">{user.racha >= user.mejorRacha && user.racha > 0 ? '¡Estás en tu mejor momento!' : 'Sigue así para superarla.'}</p>
        </section>
      </div>

      <section className="dash-section">
        <h2>Últimos 14 días</h2>
        <div className="streak-row">
          {dias.map((d) => (
            <div key={d} className={`streak-day${stats.heatmap[d] ? ' active' : ''}`} title={d}>
              {stats.heatmap[d] || ''}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
