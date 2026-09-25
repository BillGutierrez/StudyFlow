import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { DAY_NAMES, DAY_KEYS } from '../lib/dates'
import { chocaConHorario } from '../lib/selectors'

function BlockForm({ open, onClose, block }) {
  const { db, dispatch } = useAppData()
  const [form, setForm] = useState(() => block || { dia: 'lun', horaInicio: '08:00', horaFin: '09:30', cursoId: '', aula: '' })
  const [error, setError] = useState('')

  function guardar(e) {
    e.preventDefault()
    if (!form.cursoId || form.horaFin <= form.horaInicio) {
      setError('Revisa el curso y que la hora de fin sea mayor a la de inicio.')
      return
    }
    const choque = chocaConHorario(db, form.dia, form.horaInicio, form.horaFin)
    if (choque && (!block || choque.id !== block.id)) {
      setError(`Ese horario choca con ${db.cursos[choque.cursoId]?.nombre} (${choque.horaInicio}–${choque.horaFin}).`)
      return
    }
    if (block) dispatch({ type: 'UPDATE_SCHEDULE_BLOCK', id: block.id, cambios: form })
    else dispatch({ type: 'ADD_SCHEDULE_BLOCK', payload: form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={block ? 'Editar bloque de clase' : 'Nuevo bloque de clase'}>
      <form className="task-form" onSubmit={guardar}>
        {error && <div className="form-errors"><p>⚠️ {error}</p></div>}
        <div className="form-grid">
          <label className="field-block">
            <span>Día</span>
            <select value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })}>
              {DAY_KEYS.map((k, i) => <option key={k} value={k}>{DAY_NAMES[i]}</option>)}
            </select>
          </label>
          <label className="field-block">
            <span>Curso</span>
            <select value={form.cursoId} onChange={(e) => setForm({ ...form, cursoId: e.target.value })}>
              <option value="">Selecciona…</option>
              {Object.values(db.cursos).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label className="field-block">
            <span>Inicio</span>
            <input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
          </label>
          <label className="field-block">
            <span>Fin</span>
            <input type="time" value={form.horaFin} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} />
          </label>
          <label className="field-block">
            <span>Aula</span>
            <input value={form.aula} onChange={(e) => setForm({ ...form, aula: e.target.value })} placeholder="ej. FIS306C" />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  )
}

export default function HorarioPage() {
  const { db, dispatch } = useAppData()
  const { isSuperadmin } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Horario de clases</h1>
        {isSuperadmin ? (
          <button type="button" className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>+ Nuevo bloque</button>
        ) : (
          <p className="ink-soft">Solo el Superadmin puede modificar el horario académico.</p>
        )}
      </header>

      <div className="schedule-list">
        {DAY_KEYS.map((dia, i) => {
          const bloques = Object.values(db.horario).filter((h) => h.dia === dia).sort((a, b) => (a.horaInicio < b.horaInicio ? -1 : 1))
          return (
            <section key={dia} className="card schedule-day">
              <h2>{DAY_NAMES[i]}</h2>
              {bloques.length === 0 ? (
                <p className="empty">Sin clases.</p>
              ) : (
                <ul>
                  {bloques.map((h) => {
                    const curso = db.cursos[h.cursoId]
                    return (
                      <li key={h.id}>
                        <span className="chip" style={{ '--chip-color': curso?.color }}>{curso?.nombre}</span>
                        <span>{h.horaInicio}–{h.horaFin}</span>
                        <span className="ink-soft">{h.aula}</span>
                        {isSuperadmin && (
                          <span className="course-tile-actions">
                            <span role="button" tabIndex={0} onClick={() => { setEditing(h); setFormOpen(true) }}>Editar</span>
                            <span role="button" tabIndex={0} onClick={() => setDeleting(h.id)}>Eliminar</span>
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {formOpen && <BlockForm open onClose={() => setFormOpen(false)} block={editing} />}
      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar bloque de clase?"
        message="Este horario dejará de bloquear ese espacio en la vista Semana."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { dispatch({ type: 'DELETE_SCHEDULE_BLOCK', id: deleting }); setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
