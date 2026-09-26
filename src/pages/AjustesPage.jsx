import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { getTheme, setTheme } from '../lib/theme'
import * as notif from '../lib/notifications'
import { isSupabaseEnabled } from '../lib/supabaseDb'

export default function AjustesPage() {
  const { db } = useAppData()
  const { user, resetPassword } = useAuth()
  const [theme, setThemeState] = useState(getTheme())
  const [permission, setPermission] = useState(notif.getPermission())
  const [prefs, setPrefsState] = useState(notif.getPrefs())
  const [testMsg, setTestMsg] = useState('')
  const supabaseActive = isSupabaseEnabled()
  const [pwForm, setPwForm] = useState({ actual: '', nueva: '' })
  const [pwMsg, setPwMsg] = useState('')

  function cambiarTema(t) {
    setTheme(t)
    setThemeState(t)
  }

  async function activarNotificaciones() {
    const r = await notif.requestPermission()
    setPermission(r)
    if (r === 'granted') notif.revisarYAvisar(db, user.id, { force: true })
  }

  function actualizarPref(key, value) {
    const next = { ...prefs, [key]: value }
    setPrefsState(next)
    notif.setPrefs(next)
  }

  function probar() {
    const r = notif.revisarYAvisar(db, user.id, { force: true })
    setTestMsg(r ? `Aviso enviado: ${r.join(' · ')}` : 'No tienes tareas vencidas ni que venzan hoy, así que no se envió nada.')
  }

  function cambiarPassword(e) {
    e.preventDefault()
    if (pwForm.actual !== user.password) {
      setPwMsg('La contraseña actual no coincide.')
      return
    }
    resetPassword(user.username, pwForm.nueva)
    setPwMsg('Contraseña actualizada.')
    setPwForm({ actual: '', nueva: '' })
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Ajustes</h1>
      </header>

      <section className="card">
        <h2>Apariencia</h2>
        <div className="theme-picker">
          {[
            { id: 'light', label: '☀️ Claro' },
            { id: 'dark', label: '🌙 Oscuro' },
            { id: 'system', label: '🖥️ Sistema' },
          ].map((t) => (
            <button key={t.id} type="button" className={theme === t.id ? 'active' : ''} onClick={() => cambiarTema(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Notificaciones</h2>
        {!notif.isSupported() ? (
          <p>Tu navegador no soporta notificaciones web.</p>
        ) : permission === 'denied' ? (
          <p>Bloqueaste las notificaciones para este sitio. Actívalas desde los ajustes del navegador si quieres recibir avisos.</p>
        ) : permission !== 'granted' ? (
          <>
            <p className="ink-soft">Te avisamos, una vez al día, si tienes tareas vencidas o que vencen hoy.</p>
            <button type="button" className="btn-primary" onClick={activarNotificaciones}>Activar notificaciones</button>
          </>
        ) : (
          <>
            <label className="settings-toggle">
              <input type="checkbox" checked={prefs.sonido} onChange={(e) => actualizarPref('sonido', e.target.checked)} />
              <span>Sonido al recibir un aviso</span>
            </label>
            <label className="settings-toggle">
              <input type="checkbox" checked={prefs.vibracion} onChange={(e) => actualizarPref('vibracion', e.target.checked)} />
              <span>Vibración (en celular)</span>
            </label>
            <button type="button" className="btn-secondary" onClick={probar}>Probar ahora</button>
            {testMsg && <p className="settings-note">{testMsg}</p>}
          </>
        )}
        <p className="settings-caveat">
          {supabaseActive
            ? 'La app está conectada a Supabase y los avisos se disparan desde la sesión activa del navegador.'
            : 'La app está en modo local de demostración; la base real se activa al configurar Supabase y el entorno de variables.'}
        </p>
      </section>

      <section className="card">
        <h2>Cuenta</h2>
        <form className="task-form" onSubmit={cambiarPassword}>
          {pwMsg && <p className="settings-note">{pwMsg}</p>}
          <div className="form-grid">
            <label className="field-block">
              <span>Contraseña actual</span>
              <input type="password" value={pwForm.actual} onChange={(e) => setPwForm({ ...pwForm, actual: e.target.value })} />
            </label>
            <label className="field-block">
              <span>Nueva contraseña</span>
              <input type="password" value={pwForm.nueva} onChange={(e) => setPwForm({ ...pwForm, nueva: e.target.value })} />
            </label>
          </div>
          <button type="submit" className="btn-secondary">Cambiar contraseña</button>
        </form>
      </section>

      <section className="card">
        <h2>Privacidad</h2>
        <p className="ink-soft">
          {supabaseActive
            ? 'Todos tus datos se sincronizan con la base de Supabase y se mantienen disponibles en la sesión real del proyecto.'
            : 'Actualmente la información todavía vive principalmente en este navegador como respaldo local de demostración. Si activas Supabase, la sincronización real será la fuente principal.'}
        </p>
      </section>
    </div>
  )
}
