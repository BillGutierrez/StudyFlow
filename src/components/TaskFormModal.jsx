import { useMemo, useState } from 'react'
import Modal from './Modal'
import MarkdownField from './MarkdownField'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { chocaConHorario } from '../lib/selectors'
import { DAY_KEYS, toISODate } from '../lib/dates'
import { hasSupabaseConnection, createTask, updateTask } from '../lib/supabaseService'

const MAX_FILE_KB = 300

function diaKeyDeFecha(fechaISO) {
  const d = new Date(fechaISO + 'T00:00:00')
  const idx = d.getDay() === 0 ? 6 : d.getDay() - 1
  return DAY_KEYS[idx]
}

function draftInicial(task) {
  if (task) {
    return {
      titulo: task.titulo,
      cursoId: task.cursoId,
      etiquetaId: task.etiquetaId,
      fechaEntrega: task.fechaEntrega,
      horaEntrega: task.horaEntrega,
      descripcion: task.descripcion,
      archivos: task.archivos || [],
      usarPlanificacion: !!task.planificacion,
      planFecha: task.planificacion?.fecha || task.fechaEntrega,
      planInicio: task.planificacion?.horaInicio || '15:00',
      planFin: task.planificacion?.horaFin || '17:00',
    }
  }
  const hoy = toISODate(new Date())
  return {
    titulo: '', cursoId: '', etiquetaId: '', fechaEntrega: hoy, horaEntrega: '23:59',
    descripcion: '', archivos: [], usarPlanificacion: false, planFecha: hoy, planInicio: '15:00', planFin: '17:00',
  }
}

