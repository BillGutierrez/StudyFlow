import { useAuth } from '../context/AuthContext'
import { CATALOGO_LOGROS } from '../lib/gamification'

export default function LogrosPage() {
  const { user } = useAuth()

  return (
    <div className="page">
      <header className="page-header">
        <h1>Logros</h1>
        <p className="ink-soft">{user.logros.length}/{CATALOGO_LOGROS.length} desbloqueados</p>
      </header>

      <div className="badge-grid">
        {CATALOGO_LOGROS.map((l) => {
          const desbloqueado = user.logros.includes(l.id)
          const ocultar = l.secreto && !desbloqueado
          return (
            <div key={l.id} className={`badge-card${desbloqueado ? ' unlocked' : ''}`}>
              <span className="badge-icon">{desbloqueado ? '🏅' : '🔒'}</span>
              <h3>{ocultar ? 'Logro secreto' : l.nombre}</h3>
              <p className="ink-soft">{ocultar ? 'Descúbrelo jugando con la app.' : l.descripcion}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
