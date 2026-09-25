import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import Avatar from '../components/Avatar'
import CursosPage from './CursosPage'
import EtiquetasPage from './EtiquetasPage'
import { estadisticasGlobales, quienFalta } from '../lib/selectors'
import { calcularNivel } from '../lib/gamification'

const TABS = [
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'cursos', label: 'Cursos' },
  { id: 'etiquetas', label: 'Etiquetas' },
  { id: 'moderacion', label: 'Moderación' },
  { id: 'estadisticas', label: 'Estadísticas' },
  { id: 'faltan', label: 'Quién falta' },
]

function tiempoDesde(ts) {
  const min = Math.round((Date.now() - ts) / 60000)
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} d`
}

export default function AdminPage({ onOpenTask }) {
  const { db, dispatch } = useAppData()
  const [tab, setTab] = useState('usuarios')

  const usuarios = Object.values(db.users).filter((u) => u.rol === 'usuario')
  const global = estadisticasGlobales(db)
  const reportes = Object.values(db.reportes).sort((a, b) => b.fecha - a.fecha)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Panel Superadmin</h1>
      </header>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Estudiante</th><th>Nivel</th><th>XP</th><th>Racha</th><th>Completadas</th><th>Última conexión</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const { nivel } = calcularNivel(u.xp)
                const completadas = Object.values(db.tareas).filter((t) => t.completadoPor[u.id]).length
                return (
                  <tr key={u.id}>
                    <td className="admin-user-cell"><Avatar user={u} size={26} /> {u.nombre}</td>
                    <td>{nivel}</td>
                    <td>{u.xp}</td>
                    <td>🔥 {u.racha}</td>
                    <td>{completadas}</td>
                    <td>{tiempoDesde(u.ultimaConexion)}</td>
                    <td>{u.activo ? 'Activo' : 'Desactivado'}</td>
                    <td>
                      <button type="button" className="link-btn" onClick={() => dispatch({ type: 'TOGGLE_USER_ACTIVE', userId: u.id })}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'cursos' && <CursosPage onOpenTask={onOpenTask} />}
      {tab === 'etiquetas' && <EtiquetasPage />}

      {tab === 'moderacion' && (
        <div className="admin-table-wrap">
          <h2>Reportes</h2>
          {reportes.length === 0 ? <p className="empty">No hay reportes pendientes.</p> : (
            <table className="admin-table">
              <thead><tr><th>Tipo</th><th>Reportado por</th><th>Motivo</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {reportes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.tipo === 'comentario' ? 'Muro de tarea' : 'Chat general'}</td>
                    <td>{db.users[r.userId]?.nombre}</td>
                    <td>{r.motivo}</td>
                    <td>{new Date(r.fecha).toLocaleString('es-PE')}</td>
                    <td>{r.resuelto ? 'Resuelto' : 'Pendiente'}</td>
                    <td>
                      {!r.resuelto && (
                        <button type="button" className="link-btn" onClick={() => dispatch({ type: 'RESOLVE_REPORT', id: r.id })}>
                          Marcar resuelto
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ marginTop: 24 }}>Usuarios silenciados</h2>
          {usuarios.filter((u) => u.silenciadoHasta && u.silenciadoHasta > Date.now()).length === 0 ? (
            <p className="empty">Nadie está silenciado ahora mismo.</p>
          ) : (
            <ul className="tag-manage-list">
              {usuarios.filter((u) => u.silenciadoHasta && u.silenciadoHasta > Date.now()).map((u) => (
                <li key={u.id}>
                  <Avatar user={u} size={22} /> {u.nombre}
                  <button type="button" className="link-btn" onClick={() => dispatch({ type: 'MUTE_USER', userId: u.id, minutos: 0 })}>
                    Quitar silencio
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'estadisticas' && (
        <div className="dash-grid">
          <section className="card">
            <h2>Resumen global</h2>
            <div className="stat-row"><span>Estudiantes</span><strong>{global.usuarios}</strong></div>
            <div className="stat-row"><span>Tareas creadas</span><strong>{global.tareas}</strong></div>
            <div className="stat-row"><span>Entregas completadas</span><strong>{global.totalCompletadas}/{global.totalPosibles}</strong></div>
            <div className="stat-row"><span>% de cumplimiento del grupo</span><strong>{global.porcentajeGlobal}%</strong></div>
          </section>
        </div>
      )}

      {tab === 'faltan' && (
        <div className="admin-table-wrap">
          {Object.values(db.tareas).length === 0 ? <p className="empty">No hay tareas.</p> : (
            <table className="admin-table">
              <thead><tr><th>Tarea</th><th>Completaron</th><th>Faltan</th></tr></thead>
              <tbody>
                {Object.values(db.tareas).map((t) => {
                  const { faltan, completaron } = quienFalta(db, t.id)
                  return (
                    <tr key={t.id}>
                      <td><button type="button" className="link-btn" onClick={() => onOpenTask(t.id)}>{t.titulo}</button></td>
                      <td>{completaron.length}</td>
                      <td>{faltan.length === 0 ? '— nadie, ya todos entregaron' : faltan.map((u) => u.nombre.split(' ')[0]).join(', ')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
