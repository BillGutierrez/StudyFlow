import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { getTheme, setTheme } from '../lib/theme'
import * as notif from '../lib/notifications'

export default function AjustesPage() {
  const { db } = useAppData()
  const { user, resetPassword } = useAuth()
  const [theme, setThemeState] = useState(getTheme())
  const [permission, setPermission] = useState(notif.getPermission())
  const [prefs, setPrefsState] = useState(notif.getPrefs())
  const [testMsg, setTestMsg] = useState('')
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
          Al ser una app sin servidor propio, los avisos solo llegan mientras StudyFlow está abierto en el navegador.
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
          Todos tus datos (tareas, comentarios, progreso) se guardan solo en este navegador. Nada se envía a un servidor —
          por ahora, StudyFlow es una demo local. Si cambias de dispositivo o navegador, no verás la misma información.
        </p>
      </section>
    </div>
  )
}
