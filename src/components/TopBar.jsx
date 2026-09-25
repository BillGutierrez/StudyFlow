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

export default function TopBar({ page, onMenuClick, onNewTask }) {
  const { db, dispatch } = useAppData()
  const { user } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)

  const notifs = Object.values(db.notificaciones)
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.fecha - a.fecha)
  const sinLeer = notifs.filter((n) => !n.leida).length

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu" onClick={onMenuClick} aria-label="Abrir menú">
        <Icon.Menu />
      </button>
      <h1 className="topbar-title">{TITLES[page] || 'StudyFlow'}</h1>
      <div className="topbar-actions">
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
              {notifs.length === 0 ? (
                <p className="notif-empty">No tienes notificaciones.</p>
              ) : (
                <ul>
                  {notifs.slice(0, 15).map((n) => (
                    <li
                      key={n.id}
                      className={n.leida ? '' : 'unread'}
                      onClick={() => dispatch({ type: 'MARK_NOTIF_READ', id: n.id })}
                    >
                      {n.texto}
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
