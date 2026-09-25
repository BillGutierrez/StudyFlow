import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { misionesSemana, isoDeSemana } from '../lib/selectors'

export default function MisionesPage() {
  const { db, dispatch } = useAppData()
  const { user } = useAuth()
  const semanaISO = isoDeSemana(new Date())
  const misiones = misionesSemana(db, user.id, semanaISO)

  function reclamar(m) {
    dispatch({ type: 'CLAIM_MISSION', userId: user.id, missionId: m.id, semanaISO, xp: m.xp })
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Misiones de la semana</h1>
        <p className="ink-soft">Se renuevan cada lunes. Complétalas para ganar XP extra.</p>
      </header>

      <div className="mission-grid">
        {misiones.map((m) => {
          const completa = m.progreso >= m.meta
          const key = `${user.id}:${m.id}:${semanaISO}`
          const reclamada = !!db.misionesReclamadas[key]
          const pct = Math.round((m.progreso / m.meta) * 100)
          return (
            <div key={m.id} className={`mission-card${completa ? ' complete' : ''}`}>
              <h2>{m.titulo}</h2>
              <p className="ink-soft">{m.descripcion}</p>
              <div className="xp-track"><div className="xp-fill" style={{ width: `${pct}%` }} /></div>
              <div className="mission-footer">
                <span>{m.progreso}/{m.meta}</span>
                <span className="mission-xp">+{m.xp} XP</span>
              </div>
              {completa && (
                <button type="button" className="btn-primary" disabled={reclamada} onClick={() => reclamar(m)}>
                  {reclamada ? 'Reclamada ✓' : 'Reclamar recompensa'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
