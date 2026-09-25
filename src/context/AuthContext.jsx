import { createContext, useContext, useEffect, useState } from 'react'
import { loadSession, saveSession } from '../lib/store'
import { useAppData } from './AppDataContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { db, dispatch } = useAppData()
  const [userId, setUserId] = useState(() => loadSession())

  useEffect(() => {
    saveSession(userId)
  }, [userId])

  const user = userId ? db.users[userId] : null

  function login(username, password) {
    const id = username.toLowerCase().trim()
    const u = db.users[id]
    if (!u) return { ok: false, error: 'No existe una cuenta con ese usuario.' }
    if (!u.activo) return { ok: false, error: 'Esta cuenta fue desactivada por el administrador.' }
    if (u.password !== password) return { ok: false, error: 'Contraseña incorrecta.' }
    dispatch({ type: 'TOUCH_LOGIN', userId: id })
    setUserId(id)
    return { ok: true }
  }

  function register({ username, password, nombre, avatar, carrera, ciclo }) {
    const id = username.toLowerCase().trim()
    if (!id || !password || !nombre) return { ok: false, error: 'Completa usuario, contraseña y nombre.' }
    if (db.users[id]) return { ok: false, error: 'Ese nombre de usuario ya está en uso.' }
    dispatch({ type: 'REGISTER_USER', payload: { username: id, password, nombre, avatar, carrera, ciclo } })
    setUserId(id)
    return { ok: true }
  }

  function logout() {
    setUserId(null)
  }

  // Recuperación mock: sin backend de correo real, se resetea localmente.
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
