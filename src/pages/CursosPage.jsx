import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { COURSE_COLORS } from '../lib/colors'

function CourseForm({ open, onClose, course }) {
  const { dispatch } = useAppData()
  const [form, setForm] = useState(() => course || { nombre: '', codigo: '', profesor: '', descripcion: '', color: COURSE_COLORS[0] })

  function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    if (course) dispatch({ type: 'UPDATE_COURSE', id: course.id, cambios: form })
    else dispatch({ type: 'ADD_COURSE', payload: form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={course ? 'Editar curso' : 'Nuevo curso'}>
      <form className="task-form" onSubmit={guardar}>
        <div className="form-grid">
          <label className="field-block field-wide">
            <span>Nombre</span>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </label>
          <label className="field-block">
            <span>Código (opcional)</span>
            <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          </label>
          <label className="field-block">
            <span>Profesor (opcional)</span>
            <input value={form.profesor} onChange={(e) => setForm({ ...form, profesor: e.target.value })} />
          </label>
        </div>
        <label className="field-block">
          <span>Descripción</span>
          <textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </label>
        <div className="field-block">
          <span>Color</span>
          <div className="color-picker">
            {COURSE_COLORS.map((c) => (
              <button key={c} type="button" className={form.color === c ? 'active' : ''} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  )
}

export default function CursosPage({ onOpenTask }) {
  const { db, dispatch } = useAppData()
  const { isSuperadmin } = useAuth()
  const [selected, setSelected] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const cursos = Object.values(db.cursos)
  const tareasDelCurso = selected ? Object.values(db.tareas).filter((t) => t.cursoId === selected) : []

  return (
    <div className="page">
      <header className="page-header">
        <h1>Cursos</h1>
        {isSuperadmin && (
          <button type="button" className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>+ Nuevo curso</button>
        )}
      </header>

      <div className="course-grid">
        {cursos.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`course-tile${selected === c.id ? ' active' : ''}`}
            style={{ '--chip-color': c.color }}
            onClick={() => setSelected(c.id === selected ? null : c.id)}
          >
            <span className="course-tile-dot" />
            <span className="course-tile-name">{c.nombre}</span>
            {c.codigo && <span className="ink-soft">{c.codigo}</span>}
            {c.profesor && <span className="ink-soft">{c.profesor}</span>}
            {isSuperadmin && (
              <span className="course-tile-actions">
                <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setEditing(c); setFormOpen(true) }}>Editar</span>
                <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setDeleting(c.id) }}>Eliminar</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <section className="dash-section">
          <h2>Tareas de {db.cursos[selected]?.nombre}</h2>
          {tareasDelCurso.length === 0 ? (
            <p className="empty">Sin tareas registradas para este curso.</p>
          ) : (
            <div className="task-list">{tareasDelCurso.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} />)}</div>
          )}
        </section>
      )}

      {formOpen && <CourseForm open onClose={() => setFormOpen(false)} course={editing} />}
      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar curso?"
        message="Las tareas ya creadas con este curso conservarán la referencia, pero el curso dejará de estar disponible para nuevas tareas."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { dispatch({ type: 'DELETE_COURSE', id: deleting }); setDeleting(null); if (selected === deleting) setSelected(null) }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
