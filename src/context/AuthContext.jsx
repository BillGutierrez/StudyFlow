import { createContext, useContext, useEffect, useState } from 'react'
import { loadSession, saveSession } from '../lib/store.js'
import { isSupabaseEnabled } from '../lib/supabaseDb.js'
import { upsertProfile } from '../lib/supabaseService.js'
import { supabase } from '../supabaseClient.js'
import { useAppData } from './AppDataContext.jsx'

const AuthContext = createContext(null)

function toSupabaseEmail(username) {
  return `${String(username || '').trim().toLowerCase()}@studyflow.local`
}

async function syncSupabaseProfile(username, profile) {
  if (!supabase || !isSupabaseEnabled()) return

  const email = toSupabaseEmail(username)
  const { data: sessionData } = await supabase.auth.getSession()
  const authUser = sessionData?.session?.user

  if (!authUser) return

  const payload = {
    id: authUser.id,
    username: String(username || '').trim().toLowerCase(),
    nombre: profile?.nombre || username || 'Usuario',
    avatar: profile?.avatar || '🙂',
    carrera: profile?.carrera || '',
    ciclo: profile?.ciclo || '',
    rol: profile?.rol || 'usuario',
    xp: profile?.xp ?? 0,
    racha: profile?.racha ?? 0,
    mejor_racha: profile?.mejorRacha ?? 0,
    ultima_actividad: profile?.ultimaActividad || null,
    ultima_conexion: new Date().toISOString(),
    activo: profile?.activo ?? true,
    silenciado_hasta: profile?.silenciadoHasta || null,
  }

  await upsertProfile(payload)

  if (email) {
    await supabase.auth.updateUser({ email })
  }
}

function inferUsernameFromAuthUser(authUser) {
  const meta = authUser?.user_metadata || {}
  const fromMeta = String(meta.username || meta.user_name || '').trim().toLowerCase()
  if (fromMeta) return fromMeta

  const email = String(authUser?.email || '').trim().toLowerCase()
  if (!email) return ''
  return email.split('@')[0]
}

export function AuthProvider({ children }) {
  const { db, dispatch } = useAppData()
  const [userId, setUserId] = useState(() => loadSession())

  useEffect(() => {
    saveSession(userId)
  }, [userId])

  useEffect(() => {
    if (!supabase || !isSupabaseEnabled()) return

    async function hydrateSessionUser() {
      const { data: sessionData, error } = await supabase.auth.getSession()
      if (error || !sessionData?.session?.user) return

      const authUser = sessionData.session.user
      const username = inferUsernameFromAuthUser(authUser)
      const localUser = username && db?.users?.[username] ? username : null

      if (localUser) {
        setUserId(localUser)
        await syncSupabaseProfile(localUser, db.users[localUser])
      }
    }

    hydrateSessionUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const authUser = session?.user
        const username = inferUsernameFromAuthUser(authUser)
        if (username && db?.users?.[username]) {
          setUserId(username)
          syncSupabaseProfile(username, db.users[username])
        }
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [db])

  const user = userId ? (db?.users?.[userId] ?? null) : null

  async function login(username, password) {
    const id = username.toLowerCase().trim()
    if (!db || !db.users) return { ok: false, error: 'La base de datos aún está cargando.' }

    const u = db.users[id]
    if (!u) return { ok: false, error: 'No existe una cuenta con ese usuario.' }
    if (!u.activo) return { ok: false, error: 'Esta cuenta fue desactivada por el administrador.' }

    if (supabase && isSupabaseEnabled()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: toSupabaseEmail(id),
          password,
        })

        if (error) {
          return { ok: false, error: error.message }
        }

        if (data?.user) {
          await syncSupabaseProfile(id, u)
          dispatch({ type: 'TOUCH_LOGIN', userId: id })
          setUserId(id)
          return { ok: true }
        }
      } catch (error) {
        console.warn('Fallo al autenticar con Supabase:', error)
      }
    }

    if (u.password !== password) return { ok: false, error: 'Contraseña incorrecta.' }
    dispatch({ type: 'TOUCH_LOGIN', userId: id })
    setUserId(id)
    return { ok: true }
  }

  async function register({ username, password, nombre, avatar, carrera, ciclo }) {
    const id = username.toLowerCase().trim()
    if (!db || !db.users) return { ok: false, error: 'La base de datos aún está cargando.' }
    if (!id || !password || !nombre) return { ok: false, error: 'Completa usuario, contraseña y nombre.' }
    if (db.users[id]) return { ok: false, error: 'Ese nombre de usuario ya está en uso.' }

    if (supabase && isSupabaseEnabled()) {
      try {
        const authEmail = toSupabaseEmail(id)
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            data: {
              username: id,
              nombre,
              avatar: avatar || '🙂',
              carrera: carrera || '',
              ciclo: ciclo || '',
            },
          },
        })

        if (error) {
          return { ok: false, error: error.message }
        }

        dispatch({
          type: 'REGISTER_USER',
          payload: { username: id, password, nombre, avatar, carrera, ciclo },
        })

        if (data?.user) {
          await syncSupabaseProfile(id, { nombre, avatar, carrera, ciclo, rol: 'usuario', xp: 0, racha: 0, mejorRacha: 0, ultimaActividad: null, activo: true })
        }

        setUserId(id)
        return { ok: true }
      } catch (error) {
        console.warn('Fallo al registrar con Supabase:', error)
      }
    }

    dispatch({ type: 'REGISTER_USER', payload: { username: id, password, nombre, avatar, carrera, ciclo } })
    setUserId(id)
    return { ok: true }
  }

  async function logout() {
    if (supabase && isSupabaseEnabled()) {
      await supabase.auth.signOut().catch(() => {})
    }
    setUserId(null)
  }

  // Recuperación local: el flujo de restablecimiento sigue siendo local hasta conectar un servicio de email real.
  function resetPassword(username, nuevaPassword) {
    const id = username.toLowerCase().trim()
    if (!db.users[id]) return { ok: false, error: 'No existe una cuenta con ese usuario.' }
    dispatch({ type: 'RESET_PASSWORD', userId: id, password: nuevaPassword })
    return { ok: true }
  }

  const value = {
    user,
    isSuperadmin: user?.rol === 'superadmin',
    login,
    register,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
