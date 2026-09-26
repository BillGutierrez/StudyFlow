import { supabase } from '../supabaseClient.js'
import { isSupabaseEnabled } from './supabaseDb.js'

export function hasSupabaseConnection() {
  return Boolean(supabase && isSupabaseEnabled())
}

async function getCurrentAuthUserId() {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.id) {
    console.warn('No se pudo obtener el usuario autenticado de Supabase:', error)
    return null
  }

  return data.user.id
}

export async function upsertProfile(profile) {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.warn('No se pudo guardar el perfil en Supabase:', error)
    return null
  }

  return data
}

export async function getProfileById(userId) {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('No se pudo cargar el perfil desde Supabase:', error)
    return null
  }

  return data
}

export async function listTasks() {
  if (!hasSupabaseConnection()) return []

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('No se pudieron cargar las tareas desde Supabase:', error)
    return []
  }

  return data || []
}

export async function createTask(task) {
  if (!hasSupabaseConnection()) return null

  const authUserId = await getCurrentAuthUserId()
  if (!authUserId) return null

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...task, creado_por: authUserId })
    .select()
    .single()

  if (error) {
    console.warn('No se pudo crear la tarea en Supabase:', error)
    return null
  }

  return data
}

export async function updateTask(taskId, task) {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase
    .from('tasks')
    .update(task)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.warn('No se pudo actualizar la tarea en Supabase:', error)
    return null
  }

  return data
}

export async function deleteTask(taskId) {
  if (!hasSupabaseConnection()) return false

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.warn('No se pudo eliminar la tarea en Supabase:', error)
    return false
  }

  return true
}

export async function completeTask(taskId, userId) {
  if (!hasSupabaseConnection()) return null

  const authUserId = await getCurrentAuthUserId()
  if (!authUserId) return null

  const { data, error } = await supabase
    .from('task_completions')
    .upsert({ task_id: taskId, user_id: authUserId }, { onConflict: 'task_id,user_id' })
    .select()
    .single()

  if (error) {
    console.warn('No se pudo registrar la tarea completada en Supabase:', error)
    return null
  }

  return data
}

export async function uncompleteTask(taskId, userId) {
  if (!hasSupabaseConnection()) return false

  const authUserId = await getCurrentAuthUserId()
  if (!authUserId) return false

  const { error } = await supabase
    .from('task_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', authUserId)

  if (error) {
    console.warn('No se pudo desmarcar la tarea completada en Supabase:', error)
    return false
  }

  return true
}

export async function listCommentsForTask(taskId) {
  if (!hasSupabaseConnection()) return []

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('tarea_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('No se pudieron cargar los comentarios desde Supabase:', error)
    return []
  }

  return data || []
}

export async function addComment(comment) {
  if (!hasSupabaseConnection()) return null

  const authUserId = await getCurrentAuthUserId()
  if (!authUserId) return null

  const { data, error } = await supabase
    .from('comments')
    .insert({ ...comment, user_id: authUserId })
    .select()
    .single()

  if (error) {
    console.warn('No se pudo guardar el comentario en Supabase:', error)
    return null
  }

  return data
}

export async function updateComment(commentId, texto) {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase
    .from('comments')
    .update({ texto, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select()
    .single()

  if (error) {
    console.warn('No se pudo actualizar el comentario en Supabase:', error)
    return null
  }

  return data
}

export async function deleteComment(commentId) {
  if (!hasSupabaseConnection()) return false

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.warn('No se pudo eliminar el comentario en Supabase:', error)
    return false
  }

  return true
}

export async function listChatMessages() {
  if (!hasSupabaseConnection()) return []

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('No se pudieron cargar los mensajes del chat desde Supabase:', error)
    return []
  }

  return data || []
}

export async function addChatMessage(message) {
  if (!hasSupabaseConnection()) return null

  const authUserId = await getCurrentAuthUserId()
  if (!authUserId) return null

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ ...message, user_id: authUserId })
    .select()
    .single()

  if (error) {
    console.warn('No se pudo guardar el mensaje del chat en Supabase:', error)
    return null
  }

  return data
}

export async function updateChatMessage(messageId, texto) {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ texto, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    console.warn('No se pudo actualizar el mensaje del chat en Supabase:', error)
    return null
  }

  return data
}

export async function deleteChatMessage(messageId) {
  if (!hasSupabaseConnection()) return false

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    console.warn('No se pudo eliminar el mensaje del chat en Supabase:', error)
    return false
  }

  return true
}

export async function listNotificationsForUser(userId) {
  if (!hasSupabaseConnection()) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('No se pudieron cargar las notificaciones desde Supabase:', error)
    return []
  }

  return data || []
}

export async function createNotification(notification) {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (error) {
    console.warn('No se pudo guardar la notificación en Supabase:', error)
    return null
  }

  return data
}

export async function markNotificationRead(notificationId) {
  if (!hasSupabaseConnection()) return false

  const { error } = await supabase
    .from('notifications')
    .update({ leida: true })
    .eq('id', notificationId)

  if (error) {
    console.warn('No se pudo marcar la notificación como leída:', error)
    return false
  }

  return true
}

export async function listReports() {
  if (!hasSupabaseConnection()) return []

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('No se pudieron cargar los reportes desde Supabase:', error)
    return []
  }

  return data || []
}

export async function createReport(report) {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase
    .from('reports')
    .insert(report)
    .select()
    .single()

  if (error) {
    console.warn('No se pudo guardar el reporte en Supabase:', error)
    return null
  }

  return data
}

export async function resolveReport(reportId) {
  if (!hasSupabaseConnection()) return false

  const { error } = await supabase
    .from('reports')
    .update({ resuelto: true })
    .eq('id', reportId)

  if (error) {
    console.warn('No se pudo resolver el reporte en Supabase:', error)
    return false
  }

  return true
}

export async function listMissionClaims() {
  if (!hasSupabaseConnection()) return []

  const { data, error } = await supabase
    .from('missions_claims')
    .select('*')

  if (error) {
    console.warn('No se pudieron cargar las misiones reclamadas desde Supabase:', error)
    return []
  }

  return data || []
}

export async function claimMission(mission) {
  if (!hasSupabaseConnection()) return null

  const { data, error } = await supabase
    .from('missions_claims')
    .insert(mission)
    .select()
    .single()

  if (error) {
    console.warn('No se pudo guardar la misión reclamada en Supabase:', error)
    return null
  }

  return data
}
