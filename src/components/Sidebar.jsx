import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import * as Icon from './icons'

const GROUPS = [
  { id: 'inicio', label: 'Inicio', items: [{ id: 'dashboard', label: 'Dashboard', icon: Icon.Home }] },
  {
    id: 'organizacion',
    label: 'Organización',
    items: [
      { id: 'hoy', label: 'Hoy', icon: Icon.Sun },
      { id: 'semana', label: 'Semana', icon: Icon.Calendar },
      { id: 'mes', label: 'Mes', icon: Icon.Grid },
      { id: 'todas', label: 'Todas las tareas', icon: Icon.List },
    ],
  },
  {
    id: 'academico',
    label: 'Académico',
    items: [
      { id: 'cursos', label: 'Cursos', icon: Icon.Book },
      { id: 'horario', label: 'Horario', icon: Icon.Clock },
      { id: 'etiquetas', label: 'Etiquetas', icon: Icon.Tag },
      { id: 'timeline', label: 'Timeline', icon: Icon.Timeline },
    ],
  },
  {
    id: 'comunidad',
    label: 'Comunidad',
    items: [{ id: 'chat', label: 'Chat general', icon: Icon.Chat }],
  },
  {
    id: 'progreso',
    label: 'Progreso',
    items: [
      { id: 'misiones', label: 'Misiones', icon: Icon.Target },
      { id: 'logros', label: 'Logros', icon: Icon.Award },
      { id: 'rachas', label: 'Rachas', icon: Icon.Flame },
      { id: 'mascota', label: 'Mascota', icon: Icon.Pet },
      { id: 'estadisticas', label: 'Estadísticas', icon: Icon.Chart },
    ],
  },
  {
    id: 'config',
    label: 'Configuración',
    items: [{ id: 'ajustes', label: 'Ajustes', icon: Icon.Settings }],
  },
]

const ADMIN_GROUP = {
  id: 'admin',
  label: 'Administración',
  items: [{ id: 'admin', label: 'Panel Superadmin', icon: Icon.Shield }],
}

export default function Sidebar({ page, onNavigate, alertCount, mobileOpen, onCloseMobile, collapsed, onToggleCollapsed }) {
  const { user, isSuperadmin, logout } = useAuth()
  const [openGroups, setOpenGroups] = useState(() => new Set(GROUPS.map((g) => g.id).concat('admin')))

  const groups = isSuperadmin ? [...GROUPS, ADMIN_GROUP] : GROUPS

  function toggleGroup(id) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function select(id) {
    onNavigate(id)
    onCloseMobile()
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <nav className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">SF</span>
          {!collapsed && <span className="sidebar-brand-text">StudyFlow</span>}
          <button type="button" className="sidebar-close-mobile" onClick={onCloseMobile} aria-label="Cerrar menú">
            <Icon.Close />
          </button>
        </div>

        <div className="sidebar-scroll">
          {groups.map((group) => {
            const isOpen = collapsed || openGroups.has(group.id)
            return (
              <div key={group.id} className="sidebar-group">
                {!collapsed && (
                  <button type="button" className="sidebar-group-head" onClick={() => toggleGroup(group.id)} aria-expanded={isOpen}>
                    <span>{group.label}</span>
                    <Icon.Chevron className={isOpen ? 'open' : ''} />
                  </button>
                )}
                {isOpen && (
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`sidebar-item${page === item.id ? ' active' : ''}`}
                          onClick={() => select(item.id)}
                          title={collapsed ? item.label : undefined}
                        >
                          <item.icon />
                          {!collapsed && <span>{item.label}</span>}
                          {item.id === 'hoy' && alertCount > 0 && <span className="sidebar-badge">{alertCount}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-user" onClick={() => select('perfil')} title={collapsed ? user.nombre : undefined}>
            <Avatar user={user} size={32} />
            {!collapsed && (
              <span className="sidebar-user-text">
                <span className="sidebar-user-name">{user.nombre}</span>
                <span className="sidebar-user-role">{user.rol === 'superadmin' ? 'Superadmin' : 'Estudiante'}</span>
              </span>
            )}
          </button>
          {!collapsed && (
            <button type="button" className="sidebar-logout" onClick={logout} title="Cerrar sesión">
              <Icon.Logout />
            </button>
          )}
        </div>

        <button type="button" className="sidebar-collapse-btn" onClick={onToggleCollapsed}>
          <Icon.Collapse flipped={collapsed} />
          {!collapsed && <span>Contraer menú</span>}
        </button>
      </nav>
    </>
  )
}
