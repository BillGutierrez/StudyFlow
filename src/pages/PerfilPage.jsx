import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { calcularNivel, CATALOGO_LOGROS, etapaMascota } from '../lib/gamification'
import { estadisticasUsuario } from '../lib/selectors'
import XPBar from '../components/XPBar'

const AVATARES = ['🙂', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🦉', '🐙', '🐢']

export default function PerfilPage() {
  const { db, dispatch } = useAppData()
  const { user } = useAuth()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nombre: user.nombre, carrera: user.carrera, ciclo: user.ciclo, avatar: user.avatar })

  const { nivel } = calcularNivel(user.xp)
  const etapa = etapaMascota(nivel)
  const stats = estadisticasUsuario(db, user.id)
  const logrosDesbloqueados = CATALOGO_LOGROS.filter((l) => user.logros.includes(l.id))

  function guardar(e) {
    e.preventDefault()
    dispatch({ type: 'UPDATE_PROFILE', userId: user.id, cambios: form })
    setEditando(false)
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mi perfil</h1>
      </header>

      <section className="card profile-card">
        <span className="profile-avatar">{user.avatar}</span>
        <div>
          <h2>{user.nombre}</h2>
          <p className="ink-soft">{user.carrera} {user.ciclo && `· ${user.ciclo} ciclo`}</p>
          <p className="ink-soft">Nivel {nivel} · {etapa.emoji} {etapa.nombre}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setEditando((v) => !v)}>
          {editando ? 'Cancelar' : 'Editar perfil'}
        </button>
      </section>

      {editando && (
        <section className="card">
          <form className="task-form" onSubmit={guardar}>
            <div className="form-grid">
              <label className="field-block field-wide">
                <span>Nombre</span>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </label>
              <label className="field-block">
                <span>Carrera</span>
                <input value={form.carrera} onChange={(e) => setForm({ ...form, carrera: e.target.value })} />
              </label>
              <label className="field-block">
                <span>Ciclo</span>
                <input value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} />
              </label>
            </div>
            <div className="field-block">
              <span>Avatar</span>
              <div className="avatar-picker">
                {AVATARES.map((a) => (
                  <button type="button" key={a} className={form.avatar === a ? 'active' : ''} onClick={() => setForm({ ...form, avatar: a })}>{a}</button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn-primary">Guardar cambios</button>
            </div>
          </form>
        </section>
      )}

      <div className="dash-grid">
        <section className="card">
          <h2>Progreso</h2>
          <XPBar xp={user.xp} />
          <div className="stat-row"><span>Tareas completadas</span><strong>{stats.completadas.length}</strong></div>
          <div className="stat-row"><span>Racha actual</span><strong>🔥 {user.racha}</strong></div>
        </section>
        <section className="card">
          <h2>Insignias ({logrosDesbloqueados.length})</h2>
          {logrosDesbloqueados.length === 0 ? <p className="empty">Aún no desbloqueas insignias.</p> : (
            <div className="badge-mini-list">
              {logrosDesbloqueados.map((l) => <span key={l.id} className="badge-mini" title={l.descripcion}>🏅 {l.nombre}</span>)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
