import { uid } from './store'
import { todayISO, daysUntil } from './dates'
import { calcularNivel, XP_POR_TAREA, XP_BONUS_ANTICIPADA, XP_POR_MISION, CATALOGO_LOGROS } from './gamification'

const EMOJIS_PERMITIDOS = ['👍', '❤️', '😂', '😮', '🙏', '🔥']
const EDIT_WINDOW_MS = 5 * 60 * 1000

function withHistorial(tarea, accion, usuario) {
  const entry = { id: uid('h'), accion, usuario, fecha: Date.now() }
  return { ...tarea, historial: [...tarea.historial, entry], modificadoEn: Date.now() }
}

function notify(db, userId, texto, tipo = 'info', link = null) {
  const id = uid('notif')
  db.notificaciones[id] = { id, userId, tipo, texto, link, fecha: Date.now(), leida: false }
}

function otorgarXP(db, userId, cantidad) {
  const u = db.users[userId]
  if (!u) return
  u.xp = Math.max(0, u.xp + cantidad)
}

function actualizarRacha(db, userId) {
  const u = db.users[userId]
  if (!u) return
  const hoy = todayISO()
  if (u.ultimaActividad === hoy) return // ya contada hoy
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  const ayerISO = ayer.toISOString().slice(0, 10)
  u.racha = u.ultimaActividad === ayerISO ? u.racha + 1 : 1
  u.mejorRacha = Math.max(u.mejorRacha, u.racha)
  u.ultimaActividad = hoy
  if (u.racha >= 7) desbloquearLogro(db, userId, 'racha-7')
}

function desbloquearLogro(db, userId, logroId) {
  const u = db.users[userId]
  if (!u || u.logros.includes(logroId)) return
  u.logros = [...u.logros, logroId]
  const logro = CATALOGO_LOGROS.find((l) => l.id === logroId)
  notify(db, userId, `¡Nuevo logro desbloqueado! ${logro ? logro.nombre : logroId}`, 'logro')
}

function contarCompletadas(db, userId) {
  return Object.values(db.tareas).filter((t) => t.completadoPor[userId]).length
}

