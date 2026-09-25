import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import { tareaEstado } from '../lib/selectors'
import { urgencyLevel } from '../lib/dates'

export default function TodasPage({ onOpenTask }) {
  const { db } = useAppData()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [curso, setCurso] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [orden, setOrden] = useState('fecha')

  const cursos = Object.values(db.cursos)
  const etiquetas = Object.values(db.etiquetas)

  const filtradas = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = Object.values(db.tareas).filter((t) => {
      if (query && !t.titulo.toLowerCase().includes(query)) return false
      if (curso && t.cursoId !== curso) return false
      if (etiqueta && t.etiquetaId !== etiqueta) return false
      if (estado && tareaEstado(t, user.id) !== estado) return false
      if (desde && t.fechaEntrega < desde) return false
      if (hasta && t.fechaEntrega > hasta) return false
      return true
    })
    list.sort((a, b) => {
      if (orden === 'fecha') return a.fechaEntrega < b.fechaEntrega ? -1 : 1
      if (orden === 'curso') return (db.cursos[a.cursoId]?.nombre || '').localeCompare(db.cursos[b.cursoId]?.nombre || '')
      if (orden === 'creacion') return a.creadoEn - b.creadoEn
      if (orden === 'urgencia') {
        const rank = { vencida: 0, rojo: 1, amarillo: 2, verde: 3 }
        return rank[urgencyLevel(a.fechaEntrega)] - rank[urgencyLevel(b.fechaEntrega)]
      }
      return 0
    })
    return list
  }, [db.tareas, db.cursos, q, curso, etiqueta, estado, desde, hasta, orden, user.id])

  return (
    <div className="page">
      <header className="page-header">
        <h1>Todas las tareas</h1>
        <p className="ink-soft">{filtradas.length} de {Object.keys(db.tareas).length} tareas</p>
      </header>

      <div className="filters-bar">
        <input type="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="filter-input" />
        <select value={curso} onChange={(e) => setCurso(e.target.value)}>
          <option value="">Todos los cursos</option>
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)}>
          <option value="">Todas las etiquetas</option>
          {etiquetas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Cualquier estado</option>
          <option value="pendiente">Pendiente</option>
          <option value="completada">Completada</option>
          <option value="vencida">Vencida</option>
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} title="Desde" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} title="Hasta" />
        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="fecha">Ordenar por fecha</option>
          <option value="urgencia">Ordenar por urgencia</option>
          <option value="curso">Ordenar por curso</option>
          <option value="creacion">Ordenar por creación</option>
        </select>
      </div>

      {filtradas.length === 0 ? (
        <p className="empty">No hay tareas que coincidan con estos filtros.</p>
      ) : (
        <div className="task-list">
          {filtradas.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}
        </div>
      )}
    </div>
  )
}
