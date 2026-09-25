import * as Icon from './icons'

const ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: Icon.Home },
  { id: 'hoy', label: 'Hoy', icon: Icon.Sun },
  { id: '__add', label: 'Agregar', icon: Icon.Plus, raised: true },
  { id: 'semana', label: 'Semana', icon: Icon.Calendar },
  { id: 'todas', label: 'Todas', icon: Icon.List },
]

export default function BottomNav({ page, onNavigate, onNewTask }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) =>
        item.raised ? (
          <button key={item.id} type="button" className="bottom-nav-add" onClick={onNewTask} aria-label="Nueva tarea">
            <item.icon />
          </button>
        ) : (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-item${page === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon />
            <span>{item.label}</span>
          </button>
        ),
      )}
    </nav>
  )
}