export function dbReducer(state, action) {
  if (action.type === 'HYDRATE') {
    return action.payload || state
  }

  if (!state) return state

  const db = structuredClone(state)

  switch (action.type) {
    case 'ADD_TASK': {
      const id = uid('tarea')
      db.tareas[id] = {
        id,
        ...action.payload,
        archivos: action.payload.archivos || [],
        completadoPor: {},
        creadoPor: action.userId,
        creadoEn: Date.now(),
        modificadoEn: Date.now(),
        historial: [{ id: uid('h'), accion: 'creó la tarea', usuario: action.userId, fecha: Date.now() }],
      }
      Object.values(db.users)
        .filter((u) => u.id !== action.userId)
        .forEach((u) => notify(db, u.id, `Nueva tarea: "${action.payload.titulo}"`, 'tarea', id))
      return db
    }

    case 'UPDATE_TASK': {
      const t = db.tareas[action.id]
      if (!t) return db
      db.tareas[action.id] = withHistorial({ ...t, ...action.cambios }, 'editó la tarea', action.userId)
      return db
    }

    case 'DELETE_TASK': {
      delete db.tareas[action.id]
      Object.values(db.comentarios).forEach((c) => {
        if (c.tareaId === action.id) delete db.comentarios[c.id]
      })
      return db
    }

    case 'DUPLICATE_TASK': {
      const t = db.tareas[action.id]
      if (!t) return db
      const id = uid('tarea')
      db.tareas[id] = {
        ...t,
        id,
        titulo: `${t.titulo} (copia)`,
        completadoPor: {},
        creadoEn: Date.now(),
        modificadoEn: Date.now(),
        historial: [{ id: uid('h'), accion: 'duplicó la tarea', usuario: action.userId, fecha: Date.now() }],
      }
      return db
    }

    case 'TOGGLE_TASK_DONE': {
      const t = db.tareas[action.taskId]
      if (!t) return db
      const yaHecha = !!t.completadoPor[action.userId]
      const completadoPor = { ...t.completadoPor }
      if (yaHecha) {
        delete completadoPor[action.userId]
        db.tareas[action.taskId] = withHistorial({ ...t, completadoPor }, 'desmarcó la tarea como hecha', action.userId)
      } else {
        completadoPor[action.userId] = Date.now()
        db.tareas[action.taskId] = withHistorial({ ...t, completadoPor }, 'completó la tarea', action.userId)
        const dias = daysUntil(t.fechaEntrega)
        otorgarXP(db, action.userId, XP_POR_TAREA + (dias >= 1 ? XP_BONUS_ANTICIPADA : 0))
        actualizarRacha(db, action.userId)
        const total = contarCompletadas(db, action.userId)
        if (total >= 1) desbloquearLogro(db, action.userId, 'primera-tarea')
        if (total >= 10) desbloquearLogro(db, action.userId, 'diez-tareas')
        if (total >= 100) desbloquearLogro(db, action.userId, 'cien-tareas')
        if (new Date().getHours() < 7) desbloquearLogro(db, action.userId, 'madrugador')
      }
      return db
    }

    // --- Cursos / etiquetas / horario (solo superadmin desde la UI) ---
    case 'ADD_COURSE': {
      const id = uid('curso')
      db.cursos[id] = { id, estado: 'activo', ...action.payload }
      return db
    }
    case 'UPDATE_COURSE': {
      db.cursos[action.id] = { ...db.cursos[action.id], ...action.cambios }
      return db
    }
    case 'DELETE_COURSE': {
      delete db.cursos[action.id]
      return db
    }
    case 'ADD_TAG': {
      const id = uid('etq')
      db.etiquetas[id] = { id, ...action.payload }
      return db
    }
    case 'UPDATE_TAG': {
      db.etiquetas[action.id] = { ...db.etiquetas[action.id], ...action.cambios }
      return db
    }
    case 'DELETE_TAG': {
      delete db.etiquetas[action.id]
      return db
    }
    case 'ADD_SCHEDULE_BLOCK': {
      const id = uid('hor')
      db.horario[id] = { id, ...action.payload }
      return db
    }
    case 'UPDATE_SCHEDULE_BLOCK': {
      db.horario[action.id] = { ...db.horario[action.id], ...action.cambios }
      return db
    }
    case 'DELETE_SCHEDULE_BLOCK': {
      delete db.horario[action.id]
      return db
    }

    // --- Comentarios (muro de tarea) ---
    case 'ADD_COMMENT': {
      const id = uid('com')
      db.comentarios[id] = {
        id, tareaId: action.tareaId, userId: action.userId, texto: action.texto,
        fecha: Date.now(), editadoEn: null, reacciones: {}, reportado: false, fijado: false,
      }
      const tarea = db.tareas[action.tareaId]
      const involucrados = new Set(Object.values(db.comentarios).filter((c) => c.tareaId === action.tareaId).map((c) => c.userId))
      if (tarea) involucrados.add(tarea.creadoPor)
      involucrados.delete(action.userId)
      involucrados.forEach((uId) => notify(db, uId, `Nuevo comentario en "${tarea?.titulo}"`, 'comentario', action.tareaId))
      return db
    }
    case 'EDIT_COMMENT': {
      const c = db.comentarios[action.id]
      if (!c || c.userId !== action.userId) return db
      if (Date.now() - c.fecha > EDIT_WINDOW_MS) return db
      db.comentarios[action.id] = { ...c, texto: action.texto, editadoEn: Date.now() }
      return db
    }
    case 'DELETE_COMMENT': {
      const c = db.comentarios[action.id]
      if (!c) return db
      if (c.userId !== action.userId && !action.isAdmin) return db
      delete db.comentarios[action.id]
      return db
    }
    case 'REACT_COMMENT': {
      const c = db.comentarios[action.id]
      if (!c || !EMOJIS_PERMITIDOS.includes(action.emoji)) return db
      const reacciones = { ...c.reacciones }
      const lista = new Set(reacciones[action.emoji] || [])
      if (lista.has(action.userId)) lista.delete(action.userId)
      else lista.add(action.userId)
      reacciones[action.emoji] = [...lista]
      db.comentarios[action.id] = { ...c, reacciones }
      return db
    }
    case 'REPORT_COMMENT': {
      const c = db.comentarios[action.id]
      if (!c) return db
      db.comentarios[action.id] = { ...c, reportado: true }
      const rid = uid('rep')
      db.reportes[rid] = { id: rid, tipo: 'comentario', refId: action.id, userId: action.userId, motivo: action.motivo, fecha: Date.now(), resuelto: false }
      return db
    }
    case 'PIN_COMMENT': {
      const c = db.comentarios[action.id]
      if (!c) return db
      db.comentarios[action.id] = { ...c, fijado: !c.fijado }
      return db
    }

    // --- Chat general ---
    case 'ADD_CHAT': {
      const u = db.users[action.userId]
      if (u?.silenciadoHasta && u.silenciadoHasta > Date.now()) return db
      const id = uid('chat')
      db.chat[id] = {
        id, userId: action.userId, texto: action.texto, fecha: Date.now(),
        editadoEn: null, reacciones: {}, reportado: false, fijado: false,
      }
      return db
    }
    case 'EDIT_CHAT': {
      const m = db.chat[action.id]
      if (!m || m.userId !== action.userId) return db
      if (Date.now() - m.fecha > EDIT_WINDOW_MS) return db
      db.chat[action.id] = { ...m, texto: action.texto, editadoEn: Date.now() }
      return db
    }
    case 'DELETE_CHAT': {
      const m = db.chat[action.id]
      if (!m) return db
      if (m.userId !== action.userId && !action.isAdmin) return db
      delete db.chat[action.id]
      return db
    }
    case 'REACT_CHAT': {
      const m = db.chat[action.id]
      if (!m || !EMOJIS_PERMITIDOS.includes(action.emoji)) return db
      const reacciones = { ...m.reacciones }
      const lista = new Set(reacciones[action.emoji] || [])
      if (lista.has(action.userId)) lista.delete(action.userId)
      else lista.add(action.userId)
      reacciones[action.emoji] = [...lista]
      db.chat[action.id] = { ...m, reacciones }
      return db
    }
    case 'REPORT_CHAT': {
      const m = db.chat[action.id]
      if (!m) return db
      db.chat[action.id] = { ...m, reportado: true }
      const rid = uid('rep')
      db.reportes[rid] = { id: rid, tipo: 'chat', refId: action.id, userId: action.userId, motivo: action.motivo, fecha: Date.now(), resuelto: false }
      return db
    }
    case 'PIN_CHAT': {
      const m = db.chat[action.id]
      if (!m) return db
      db.chat[action.id] = { ...m, fijado: !m.fijado }
      return db
    }
    case 'RESOLVE_REPORT': {
      const r = db.reportes[action.id]
      if (!r) return db
      db.reportes[action.id] = { ...r, resuelto: true }
      return db
    }
    case 'MUTE_USER': {
      const u = db.users[action.userId]
      if (!u) return db
      u.silenciadoHasta = action.minutos ? Date.now() + action.minutos * 60_000 : null
      return db
    }

    // --- Administración de usuarios ---
    case 'TOGGLE_USER_ACTIVE': {
      const u = db.users[action.userId]
      if (!u) return db
      u.activo = !u.activo
      return db
    }
    case 'UPDATE_PROFILE': {
      db.users[action.userId] = { ...db.users[action.userId], ...action.cambios }
      return db
    }

    // --- Notificaciones ---
    case 'MARK_NOTIF_READ': {
      const n = db.notificaciones[action.id]
      if (n) n.leida = true
      return db
    }
    case 'MARK_ALL_READ': {
      Object.values(db.notificaciones).forEach((n) => {
        if (n.userId === action.userId) n.leida = true
      })
      return db
    }

    // --- Misiones / gamificación ---
    case 'CLAIM_MISSION': {
      const key = `${action.userId}:${action.missionId}:${action.semanaISO}`
      if (db.misionesReclamadas[key]) return db
      db.misionesReclamadas[key] = true
      otorgarXP(db, action.userId, action.xp ?? XP_POR_MISION)
      notify(db, action.userId, `¡Misión completada! +${action.xp ?? XP_POR_MISION} XP`, 'mision')
      return db
    }

    // --- Autenticación ---
    case 'REGISTER_USER': {
      const id = action.payload.username.toLowerCase().trim()
      if (db.users[id]) return db
      db.users[id] = {
        id, username: id, password: action.payload.password,
        nombre: action.payload.nombre, rol: 'usuario', avatar: action.payload.avatar || '🙂',
        carrera: action.payload.carrera || '', ciclo: action.payload.ciclo || '',
        xp: 0, racha: 0, mejorRacha: 0, ultimaActividad: null,
        ultimaConexion: Date.now(), activo: true, logros: [], silenciadoHasta: null,
      }
      return db
    }
    case 'TOUCH_LOGIN': {
      const u = db.users[action.userId]
      if (u) u.ultimaConexion = Date.now()
      return db
    }
    case 'RESET_PASSWORD': {
      const u = db.users[action.userId]
      if (u) u.password = action.password
      return db
    }

    default:
      return db
  }
}

export function calcularNivelUsuario(user) {
  return calcularNivel(user?.xp ?? 0)
}

export { EMOJIS_PERMITIDOS, EDIT_WINDOW_MS }
