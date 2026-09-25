import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { COURSE_COLORS } from '../lib/colors'

function TagForm({ open, onClose, tag }) {
  const { dispatch } = useAppData()
  const [form, setForm] = useState(() => tag || { nombre: '', color: COURSE_COLORS[0] })

  function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    if (tag) dispatch({ type: 'UPDATE_TAG', id: tag.id, cambios: form })
    else dispatch({ type: 'ADD_TAG', payload: form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={tag ? 'Editar etiqueta' : 'Nueva etiqueta'}>
      <form className="task-form" onSubmit={guardar}>
        <label className="field-block">
          <span>Nombre</span>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
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

export default function EtiquetasPage() {
  const { db, dispatch } = useAppData()
  const { isSuperadmin } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const etiquetas = Object.values(db.etiquetas)
  const tareas = Object.values(db.tareas)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Etiquetas</h1>
        {isSuperadmin && (
          <button type="button" className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>+ Nueva etiqueta</button>
        )}
      </header>

      <ul className="tag-manage-list">
        {etiquetas.map((t) => {
          const count = tareas.filter((task) => task.etiquetaId === t.id).length
          return (
            <li key={t.id}>
              <span className="chip chip-outline" style={{ '--chip-color': t.color }}>{t.nombre}</span>
              <span className="ink-soft">{count} tarea{count === 1 ? '' : 's'}</span>
              {isSuperadmin && (
                <span className="course-tile-actions">
                  <span role="button" tabIndex={0} onClick={() => { setEditing(t); setFormOpen(true) }}>Editar</span>
                  <span role="button" tabIndex={0} onClick={() => setDeleting(t.id)}>Eliminar</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {formOpen && <TagForm open onClose={() => setFormOpen(false)} tag={editing} />}
      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar etiqueta?"
        message="Las tareas que la usan se quedarán sin etiqueta."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { dispatch({ type: 'DELETE_TAG', id: deleting }); setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
