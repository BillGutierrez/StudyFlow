import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { urgencyLevel, formatDate } from '../lib/dates'
import UrgencyBadge from './UrgencyBadge'
import ConfirmDialog from './ConfirmDialog'

export default function TaskCard({ task, onOpen }) {
  const { db, dispatch } = useAppData()
  const { user } = useAuth()
  const [confirming, setConfirming] = useState(false)

  const curso = db.cursos[task.cursoId]
  const etiqueta = db.etiquetas[task.etiquetaId]
  const hecha = !!task.completadoPor[user.id]
  const nivel = urgencyLevel(task.fechaEntrega)

  function pedirConfirmacion(e) {
    e.stopPropagation()
    setConfirming(true)
  }

  function confirmar() {
    dispatch({ type: 'TOGGLE_TASK_DONE', taskId: task.id, userId: user.id })
    setConfirming(false)
  }

  return (
    <>
      <article
        className={`task-card urgency-${hecha ? 'completada' : nivel}${hecha ? ' is-done' : ''}`}
        onClick={() => onOpen?.(task.id)}
      >
        <button
          type="button"
          className={`task-check${hecha ? ' checked' : ''}`}
          onClick={pedirConfirmacion}
          aria-label={hecha ? 'Desmarcar tarea' : 'Marcar tarea como hecha'}
        >
          {hecha && '✓'}
        </button>
        <div className="task-card-body">
          <span className="task-card-title">{task.titulo}</span>
          <div className="task-card-chips">
            {curso && (
              <span className="chip" style={{ '--chip-color': curso.color }}>
                {curso.nombre}
              </span>
            )}
            {etiqueta && (
              <span className="chip chip-outline" style={{ '--chip-color': etiqueta.color }}>
                {etiqueta.nombre}
              </span>
            )}
          </div>
        </div>
        <div className="task-card-meta">
          <span className="task-card-date">{formatDate(task.fechaEntrega)}</span>
          {!hecha && <UrgencyBadge fecha={task.fechaEntrega} compact />}
          {hecha && <span className="task-card-done-label">Hecha ✓</span>}
        </div>
      </article>

      <ConfirmDialog
        open={confirming}
        title={hecha ? '¿Desmarcar tarea?' : '¿Marcar como hecha?'}
        message={
          hecha
            ? `"${task.titulo}" volverá a aparecer como pendiente.`
            : `Vas a marcar "${task.titulo}" como completada.`
        }
        confirmLabel={hecha ? 'Sí, desmarcar' : 'Sí, completar'}
        onConfirm={confirmar}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
