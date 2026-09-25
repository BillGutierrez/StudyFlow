import { toISODate } from './dates'

const STORAGE_KEY = 'studyflow:db:v1'
const SESSION_KEY = 'studyflow:session:v1'

function uid(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
}

function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

// ---------------------------------------------------------------------
// Datos de demostración. Se generan una sola vez (cuando no hay nada en
// localStorage) y usan fechas relativas a "hoy" para que la demo siempre
// se vea vigente, sin importar cuándo se abra la app.
// ---------------------------------------------------------------------

function seed() {
  const users = {
    bill: {
      id: 'bill',
      username: 'bill',
      password: 'admin123',
      nombre: 'Bill',
      rol: 'superadmin',
      avatar: '🦁',
      carrera: 'Ingeniería de Sistemas',
      ciclo: '7°',
      xp: 145,
      racha: 4,
      mejorRacha: 9,
      ultimaActividad: offsetDate(0),
      ultimaConexion: Date.now(),
      activo: true,
      logros: ['primera-tarea', 'diez-tareas'],
      silenciadoHasta: null,
    },
    ana: {
      id: 'ana', username: 'ana', password: 'demo123', nombre: 'Ana Quispe', rol: 'usuario',
      avatar: '🦊', carrera: 'Ingeniería de Sistemas', ciclo: '7°', xp: 210, racha: 6, mejorRacha: 12,
      ultimaActividad: offsetDate(0), ultimaConexion: Date.now() - 3600_000, activo: true,
      logros: ['primera-tarea', 'diez-tareas', 'racha-7'], silenciadoHasta: null,
    },
    carlos: {
      id: 'carlos', username: 'carlos', password: 'demo123', nombre: 'Carlos Rojas', rol: 'usuario',
      avatar: '🐨', carrera: 'Ingeniería de Sistemas', ciclo: '7°', xp: 60, racha: 0, mejorRacha: 3,
      ultimaActividad: offsetDate(-4), ultimaConexion: Date.now() - 86_400_000 * 4, activo: true,
      logros: ['primera-tarea'], silenciadoHasta: null,
    },
    maria: {
      id: 'maria', username: 'maria', password: 'demo123', nombre: 'María Torres', rol: 'usuario',
      avatar: '🐼', carrera: 'Ingeniería de Sistemas', ciclo: '7°', xp: 95, racha: 2, mejorRacha: 5,
      ultimaActividad: offsetDate(0), ultimaConexion: Date.now() - 7200_000, activo: true,
      logros: ['primera-tarea'], silenciadoHasta: null,
    },
  }

  const cursos = {
    arq: { id: 'arq', nombre: 'Arquitectura Tecnológica', codigo: 'IS052B', profesor: 'Ing. Salazar', color: '#5B5BD6', estado: 'activo' },
    est2: { id: 'est2', nombre: 'Estadística II', codigo: 'IS053B', profesor: 'Ing. Quiroz', color: '#2F9E63', estado: 'activo' },
    io: { id: 'io', nombre: 'Investigación de Operaciones', codigo: 'IS051B', profesor: 'Ing. Fernández', color: '#E0982A', estado: 'activo' },
    ic: { id: 'ic', nombre: 'Ingeniería del Conocimiento', codigo: 'IS056B', profesor: 'Ing. Palacios', color: '#3A8CC1', estado: 'activo' },
    ed: { id: 'ed', nombre: 'Estructura de Datos', codigo: 'IS054B', profesor: 'Ing. Vega', color: '#C15B94', estado: 'activo' },
    mds: { id: 'mds', nombre: 'Metodología de Desarrollo de Software', codigo: 'IS055B', profesor: 'Ing. Huamán', color: '#1F9E9E', estado: 'activo' },
  }

  const etiquetas = {
    examen: { id: 'examen', nombre: 'Examen', color: '#E5473A' },
    trabajo: { id: 'trabajo', nombre: 'Trabajo', color: '#5B5BD6' },
    exposicion: { id: 'exposicion', nombre: 'Exposición', color: '#C15B94' },
    lectura: { id: 'lectura', nombre: 'Lectura', color: '#2F9E63' },
    proyecto: { id: 'proyecto', nombre: 'Proyecto', color: '#E0982A' },
    tarea: { id: 'tarea', nombre: 'Tarea', color: '#1F9E9E' },
  }

  // día: lun..dom
  const horario = {}
  ;[
    ['lun', '08:00', '11:00', 'mds', 'FIS-LAB3'],
    ['lun', '11:15', '12:45', 'arq', 'FIS306C'],
    ['lun', '12:45', '14:15', 'est2', 'FIS306C'],
    ['mar', '09:30', '11:00', 'io', 'FIS306C'],
    ['mar', '11:15', '12:45', 'io', 'FIS-LAB2'],
    ['mie', '08:00', '09:30', 'est2', 'FIS306C'],
    ['mie', '09:30', '11:00', 'arq', 'FIS306C'],
    ['mie', '11:15', '13:30', 'ic', 'FIS306C'],
    ['jue', '08:00', '09:30', 'est2', 'FIS306C'],
    ['jue', '09:30', '11:00', 'mds', 'FIS306C'],
    ['jue', '11:15', '12:45', 'ed', 'FIS306C'],
    ['jue', '12:45', '14:15', 'io', 'FIS-LAB2'],
    ['vie', '08:00', '09:30', 'ed', 'FIS-LAB1'],
    ['vie', '11:15', '12:45', 'arq', 'FIS306C'],
    ['vie', '12:45', '14:15', 'ic', 'FIS306C'],
  ].forEach(([dia, horaInicio, horaFin, cursoId, aula]) => {
    const id = uid('hor')
    horario[id] = { id, dia, horaInicio, horaFin, cursoId, aula }
  })

  const tareas = {}
  function addTarea(t) {
    const id = uid('tarea')
    tareas[id] = {
      id,
      titulo: t.titulo,
      descripcion: t.descripcion || '',
      cursoId: t.cursoId,
      etiquetaId: t.etiquetaId,
      fechaEntrega: t.fechaEntrega,
      horaEntrega: t.horaEntrega || '23:59',
      planificacion: t.planificacion || null,
      creadoPor: 'bill',
      creadoEn: Date.now() - 5 * 86_400_000,
      modificadoEn: Date.now() - 5 * 86_400_000,
      archivos: t.archivos || [],
      completadoPor: t.completadoPor || {},
      historial: [{ id: uid('h'), accion: 'creó la tarea', usuario: 'bill', fecha: Date.now() - 5 * 86_400_000 }],
    }
    return id
  }

  const tVencida = addTarea({
    titulo: 'Informe de laboratorio N°3',
    descripcion: '## Qué hacer\nResolver los ejercicios 1 al 5 del **laboratorio de Estructura de Datos**.\n\n- Implementar la pila\n- Implementar la cola\n- Subir el `.zip` con el código',
    cursoId: 'ed', etiquetaId: 'tarea', fechaEntrega: offsetDate(-2),
    completadoPor: { ana: Date.now() - 86_400_000 * 3 },
  })
  addTarea({
    titulo: 'Examen parcial de Estadística II',
    descripcion: 'Trae calculadora. Abarca las unidades 1 y 2 del sílabo.',
    cursoId: 'est2', etiquetaId: 'examen', fechaEntrega: offsetDate(0), horaEntrega: '10:00',
    completadoPor: {},
  })
  addTarea({
    titulo: 'Exposición: TOGAF 9.1',
    descripcion: 'Preparar 10 diapositivas sobre las fases del ADM.\n\n> Grupo: Bill, Ana, María',
    cursoId: 'arq', etiquetaId: 'exposicion', fechaEntrega: offsetDate(1),
    planificacion: { fecha: offsetDate(0), horaInicio: '15:00', horaFin: '17:00' },
    completadoPor: {},
  })
  addTarea({
    titulo: 'Ejercicios de programación lineal',
    descripcion: 'Resolver los problemas 4, 7 y 9 del capítulo 3 (método símplex).',
    cursoId: 'io', etiquetaId: 'tarea', fechaEntrega: offsetDate(2),
    completadoPor: { bill: Date.now() - 86_400_000 },
  })
  addTarea({
    titulo: 'Lectura: Sistemas basados en conocimiento',
    descripcion: 'Leer el capítulo 2 del PDF compartido en clase.',
    cursoId: 'ic', etiquetaId: 'lectura', fechaEntrega: offsetDate(3),
    completadoPor: {},
  })
  addTarea({
    titulo: 'Avance N°1 — Proyecto FISBOOK',
    descripcion: 'Entregar el repositorio con el front-end inicial (Vite + React) funcionando.',
    cursoId: 'mds', etiquetaId: 'proyecto', fechaEntrega: offsetDate(6),
    completadoPor: {},
  })
  addTarea({
    titulo: 'Cuestionario virtual — Unidad 2',
    descripcion: '10 preguntas de opción múltiple en el aula virtual.',
    cursoId: 'est2', etiquetaId: 'tarea', fechaEntrega: offsetDate(9),
    completadoPor: {},
  })

  const comentarios = {}
  ;[
    { tareaId: tVencida, userId: 'ana', texto: 'Ya lo subí, quedó en el repo del grupo 👍', reacciones: { '👍': ['bill', 'maria'] } },
    { tareaId: tVencida, userId: 'bill', texto: '¿Alguien más lo tiene avanzado? Se nos pasó la fecha 😅', reacciones: {} },
  ].forEach((c) => {
    const id = uid('com')
    comentarios[id] = {
      id, tareaId: c.tareaId, userId: c.userId, texto: c.texto,
      fecha: Date.now() - 86_400_000, editadoEn: null,
      reacciones: c.reacciones, reportado: false, fijado: false,
    }
  })

  const chat = {}
  ;[
    { userId: 'ana', texto: '¿Alguien entendió el tema de hoy de Arquitectura? 😭' },
    { userId: 'carlos', texto: 'Más o menos, después de clase les paso mis apuntes' },
    { userId: 'bill', texto: 'Recuerden que el examen de Estadística es HOY. No se me duerman 😴' },
  ].forEach((m, i) => {
    const id = uid('chat')
    chat[id] = {
      id, userId: m.userId, texto: m.texto, fecha: Date.now() - (3 - i) * 3_600_000,
      editadoEn: null, reacciones: {}, reportado: false, fijado: i === 2,
    }
  })

  const notificaciones = {}
  ;['ana', 'carlos', 'maria'].forEach((uId) => {
    const id = uid('notif')
    notificaciones[id] = {
      id, userId: uId, tipo: 'tarea', link: null,
      texto: 'Bill agregó una nueva tarea: "Examen parcial de Estadística II"',
      fecha: Date.now() - 86_400_000, leida: uId !== 'ana',
    }
  })

  return {
    users,
    cursos,
    etiquetas,
    horario,
    tareas,
    comentarios,
    chat,
    notificaciones,
    reportes: {},
    misionesReclamadas: {}, // `${userId}:${missionId}:${semanaISO}` -> true
  }
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // localStorage corrupto o no disponible: seguimos con datos nuevos
  }
  const fresh = seed()
  saveDb(fresh)
  return fresh
}

export function saveDb(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // sin espacio o sin storage disponible; se pierde al recargar
  }
}

export function loadSession() {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function saveSession(userId) {
  try {
    if (userId) localStorage.setItem(SESSION_KEY, userId)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignorar
  }
}

export { uid }
