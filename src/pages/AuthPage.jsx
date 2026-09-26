import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const AVATARES = ['🙂', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🦉', '🐙', '🐢']

export default function AuthPage() {
  const { login, register, resetPassword } = useAuth()
  const [modo, setModo] = useState('login') // login | registro | reset
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [regForm, setRegForm] = useState({ username: '', password: '', nombre: '', carrera: '', ciclo: '', avatar: AVATARES[0] })
  const [resetForm, setResetForm] = useState({ username: '', password: '' })

  function submitLogin(e) {
    e.preventDefault()
    setError('')
    const r = login(loginForm.username, loginForm.password)
    if (!r.ok) setError(r.error)
  }

  function submitReg(e) {
    e.preventDefault()
    setError('')
    const r = register(regForm)
    if (!r.ok) setError(r.error)
  }

  function submitReset(e) {
    e.preventDefault()
    setError('')
    const r = resetPassword(resetForm.username, resetForm.password)
    if (!r.ok) setError(r.error)
    else {
      setOk('Contraseña actualizada. Ya puedes iniciar sesión.')
      setModo('login')
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="sidebar-brand-mark">SF</span>
          <h1>StudyFlow</h1>
        </div>
        <p className="auth-tagline">Entra y sabe al instante qué tienes que hacer.</p>

        {ok && <p className="auth-ok">{ok}</p>}
        {error && <p className="auth-error">{error}</p>}

        {modo === 'login' && (
          <form onSubmit={submitLogin} className="auth-form">
            <label className="field-block">
              <span>Usuario</span>
              <input value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} placeholder="Tu nombre de usuario" required />
            </label>
            <label className="field-block">
              <span>Contraseña</span>
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </label>
            <button type="submit" className="btn-primary auth-submit">Entrar</button>
            <div className="auth-links">
              <button type="button" onClick={() => setModo('registro')}>Crear cuenta</button>
              <button type="button" onClick={() => setModo('reset')}>Olvidé mi contraseña</button>
            </div>
            <p className="auth-demo-hint">
              Con Supabase activado, la autenticación y los perfiles se gestionan desde la base real del proyecto.
            </p>
          </form>
        )}

        {modo === 'registro' && (
          <form onSubmit={submitReg} className="auth-form">
            <label className="field-block">
              <span>Nombre completo</span>
              <input value={regForm.nombre} onChange={(e) => setRegForm({ ...regForm, nombre: e.target.value })} required />
            </label>
            <label className="field-block">
              <span>Usuario</span>
              <input value={regForm.username} onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} required />
            </label>
            <label className="field-block">
              <span>Contraseña</span>
              <input type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} required />
            </label>
            <div className="form-grid">
              <label className="field-block">
                <span>Carrera</span>
                <input value={regForm.carrera} onChange={(e) => setRegForm({ ...regForm, carrera: e.target.value })} />
              </label>
              <label className="field-block">
                <span>Ciclo</span>
                <input value={regForm.ciclo} onChange={(e) => setRegForm({ ...regForm, ciclo: e.target.value })} placeholder="ej. 7°" />
              </label>
            </div>
            <div className="field-block">
              <span>Avatar</span>
              <div className="avatar-picker">
                {AVATARES.map((a) => (
                  <button
                    type="button"
                    key={a}
                    className={regForm.avatar === a ? 'active' : ''}
                    onClick={() => setRegForm({ ...regForm, avatar: a })}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary auth-submit">Crear cuenta</button>
            <div className="auth-links">
              <button type="button" onClick={() => setModo('login')}>Ya tengo cuenta</button>
            </div>
          </form>
        )}

        {modo === 'reset' && (
          <form onSubmit={submitReset} className="auth-form">
            <p className="auth-note">
              Este flujo funciona como respaldo local. Con Supabase operativo, la recuperación real se conectaría a Auth + email de la plataforma.
            </p>
            <label className="field-block">
              <span>Usuario</span>
              <input value={resetForm.username} onChange={(e) => setResetForm({ ...resetForm, username: e.target.value })} required />
            </label>
            <label className="field-block">
              <span>Nueva contraseña</span>
              <input type="password" value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} required />
            </label>
            <button type="submit" className="btn-primary auth-submit">Actualizar contraseña</button>
            <div className="auth-links">
              <button type="button" onClick={() => setModo('login')}>Volver</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
