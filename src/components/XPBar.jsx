import { calcularNivel } from '../lib/gamification'

export default function XPBar({ xp, showLabel = true }) {
  const { nivel, xpEnNivel, xpParaSiguiente } = calcularNivel(xp)
  const pct = Math.round((xpEnNivel / xpParaSiguiente) * 100)
  return (
    <div className="xp-wrap">
      {showLabel && (
        <div className="xp-label">
          <span>Nivel {nivel}</span>
          <span>{xpEnNivel}/{xpParaSiguiente} XP</span>
        </div>
      )}
      <div className="xp-track">
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
