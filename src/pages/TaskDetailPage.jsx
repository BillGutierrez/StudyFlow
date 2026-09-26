import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { renderMarkdown } from '../lib/markdown'
import { EMOJIS_PERMITIDOS, EDIT_WINDOW_MS } from '../lib/reducer'
import { formatDate } from '../lib/dates'
import { quienFalta } from '../lib/selectors'
import UrgencyBadge from '../components/UrgencyBadge'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import TaskFormModal from '../components/TaskFormModal'
import * as Icon from '../components/icons'
import { hasSupabaseConnection, addComment, updateComment, deleteComment } from '../lib/supabaseService'

export default function TaskDetailPage({ taskId, onBack }) {
  const { db, dispatch } = useAppData()
  const { user, isSuperadmin } = useAuth()
  const [texto, setTexto] = useState('')
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [confirmDone, setConfirmDone] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [reportando, setReportando] = useState(null)

  const task = db.tareas[taskId]
  if (!task) {
    return (
      <div className="page">
        <button type="button" className="link-btn" onClick={onBack}>← Volver</button>
        <p className="empty">Esta tarea ya no existe.</p>
      </div>
    )
  }

  const curso = db.cursos[task.cursoId]
  const etiqueta = db.etiquetas[task.etiquetaId]
  const hecha = !!task.completadoPor[user.id]
  const comentarios = Object.values(db.comentarios)
    .filter((c) => c.tareaId === taskId)
    .sort((a, b) => (b.fijado - a.fijado) || a.fecha - b.fecha)
  const { faltan, completaron } = quienFalta(db, taskId)

  async function enviarComentario(e) {
    e.preventDefault()
    if (!texto.trim()) return

    if (hasSupabaseConnection()) {
      await addComment({ tarea_id: taskId, texto: texto.trim() })
    } else {
      dispatch({ type: 'ADD_COMMENT', tareaId: taskId, userId: user.id, texto: texto.trim() })
    }

    setTexto('')
  }

  async function guardarEdicion(id) {
    if (hasSupabaseConnection()) {
      await updateComment(id, editText.trim())
    } else {
      dispatch({ type: 'EDIT_COMMENT', id, userId: user.id, texto: editText.trim() })
    }
    setEditing(null)
  }

  return (
    <div className="page task-detail">
      <button type="button" className="link-btn" onClick={onBack}>← Volver</button>

      <header className="task-detail-head">
        <div>
          <div className="task-card-chips">
            {curso && <span className="chip" style={{ '--chip-color': curso.color }}>{curso.nombre}</span>}
            {etiqueta && <span className="chip chip-outline" style={{ '--chip-color': etiqueta.color }}>{etiqueta.nombre}</span>}
          </div>
          <h1>{task.titulo}</h1>
          <p className="ink-soft">Entrega: {formatDate(task.fechaEntrega, { weekday: 'long', day: 'numeric', month: 'long' })} · {task.horaEntrega}</p>
          {task.planificacion && (
            <p className="ink-soft">📝 Plan de trabajo: {formatDate(task.planificacion.fecha)} {task.planificacion.horaInicio}–{task.planificacion.horaFin}</p>
          )}
          {!hecha && <UrgencyBadge fecha={task.fechaEntrega} />}
          {hecha && <span className="task-card-done-label">Completaste esta tarea ✓</span>}
        </div>
        <div className="task-detail-actions">
          <button type="button" className={hecha ? 'btn-secondary' : 'btn-primary'} onClick={() => setConfirmDone(true)}>
            {hecha ? 'Desmarcar' : 'Marcar como hecha'}
          </button>
          {isSuperadmin && (
            <>
              <button type="button" className="icon-btn" onClick={() => setShowEditForm(true)} title="Editar"><Icon.Edit /></button>
              <button type="button" className="icon-btn" onClick={() => dispatch({ type: 'DUPLICATE_TASK', id: taskId, userId: user.id })} title="Duplicar">⧉</button>
              <button type="button" className="icon-btn danger" onClick={() => setConfirmDelete(true)} title="Eliminar"><Icon.Trash /></button>
            </>
          )}
        </div>
      </header>

      {task.descripcion && (
        <section className="card">
          <h2>Descripción</h2>
          <div className="md-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(task.descripcion) }} />
        </section>
      )}

      {task.archivos?.length > 0 && (
        <section className="card">
          <h2>Archivos adjuntos</h2>
          <ul className="attach-list">
            {task.archivos.map((a) => (
              <li key={a.id}>
                <span>📎 {a.nombre} ({Math.round(a.tamano / 1024)}KB)</span>
                <a href={a.dataUrl} download={a.nombre} className="link-btn">Descargar</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isSuperadmin && (
        <section className="card">
          <h2>Quién falta ({faltan.length}/{faltan.length + completaron.length})</h2>
          <div className="who-list">
            {completaron.map((u) => (
              <span key={u.id} className="who-chip who-done"><Avatar user={u} size={22} /> {u.nombre.split(' ')[0]} ✓</span>
            ))}
            {faltan.map((u) => (
              <span key={u.id} className="who-chip"><Avatar user={u} size={22} /> {u.nombre.split(' ')[0]}</span>
            ))}
          </div>
        </section>
      )}

      {isSuperadmin && task.historial.length > 0 && (
        <section className="card">
          <h2>Historial</h2>
          <ul className="history-list">
            {task.historial.slice().reverse().map((h) => (
              <li key={h.id}>
                <strong>{db.users[h.usuario]?.nombre || h.usuario}</strong> {h.accion}
                <span className="ink-soft"> · {new Date(h.fecha).toLocaleString('es-PE')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Muro de la tarea</h2>
        <form className="comment-form" onSubmit={enviarComentario}>
          <Avatar user={user} size={32} />
          <input
            type="text"
            placeholder="Escribe un comentario, pega tu resolución…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button type="submit" className="btn-primary">Publicar</button>
        </form>

        <ul className="comment-list">
          {comentarios.length === 0 && <p className="empty">Sé el primero en comentar.</p>}
          {comentarios.map((c) => {
            const autor = db.users[c.userId]
            const puedeEditar = c.userId === user.id && Date.now() - c.fecha < EDIT_WINDOW_MS
            return (
              <li key={c.id} className={c.fijado ? 'pinned' : ''}>
                <Avatar user={autor} size={32} />
                <div className="comment-body">
                  <div className="comment-meta">
                    <strong>{autor?.nombre}</strong>
                    <span className="ink-soft">{new Date(c.fecha).toLocaleString('es-PE')}</span>
                    {c.editadoEn && <span className="ink-soft">(editado)</span>}
                    {c.fijado && <span className="pin-tag">Fijado</span>}
                  </div>

                  {editing === c.id ? (
                    <div className="comment-edit">
                      <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <button type="button" className="btn-primary" onClick={() => guardarEdicion(c.id)}>Guardar</button>
                      <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <p>{c.texto}</p>
                  )}

                  <div className="comment-actions">
                    {EMOJIS_PERMITIDOS.map((e) => {
                      const count = c.reacciones[e]?.length || 0
                      const reaccioné = c.reacciones[e]?.includes(user.id)
                      return (
                        <button
                          key={e}
                          type="button"
                          className={`reaction${reaccioné ? ' active' : ''}`}
                          onClick={() => dispatch({ type: 'REACT_COMMENT', id: c.id, emoji: e, userId: user.id })}
                        >
                          {e} {count > 0 && count}
                        </button>
                      )
                    })}
                    {puedeEditar && (
                      <button type="button" className="link-btn" onClick={() => { setEditing(c.id); setEditText(c.texto) }}>Editar</button>
                    )}
                    {(c.userId === user.id || isSuperadmin) && (
                      <button type="button" className="link-btn" onClick={async () => {
                        if (hasSupabaseConnection()) {
                          await deleteComment(c.id)
                        } else {
                          dispatch({ type: 'DELETE_COMMENT', id: c.id, userId: user.id, isAdmin: isSuperadmin })
                        }
                      }}>
                        Eliminar
                      </button>
                    )}
                    {c.userId !== user.id && !c.reportado && (
                      <button type="button" className="link-btn" onClick={() => setReportando(c.id)}>Reportar</button>
                    )}
                    {c.reportado && <span className="ink-soft">Reportado</span>}
                    {isSuperadmin && (
                      <button type="button" className="link-btn" onClick={() => dispatch({ type: 'PIN_COMMENT', id: c.id })}>
                        {c.fijado ? 'Desfijar' : 'Fijar'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <ConfirmDialog
        open={confirmDone}
        title={hecha ? '¿Desmarcar tarea?' : '¿Marcar como hecha?'}
        message={hecha ? 'Volverá a aparecer como pendiente.' : 'Vas a marcar esta tarea como completada.'}
        confirmLabel={hecha ? 'Sí, desmarcar' : 'Sí, completar'}
        onConfirm={() => { dispatch({ type: 'TOGGLE_TASK_DONE', taskId, userId: user.id }); setConfirmDone(false) }}
        onCancel={() => setConfirmDone(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar tarea?"
        message="Esta acción no se puede deshacer. También se borrarán sus comentarios."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { dispatch({ type: 'DELETE_TASK', id: taskId }); setConfirmDelete(false); onBack() }}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={!!reportando}
        title="Reportar comentario"
        message="Se le avisará al Superadmin para que lo revise."
        confirmLabel="Reportar"
        danger
        onConfirm={() => { dispatch({ type: 'REPORT_COMMENT', id: reportando, userId: user.id, motivo: 'reportado por usuario' }); setReportando(null) }}
        onCancel={() => setReportando(null)}
      />
      {showEditForm && <TaskFormModal open task={task} onClose={() => setShowEditForm(false)} />}
    </div>
  )
}
