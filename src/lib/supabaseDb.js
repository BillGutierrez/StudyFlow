import { supabase } from '../supabaseClient.js'
import { loadDb, saveDb } from './store.js'

export function isSupabaseEnabled() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  return Boolean(url && key && url !== 'https://your-project.supabase.co')
}

function normalizeUserName(value) {
  return String(value || '').trim().toLowerCase()
}

function toLocalTimestamp(value) {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

export async function loadDbFromSupabase() {
  if (!isSupabaseEnabled() || !supabase) return null

  try {
    const [profilesResult, coursesResult, labelsResult, scheduleResult, tasksResult, completionsResult, commentsResult, chatResult, notificationsResult, reportsResult, missionsResult] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('courses').select('*').order('created_at', { ascending: true }),
      supabase.from('labels').select('*').order('created_at', { ascending: true }),
      supabase.from('schedule_blocks').select('*').order('dia', { ascending: true }).order('hora_inicio', { ascending: true }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('task_completions').select('*'),
      supabase.from('comments').select('*').order('created_at', { ascending: true }),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('missions_claims').select('*'),
    ])

    const profiles = profilesResult.data || []
    const courses = coursesResult.data || []
    const labels = labelsResult.data || []
    const scheduleBlocks = scheduleResult.data || []
    const tasks = tasksResult.data || []
    const completions = completionsResult.data || []
    const comments = commentsResult.data || []
    const chatMessages = chatResult.data || []
    const notifications = notificationsResult.data || []
    const reports = reportsResult.data || []
    const missionClaims = missionsResult.data || []

    const profileByAuthId = new Map(profiles.map((profile) => [profile.id, profile]))
    const users = {}

    profiles.forEach((profile) => {
      const username = normalizeUserName(profile.username)
      if (!username) return
      users[username] = {
        id: username,
        username,
        nombre: profile.nombre || username,
        avatar: profile.avatar || '🙂',
        cargo: '',
        carrera: profile.carrera || '',
        ciclo: profile.ciclo || '',
        rol: profile.rol || 'usuario',
        xp: Number(profile.xp || 0),
        racha: Number(profile.racha || 0),
        mejorRacha: Number(profile.mejor_racha || 0),
        ultimaActividad: profile.ultima_actividad || null,
        ultimaConexion: profile.ultima_conexion ? new Date(profile.ultima_conexion).getTime() : null,
        activo: profile.activo !== false,
        silenciadoHasta: profile.silenciado_hasta || null,
        password: '',
        logros: [],
      }
    })

    const cursos = {}
    courses.forEach((curso) => {
      cursos[curso.id] = {
        id: curso.id,
        nombre: curso.nombre,
        codigo: curso.codigo || '',
        profesor: curso.profesor || '',
        color: curso.color || '#5B5BD6',
        estado: curso.estado || 'activo',
      }
    })

    const etiquetas = {}
    labels.forEach((etiqueta) => {
      etiquetas[etiqueta.id] = {
        id: etiqueta.id,
        nombre: etiqueta.nombre,
        color: etiqueta.color || '#5B5BD6',
      }
    })

    const horario = {}
    scheduleBlocks.forEach((block) => {
      const id = block.id
      horario[id] = {
        id,
        dia: block.dia,
        horaInicio: block.hora_inicio,
        horaFin: block.hora_fin,
        cursoId: block.curso_id,
        aula: block.aula || '',
      }
    })

    const tareas = {}
    tasks.forEach((task) => {
      const creatorProfile = profileByAuthId.get(task.creado_por)
      const creatorUser = creatorProfile ? normalizeUserName(creatorProfile.username) : null
      const completadoPor = {}
      completions
        .filter((completion) => completion.task_id === task.id)
        .forEach((completion) => {
          const completionProfile = profileByAuthId.get(completion.user_id)
          const userKey = completionProfile ? normalizeUserName(completionProfile.username) : null
          if (!userKey) return
          completadoPor[userKey] = toLocalTimestamp(completion.completed_at)
        })

      tareas[task.id] = {
        id: task.id,
        titulo: task.titulo,
        descripcion: task.descripcion || '',
        cursoId: task.curso_id,
        etiquetaId: task.etiqueta_id,
        fechaEntrega: task.fecha_entrega || null,
        horaEntrega: task.hora_entrega || '23:59',
        planificacion: task.planificacion || null,
        creadoPor: creatorUser || task.creado_por || 'system',
        creadorUid: task.creado_por || null,
        creadoEn: toLocalTimestamp(task.created_at),
        modificadoEn: toLocalTimestamp(task.updated_at),
        archivos: Array.isArray(task.archivos) ? task.archivos : [],
        completadoPor,
        historial: Array.isArray(task.historial) ? task.historial : [],
      }
    })

    const comentarios = {}
    comments.forEach((comment) => {
      const authorProfile = profileByAuthId.get(comment.user_id)
      const authorUser = authorProfile ? normalizeUserName(authorProfile.username) : null
      comentarios[comment.id] = {
        id: comment.id,
        tareaId: comment.tarea_id,
        userId: authorUser || comment.user_id,
        texto: comment.texto,
        fecha: toLocalTimestamp(comment.created_at),
        editadoEn: comment.updated_at && comment.updated_at !== comment.created_at ? toLocalTimestamp(comment.updated_at) : null,
        reacciones: {},
        reportado: !!comment.reportado,
        fijado: !!comment.fijado,
      }
    })

    const chat = {}
    chatMessages.forEach((message) => {
      const authorProfile = profileByAuthId.get(message.user_id)
      const authorUser = authorProfile ? normalizeUserName(authorProfile.username) : null
      chat[message.id] = {
        id: message.id,
        userId: authorUser || message.user_id,
        texto: message.texto,
        fecha: toLocalTimestamp(message.created_at),
        editadoEn: message.updated_at && message.updated_at !== message.created_at ? toLocalTimestamp(message.updated_at) : null,
        reacciones: {},
        reportado: !!message.reportado,
        fijado: !!message.fijado,
      }
    })

    const notificaciones = {}
    notifications.forEach((n) => {
      const targetProfile = profileByAuthId.get(n.user_id)
      const targetUser = targetProfile ? normalizeUserName(targetProfile.username) : null
      if (!targetUser) return
      notificaciones[n.id] = {
        id: n.id,
        userId: targetUser,
        tipo: n.tipo || 'info',
        texto: n.texto,
        link: n.link || null,
        fecha: toLocalTimestamp(n.created_at),
        leida: !!n.leida,
      }
    })

    const reportes = {}
    reports.forEach((report) => {
      const authorProfile = profileByAuthId.get(report.user_id)
      const authorUser = authorProfile ? normalizeUserName(authorProfile.username) : null
      reportes[report.id] = {
        id: report.id,
        tipo: report.tipo,
        refId: report.ref_id,
        userId: authorUser || report.user_id,
        motivo: report.motivo || '',
        fecha: toLocalTimestamp(report.created_at),
        resuelto: !!report.resuelto,
      }
    })

    const misionesReclamadas = {}
    missionClaims.forEach((claim) => {
      const targetProfile = profileByAuthId.get(claim.user_id)
      const targetUser = targetProfile ? normalizeUserName(targetProfile.username) : null
      if (!targetUser) return
      const key = `${targetUser}:${claim.mission_id}:${claim.semana_iso}`
      misionesReclamadas[key] = true
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
      reportes,
      misionesReclamadas,
    }
  } catch (error) {
    console.warn('No se pudo cargar la base real desde Supabase:', error)
    return null
  }
}

export async function saveDbToSupabase(db) {
  if (!isSupabaseEnabled() || !supabase || !db) return

  try {
    const { data: session } = await supabase.auth.getSession()
    const currentUser = session?.session?.user
    if (!currentUser) return

    const courseRows = Object.values(db.cursos || [])
    if (courseRows.length > 0) {
      await supabase.from('courses').upsert(courseRows.map((curso) => ({
        id: curso.id,
        nombre: curso.nombre,
        codigo: curso.codigo,
        profesor: curso.profesor,
        color: curso.color,
        estado: curso.estado,
      })), { onConflict: 'id' })
    }

    const taskRows = Object.values(db.tareas || [])
    if (taskRows.length > 0) {
      await supabase.from('tasks').upsert(taskRows.map((task) => ({
        id: task.id,
        titulo: task.titulo,
        descripcion: task.descripcion,
        curso_id: task.cursoId,
        etiqueta_id: task.etiquetaId,
        fecha_entrega: task.fechaEntrega,
        hora_entrega: task.horaEntrega,
        planificacion: task.planificacion,
        creado_por: currentUser.id,
        archivos: task.archivos,
        historial: task.historial,
      })), { onConflict: 'id' })
    }

    const notificationRows = Object.values(db.notificaciones || [])
    if (notificationRows.length > 0) {
      await supabase.from('notifications').upsert(notificationRows.map((notification) => ({
        id: notification.id,
        user_id: currentUser.id,
        tipo: notification.tipo,
        texto: notification.texto,
        link: notification.link,
        leida: notification.leida,
      })), { onConflict: 'id' })
    }

    const reportRows = Object.values(db.reportes || [])
    if (reportRows.length > 0) {
      await supabase.from('reports').upsert(reportRows.map((report) => ({
        id: report.id,
        tipo: report.tipo,
        ref_id: report.refId,
        user_id: currentUser.id,
        motivo: report.motivo,
        resuelto: report.resuelto,
      })), { onConflict: 'id' })
    }

    const missionEntries = Object.keys(db.misionesReclamadas || {})
    if (missionEntries.length > 0) {
      await Promise.all(missionEntries.map(async (key) => {
        const [userName, missionId, semanaIso] = key.split(':')
        const profileRow = await supabase.from('profiles').select('id').eq('username', userName).maybeSingle()
        const userId = profileRow?.data?.id ?? currentUser.id
        await supabase.from('missions_claims').upsert({
          user_id: userId,
          mission_id: missionId,
          semana_iso: semanaIso,
        }, { onConflict: 'user_id,mission_id,semana_iso' })
      }))
    }
  } catch (error) {
    console.warn('No se pudo sincronizar la app con Supabase:', error)
  }
}

export function loadLocalDb() {
  return loadDb()
}

export function saveLocalDb(db) {
  saveDb(db)
}
