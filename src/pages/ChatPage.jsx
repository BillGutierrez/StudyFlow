import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import { EMOJIS_PERMITIDOS, EDIT_WINDOW_MS } from '../lib/reducer'
import { hasSupabaseConnection, addChatMessage, updateChatMessage, deleteChatMessage } from '../lib/supabaseService'

export default function ChatPage() {
  const { db, dispatch } = useAppData()
  const { user, isSuperadmin } = useAuth()
  const [texto, setTexto] = useState('')
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [reportando, setReportando] = useState(null)
  const [muteando, setMuteando] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  const silenciado = user.silenciadoHasta && user.silenciadoHasta > Date.now()

  const mensajes = Object.values(db.chat || {}).sort((a, b) => (Number(b.fijado) - Number(a.fijado)) || b.fecha - a.fecha)
  const mensajesHoy = mensajes.filter((m) => new Date(m.fecha).toDateString() === new Date().toDateString()).length
  const fijados = mensajes.filter((m) => m.fijado).length
  const miembrosActivos = new Set(mensajes.slice(0, 20).map((m) => m.userId)).size

  const mensajesFiltrados = mensajes.filter((m) => {
    if (filtro === 'fijados') return m.fijado
    if (filtro === 'mios') return m.userId === user.id
    return true
  })

  async function enviar(e) {
    e.preventDefault()
    const valor = texto.trim()
    if (!valor || silenciado) return

    if (hasSupabaseConnection()) {
      await addChatMessage({ texto: valor })
    } else {
      dispatch({ type: 'ADD_CHAT', userId: user.id, texto: valor })
    }

    setTexto('')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Chat general</h1>
        <p className="ink-soft">Espacio de comunidad, anuncios rápidos y coordinación entre compañeros.</p>
      </header>

      <div className="chat-summary-grid">
        <div className="chat-summary-card">
          <span>Mensajes hoy</span>
          <strong>{mensajesHoy}</strong>
        </div>
        <div className="chat-summary-card">
          <span>Fijados</span>
          <strong>{fijados}</strong>
        </div>
        <div className="chat-summary-card">
          <span>Activos</span>
          <strong>{miembrosActivos}</strong>
        </div>
      </div>

      <div className="chat-box card">
        <div className="chat-toolbar">
          <div className="segmented-control">
            {['todos', 'fijados', 'mios'].map((item) => (
              <button
                key={item}
                type="button"
                className={filtro === item ? 'active' : ''}
                onClick={() => setFiltro(item)}
              >
                {item === 'todos' ? 'Todos' : item === 'fijados' ? 'Fijados' : 'Mis mensajes'}
              </button>
            ))}
          </div>
          <span className="chip subtle">{mensajesFiltrados.length} vistos</span>
        </div>

        <ul className="chat-messages">
          {mensajesFiltrados.map((m) => {
            const autor = db.users[m.userId]
            const puedeEditar = m.userId === user.id && Date.now() - m.fecha < EDIT_WINDOW_MS
            const fecha = new Date(m.fecha)
            return (
              <li key={m.id} className={m.fijado ? 'pinned' : ''}>
                <Avatar user={autor} size={32} />
                <div className="comment-body chat-message-body">
                  <div className="comment-meta">
                    <strong>{autor?.nombre}</strong>
                    <span className="ink-soft">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                    {m.editadoEn && <span className="ink-soft">(editado)</span>}
                    {m.fijado && <span className="pin-tag">Fijado</span>}
                    {m.reportado && <span className="chat-status warning">Reportado</span>}
                  </div>
                  {editing === m.id ? (
                    <div className="comment-edit">
                      <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <button type="button" className="btn-primary" onClick={async () => {
                        if (hasSupabaseConnection()) {
                          await updateChatMessage(m.id, editText.trim())
                        } else {
                          dispatch({ type: 'EDIT_CHAT', id: m.id, userId: user.id, texto: editText.trim() })
                        }
                        setEditing(null)
                      }}>Guardar</button>
                      <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <p className="chat-message-text">{m.texto}</p>
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
                      <button type="button" className="link-btn" onClick={async () => {
                        if (hasSupabaseConnection()) {
                          await deleteChatMessage(m.id)
                        } else {
                          dispatch({ type: 'DELETE_CHAT', id: m.id, userId: user.id, isAdmin: isSuperadmin })
                        }
                      }}>Eliminar</button>
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

        <form className="comment-form chat-composer" onSubmit={enviar}>
          <Avatar user={user} size={32} />
          <textarea
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault(); enviar(e)
              }
            }}
            disabled={silenciado}
            placeholder={silenciado ? 'Estás silenciado temporalmente por un administrador' : 'Comparte una actualización, pregunta o anuncio con el grupo…'}
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
