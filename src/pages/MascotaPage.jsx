import { useAuth } from '../context/AuthContext'
import { calcularNivel, etapaMascota, ETAPAS_MASCOTA } from '../lib/gamification'
import XPBar from '../components/XPBar'

export default function MascotaPage() {
  const { user } = useAuth()
  const { nivel } = calcularNivel(user.xp)
  const etapa = etapaMascota(nivel)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Tu mascota</h1>
        <p className="ink-soft">Evoluciona con tu constancia. Es solo un extra — no la necesitas para usar la app.</p>
      </header>

      <section className="card mascot-card">
        <span className="mascot-emoji">{etapa.emoji}</span>
        <h2>{etapa.nombre}</h2>
        <p className="ink-soft">Nivel {nivel}</p>
        <XPBar xp={user.xp} />
      </section>

      <section className="dash-section">
        <h2>Etapas de evolución</h2>
        <div className="mascot-stages">
          {ETAPAS_MASCOTA.map((e) => (
            <div key={e.nombre} className={`mascot-stage${nivel >= e.nivelMin ? ' reached' : ''}`}>
              <span>{e.emoji}</span>
              <p>{e.nombre}</p>
              <p className="ink-soft">Nivel {e.nivelMin}+</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
