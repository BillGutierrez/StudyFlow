import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import * as Icon from './icons'

const TITLES = {
  dashboard: 'Dashboard', hoy: 'Hoy', semana: 'Semana', mes: 'Mes', todas: 'Todas las tareas',
  cursos: 'Cursos', horario: 'Horario', etiquetas: 'Etiquetas', timeline: 'Timeline',
  chat: 'Chat general', misiones: 'Misiones', logros: 'Logros', rachas: 'Rachas',
  mascota: 'Mascota', estadisticas: 'Estadísticas', ajustes: 'Ajustes', perfil: 'Mi perfil',
  admin: 'Panel Superadmin', tarea: 'Detalle de tarea',
}

const TYPE_LABELS = {
  tarea: 'Tarea',
  comentario: 'Comentario',
  chat: 'Chat',
  moderacion: 'Moderación',
  logro: 'Logro',
  mision: 'Misión',
  info: 'Aviso',
}

export default function TopBar({ page, onMenuClick, onNewTask, onNavigate }) {
  const { db, dispatch } = useAppData()
  const { user } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifFilter, setNotifFilter] = useState('all')

  const notifs = Object.values(db.notificaciones || {})
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.fecha - a.fecha)
  const sinLeer = notifs.filter((n) => !n.leida).length
  const tareasHoy = Object.values(db.tareas || {}).filter((t) => !t.completadoPor[user.id] && t.fechaEntrega === new Date().toISOString().slice(0, 10)).length
  const pendientesReporte = Object.values(db.reportes || {}).filter((r) => r.estado !== 'resuelto' && r.estado !== 'rechazado').length

  const filteredNotifs = notifs.filter((n) => {
    if (notifFilter === 'all') return true
    if (notifFilter === 'unread') return !n.leida
    if (notifFilter === 'moderacion') return n.tipo === 'moderacion' || n.tipo === 'info'
    if (notifFilter === 'tareas') return n.tipo === 'tarea' || n.tipo === 'mision' || n.tipo === 'logro'
    return n.tipo === notifFilter
  })

  const quickActions = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'chat', label: 'Chat' },
    ...(user?.rol === 'superadmin' ? [{ id: 'admin', label: 'Admin' }] : []),
  ]

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu" onClick={onMenuClick} aria-label="Abrir menú">
        <Icon.Menu />
      </button>

      <div className="topbar-identity">
        <h1 className="topbar-title">{TITLES[page] || 'StudyFlow'}</h1>
        <div className="topbar-meta">
          <span className="chip subtle">Hoy: {tareasHoy}</span>
          {user?.rol === 'superadmin' && <span className="chip danger">Reportes: {pendientesReporte}</span>}
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-tiny-nav">
          {quickActions.map((item) => (
            <button key={item.id} type="button" className={page === item.id ? 'active' : ''} onClick={() => onNavigate?.(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        <button type="button" className="btn-primary topbar-add" onClick={onNewTask}>
          <Icon.Plus />
          <span>Nueva tarea</span>
        </button>

        <div className="topbar-notif">
          <button type="button" className="topbar-icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Notificaciones">
            <Icon.Bell />
            {sinLeer > 0 && <span className="topbar-dot" />}
          </button>
          {notifOpen && (
            <div className="notif-panel">
              <div className="notif-panel-head">
                <span>Notificaciones</span>
                {sinLeer > 0 && (
                  <button type="button" onClick={() => dispatch({ type: 'MARK_ALL_READ', userId: user.id })}>
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              <div className="notif-filters" aria-label="Filtro de notificaciones">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'unread', label: 'Nuevas' },
                  { id: 'moderacion', label: 'Moderación' },
                  { id: 'tareas', label: 'Tareas' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={notifFilter === filter.id ? 'active' : ''}
                    onClick={() => setNotifFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {filteredNotifs.length === 0 ? (
                <p className="notif-empty">No hay notificaciones en este filtro.</p>
              ) : (
                <ul>
                  {filteredNotifs.slice(0, 15).map((n) => (
                    <li
                      key={n.id}
                      className={n.leida ? '' : 'unread'}
                      onClick={() => {
                        dispatch({ type: 'MARK_NOTIF_READ', id: n.id })
                        if (n.link && onNavigate) onNavigate(n.link)
                      }}
                    >
                      <span className="notif-tag">{TYPE_LABELS[n.tipo] || 'Aviso'}</span>
                      <span>{n.texto}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
