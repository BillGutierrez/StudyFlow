import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import { EMOJIS_PERMITIDOS, EDIT_WINDOW_MS } from '../lib/reducer'

export default function ChatPage() {
  const { db, dispatch } = useAppData()
  const { user, isSuperadmin } = useAuth()
  const [texto, setTexto] = useState('')
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [reportando, setReportando] = useState(null)
  const [muteando, setMuteando] = useState(null)

  const silenciado = user.silenciadoHasta && user.silenciadoHasta > Date.now()

  const mensajes = Object.values(db.chat).sort((a, b) => (b.fijado - a.fijado) || a.fecha - b.fecha)

  function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || silenciado) return
    dispatch({ type: 'ADD_CHAT', userId: user.id, texto: texto.trim() })
    setTexto('')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Chat general</h1>
        <p className="ink-soft">Un solo canal para todo el grupo. Moderado por el Superadmin.</p>
      </header>

      <div className="chat-box card">
        <ul className="chat-messages">
          {mensajes.map((m) => {
            const autor = db.users[m.userId]
            const puedeEditar = m.userId === user.id && Date.now() - m.fecha < EDIT_WINDOW_MS
            return (
              <li key={m.id} className={m.fijado ? 'pinned' : ''}>
                <Avatar user={autor} size={32} />
                <div className="comment-body">
                  <div className="comment-meta">
                    <strong>{autor?.nombre}</strong>
                    <span className="ink-soft">{new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                    {m.editadoEn && <span className="ink-soft">(editado)</span>}
                    {m.fijado && <span className="pin-tag">Fijado</span>}
                  </div>
                  {editing === m.id ? (
                    <div className="comment-edit">
                      <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <button type="button" className="btn-primary" onClick={() => { dispatch({ type: 'EDIT_CHAT', id: m.id, userId: user.id, texto: editText.trim() }); setEditing(null) }}>Guardar</button>
                      <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <p>{m.texto}</p>
                  )}
                  <div className="comment-actions">
                    {EMOJIS_PERMITIDOS.map((e) => {
                      const count = m.reacciones[e]?.length || 0
                      const reaccioné = m.reacciones[e]?.includes(user.id)
                      return (
                        <button key={e} type="button" className={`reaction${reaccioné ? ' active' : ''}`} onClick={() => dispatch({ type: 'REACT_CHAT', id: m.id, emoji: e, userId: user.id })}>
                          {e} {count > 0 && count}
                        </button>
                      )
                    })}
                    {puedeEditar && <button type="button" className="link-btn" onClick={() => { setEditing(m.id); setEditText(m.texto) }}>Editar</button>}
                    {(m.userId === user.id || isSuperadmin) && (
                      <button type="button" className="link-btn" onClick={() => dispatch({ type: 'DELETE_CHAT', id: m.id, userId: user.id, isAdmin: isSuperadmin })}>Eliminar</button>
                    )}
                    {m.userId !== user.id && !m.reportado && (
                      <button type="button" className="link-btn" onClick={() => setReportando(m.id)}>Reportar</button>
                    )}
                    {isSuperadmin && (
                      <>
                        <button type="button" className="link-btn" onClick={() => dispatch({ type: 'PIN_CHAT', id: m.id })}>{m.fijado ? 'Desfijar' : 'Fijar'}</button>
                        {m.userId !== user.id && <button type="button" className="link-btn" onClick={() => setMuteando(m.userId)}>Silenciar</button>}
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <form className="comment-form" onSubmit={enviar}>
          <Avatar user={user} size={32} />
          <input
            type="text"
            placeholder={silenciado ? 'Estás silenciado temporalmente por un administrador' : 'Escribe un mensaje…'}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={silenciado}
          />
          <button type="submit" className="btn-primary" disabled={silenciado}>Enviar</button>
        </form>
      </div>

      <ConfirmDialog
        open={!!reportando}
        title="Reportar mensaje"
        message="Se le avisará al Superadmin para que lo revise."
        confirmLabel="Reportar"
        danger
        onConfirm={() => { dispatch({ type: 'REPORT_CHAT', id: reportando, userId: user.id, motivo: 'reportado por usuario' }); setReportando(null) }}
        onCancel={() => setReportando(null)}
      />
      <ConfirmDialog
        open={!!muteando}
        title="¿Silenciar a este usuario?"
        message="No podrá escribir en el chat general durante 30 minutos."
        confirmLabel="Silenciar 30 min"
        danger
        onConfirm={() => { dispatch({ type: 'MUTE_USER', userId: muteando, minutos: 30 }); setMuteando(null) }}
        onCancel={() => setMuteando(null)}
      />
    </div>
  )
}
