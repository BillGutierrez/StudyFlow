import { createNotification } from './supabaseService.js'
import { isSupabaseEnabled } from './supabaseDb.js'

const LAST_KEY = 'studyflow:lastNotified'
const PREFS_KEY = 'studyflow:notifPrefs'

export function isSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPermission() {
  return isSupported() ? Notification.permission : 'unsupported'
}

export function requestPermission() {
  return isSupported() ? Notification.requestPermission() : Promise.resolve('unsupported')
}

export function getPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || { sonido: true, vibracion: true }
  } catch {
    return { sonido: true, vibracion: true }
  }
}

export function setPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // ignorar
  }
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 720
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    // navegador sin soporte de audio
  }
}

export function dispararAviso(titulo, cuerpo) {
  const prefs = getPrefs()

  try {
    if (isSupported() && Notification.permission === 'granted') {
      // eslint-disable-next-line no-new
      new Notification(titulo, { body: cuerpo, tag: 'studyflow' })
    }
  } catch {
    // navegador sin soporte o permisos no disponibles
  }

  if (prefs.sonido) beep()
  if (prefs.vibracion && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([80, 40, 80])
}

function hoyKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function persistNotificationToSupabase({ userId, texto, tipo = 'info', link = null }) {
  if (!userId || !texto || !isSupabaseEnabled()) return null

  try {
    return await createNotification({
      user_id: userId,
      tipo,
      texto,
      link,
      leida: false,
      created_at: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

export function revisarYAvisar(db, userId, { force = false } = {}) {
  if (!db || !userId) return null

  try {
    if (!force && localStorage.getItem(LAST_KEY) === hoyKey()) return null
  } catch {
    // storage no disponible
  }

  const tareas = Object.values(db.tareas || {}).filter((t) => !t.completadoPor[userId])
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vencidas = tareas.filter((t) => t.fechaEntrega && new Date(t.fechaEntrega + 'T00:00:00') < hoy)
  const hoyVencen = tareas.filter((t) => t.fechaEntrega === hoy.toISOString().slice(0, 10))

  try {
    localStorage.setItem(LAST_KEY, hoyKey())
  } catch {
    // ignorar
  }

  if (vencidas.length === 0 && hoyVencen.length === 0) return null

  const partes = []
  if (vencidas.length) partes.push(`${vencidas.length} vencida${vencidas.length === 1 ? '' : 's'}`)
  if (hoyVencen.length) partes.push(`${hoyVencen.length} vence${hoyVencen.length === 1 ? 'n' : ''} hoy`)
  dispararAviso('StudyFlow', partes.join(' · '))
  return partes
}