export default function TaskFormModal({ open, onClose, task }) {
  const { db, dispatch } = useAppData()
  const { user } = useAuth()
  const [draft, setDraft] = useState(() => draftInicial(task))
  const [errores, setErrores] = useState([])
  const [avisoDuplicado, setAvisoDuplicado] = useState(false)

  const cursos = Object.values(db.cursos).filter((c) => c.estado === 'activo')
  const etiquetas = Object.values(db.etiquetas)

  const conflicto = useMemo(() => {
    if (!draft.usarPlanificacion) return null
    const dia = diaKeyDeFecha(draft.planFecha)
    return chocaConHorario(db, dia, draft.planInicio, draft.planFin)
  }, [db, draft.usarPlanificacion, draft.planFecha, draft.planInicio, draft.planFin])

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function validar() {
    const errs = []
    if (!draft.titulo.trim()) errs.push('El título es obligatorio.')
    if (!draft.cursoId) errs.push('Selecciona un curso.')
    if (!draft.fechaEntrega) errs.push('La fecha de entrega es obligatoria.')
    if (draft.usarPlanificacion && draft.planFin <= draft.planInicio) errs.push('La hora de fin del bloque debe ser mayor a la de inicio.')
    if (draft.usarPlanificacion && conflicto) {
      const curso = db.cursos[conflicto.cursoId]
      errs.push(`Ese bloque choca con tu clase de ${curso?.nombre} (${conflicto.horaInicio}–${conflicto.horaFin}).`)
    }
    return errs
  }

  function esDuplicadoProbable() {
    return Object.values(db.tareas).some(
      (t) =>
        (!task || t.id !== task.id) &&
        t.cursoId === draft.cursoId &&
        t.fechaEntrega === draft.fechaEntrega &&
        t.titulo.trim().toLowerCase() === draft.titulo.trim().toLowerCase(),
    )
  }

  async function guardar(forzar = false) {
    const errs = validar()
    setErrores(errs)
    if (errs.length) return

    if (!forzar && !task && esDuplicadoProbable()) {
      setAvisoDuplicado(true)
      return
    }

    const payload = {
      titulo: draft.titulo.trim(),
      cursoId: draft.cursoId,
      etiquetaId: draft.etiquetaId || null,
      fechaEntrega: draft.fechaEntrega,
      horaEntrega: draft.horaEntrega,
      descripcion: draft.descripcion,
      archivos: draft.archivos,
      planificacion: draft.usarPlanificacion
        ? { fecha: draft.planFecha, horaInicio: draft.planInicio, horaFin: draft.planFin }
        : null,
    }

    if (hasSupabaseConnection()) {
      if (task) {
        await updateTask(task.id, {
          titulo: payload.titulo,
          descripcion: payload.descripcion,
          curso_id: payload.cursoId,
          etiqueta_id: payload.etiquetaId || null,
          fecha_entrega: payload.fechaEntrega,
          hora_entrega: payload.horaEntrega,
          planificacion: payload.planificacion,
          archivos: payload.archivos,
          updated_at: new Date().toISOString(),
        })
      } else {
        await createTask({
          titulo: payload.titulo,
          descripcion: payload.descripcion,
          curso_id: payload.cursoId,
          etiqueta_id: payload.etiquetaId || null,
          fecha_entrega: payload.fechaEntrega,
          hora_entrega: payload.horaEntrega,
          planificacion: payload.planificacion,
          archivos: payload.archivos,
          creado_por: user.id,
          historial: [{ accion: 'creó la tarea', usuario: user.id, fecha: Date.now() }],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } else {
      if (task) {
        dispatch({ type: 'UPDATE_TASK', id: task.id, cambios: payload, userId: user.id })
      } else {
        dispatch({ type: 'ADD_TASK', payload, userId: user.id })
      }
    }
    onClose()
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_KB * 1024) {
      setErrores([`El archivo supera ${MAX_FILE_KB}KB. Por ahora solo se aceptan adjuntos pequeños.`])
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      set('archivos', [
        ...draft.archivos,
        { id: crypto.randomUUID(), nombre: file.name, tamano: file.size, tipo: file.type, dataUrl: reader.result },
      ])
    }
    reader.readAsDataURL(file)
  }

  function quitarArchivo(id) {
    set('archivos', draft.archivos.filter((a) => a.id !== id))
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Editar tarea' : 'Nueva tarea'} wide>
      <div className="task-form">
        {errores.length > 0 && (
          <div className="form-errors">
            {errores.map((e, i) => (
              <p key={i}>⚠️ {e}</p>
            ))}
          </div>
        )}

        {avisoDuplicado && (
          <div className="form-warning">
            <p>Ya existe una tarea parecida (mismo título, curso y fecha). ¿Quieres crearla de todos modos?</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setAvisoDuplicado(false)}>
                Revisar
              </button>
              <button type="button" className="btn-primary" onClick={() => { setAvisoDuplicado(false); guardar(true) }}>
                Crear de todos modos
              </button>
            </div>
          </div>
        )}

        <div className="form-grid">
          <label className="field-block field-wide">
            <span>Título</span>
            <input type="text" value={draft.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ej. Informe de laboratorio N°4" />
          </label>

          <label className="field-block">
            <span>Curso</span>
            <select value={draft.cursoId} onChange={(e) => set('cursoId', e.target.value)}>
              <option value="">Selecciona…</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </label>

          <label className="field-block">
            <span>Etiqueta</span>
            <select value={draft.etiquetaId} onChange={(e) => set('etiquetaId', e.target.value)}>
              <option value="">Sin etiqueta</option>
              {etiquetas.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </label>

          <label className="field-block">
            <span>Fecha de entrega</span>
            <input type="date" value={draft.fechaEntrega} onChange={(e) => set('fechaEntrega', e.target.value)} />
          </label>

          <label className="field-block">
            <span>Hora de entrega</span>
            <input type="time" value={draft.horaEntrega} onChange={(e) => set('horaEntrega', e.target.value)} />
          </label>
        </div>

        <label className="plan-toggle">
          <input type="checkbox" checked={draft.usarPlanificacion} onChange={(e) => set('usarPlanificacion', e.target.checked)} />
          <span>Agregar un bloque de planificación (cuándo pienso trabajar en esto, distinto de la fecha límite)</span>
        </label>

        {draft.usarPlanificacion && (
          <div className="form-grid">
            <label className="field-block">
              <span>Día para trabajar</span>
              <input type="date" value={draft.planFecha} onChange={(e) => set('planFecha', e.target.value)} />
            </label>
            <label className="field-block">
              <span>Desde</span>
              <input type="time" value={draft.planInicio} onChange={(e) => set('planInicio', e.target.value)} />
            </label>
            <label className="field-block">
              <span>Hasta</span>
              <input type="time" value={draft.planFin} onChange={(e) => set('planFin', e.target.value)} />
            </label>
            {conflicto && (
              <p className="conflict-note field-wide">
                ⚠️ Choca con tu clase de {db.cursos[conflicto.cursoId]?.nombre} ({conflicto.horaInicio}–{conflicto.horaFin}).
              </p>
            )}
          </div>
        )}

        <div className="field-block">
          <span>Descripción (opcional)</span>
          <MarkdownField value={draft.descripcion} onChange={(v) => set('descripcion', v)} placeholder="¿Qué hay que hacer exactamente?" />
        </div>

        <div className="field-block">
          <span>Archivos adjuntos (máx. {MAX_FILE_KB}KB c/u — para PDFs grandes, mejor comparte un enlace en la descripción)</span>
          <input type="file" onChange={onFile} />
          {draft.archivos.length > 0 && (
            <ul className="attach-list">
              {draft.archivos.map((a) => (
                <li key={a.id}>
                  <span>📎 {a.nombre} ({Math.round(a.tamano / 1024)}KB)</span>
                  <button type="button" onClick={() => quitarArchivo(a.id)}>Quitar</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={() => guardar(false)}>
            {task ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
